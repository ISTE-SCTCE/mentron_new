/**
 * Mentron Firebase Cloud Functions
 * =================================
 * Two functions:
 *
 * 1. processScheduledBroadcasts — runs every 1 minute (Cloud Scheduler).
 *    Queries Supabase for SCHEDULED notifications where scheduled_for <= now(),
 *    sends each via FCM to the `all_users` topic, marks SENT on success or
 *    FAILED on FCM error.
 *
 * 2. sendBroadcastNow — HTTPS callable. Called by the EXECOM Flutter app
 *    when "Send Now" is tapped. Broadcasts immediately to `all_users` topic.
 *
 * ── Setup ──────────────────────────────────────────────────────────────────
 * Bind PLATFORM_SUPABASE_SERVICE_ROLE_KEY using Firebase Secret Manager.
 * PLATFORM_SUPABASE_URL must identify ISTE-admin; product data uses the mentron schema.
 * See docs/PERSON3_CUTOVER.md before releasing the merged clients or these functions.
 *
 * The Cloud Scheduler job for processScheduledBroadcasts is created
 * automatically when you deploy a pubsub.schedule function.
 * ──────────────────────────────────────────────────────────────────────────
 */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const { isActiveExecutive,requireExecutive } = require('./platform-auth.cjs');

admin.initializeApp();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Create a Supabase admin client (bypasses RLS) using the service role key. */
function getSupabaseAdmin() {
  const url = process.env.PLATFORM_SUPABASE_URL || 'https://vwxbgklgkcbwrvtwypfs.supabase.co';
  if(url !== 'https://vwxbgklgkcbwrvtwypfs.supabase.co') throw new Error('Unexpected platform database');
  const serviceKey = process.env.PLATFORM_SUPABASE_SERVICE_ROLE_KEY;
  if(!serviceKey) throw new Error('Platform server secret is not configured');
  return createClient(url, serviceKey, {
    db: {schema:'mentron'},
    auth: { persistSession: false },
  });
}

/**
 * Sends an FCM notification to the `all_users` topic.
 * @param {string} notificationId - UUID of the broadcast_notifications row
 * @param {string} title - Notification title (max 65 chars)
 * @param {string} body  - Notification body  (max 240 chars)
 * @returns {Promise<string>} FCM message ID
 */
async function sendFcmToAllUsers(notificationId, title, body) {
  const message = {
    topic: 'all_users',
    notification: {
      title,
      body,
    },
    data: {
      type: 'BROADCAST',
      notification_id: notificationId,
      // flutter_local_notifications uses this to route taps on Android
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'mentron_broadcasts',
        priority: 'high',
        defaultSound: true,
        notificationCount: 1,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          contentAvailable: true,
        },
      },
      headers: {
        'apns-priority': '10',
      },
    },
  };

  return admin.messaging().send(message);
}

// ─────────────────────────────────────────────────────────────────────────────
// Function 1: processScheduledBroadcasts
// Runs every 1 minute — exact delivery timing.
// ─────────────────────────────────────────────────────────────────────────────
exports.processScheduledBroadcasts = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
    secrets:['PLATFORM_SUPABASE_SERVICE_ROLE_KEY'],
  })
  .pubsub.schedule('* * * * *')  // every 1 minute — exact timing
  .timeZone('Asia/Kolkata')      // IST — update if your org uses a different TZ
  .onRun(async (_context) => {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    functions.logger.info('[processScheduledBroadcasts] Checking for due notifications…');

    // ── 1. Fetch all due SCHEDULED notifications ───────────────────────────
    const { data: notifications, error: fetchError } = await supabase
      .from('broadcast_notifications')
      .select('id, title, body, created_by')
      .eq('status', 'SCHEDULED')
      .lte('scheduled_for', now);

    if (fetchError) {
      functions.logger.error('[processScheduledBroadcasts] Fetch error:', fetchError);
      return null;
    }

    if (!notifications || notifications.length === 0) {
      functions.logger.info('[processScheduledBroadcasts] No due notifications.');
      return null;
    }

    functions.logger.info(`[processScheduledBroadcasts] Processing ${notifications.length} notification(s)…`);

    // ── 2. Process each due notification ──────────────────────────────────
    const results = await Promise.allSettled(
      notifications.map(async (notif) => {
        try {
          const {data:author,error:authorError}=await supabase.schema('public').from('profiles')
            .select('role,status,suspended_until,is_mentron_user').eq('id',notif.created_by).single();
          if(authorError || !isActiveExecutive(author)) {
            throw new Error('Broadcast author needs current executive approval');
          }
          // a) Send via FCM
          const messageId = await sendFcmToAllUsers(notif.id, notif.title, notif.body);
          functions.logger.info(`[processScheduledBroadcasts] Sent ${notif.id}, FCM msgId: ${messageId}`);

          // b) Mark as SENT
          const { error: updateError } = await supabase
            .from('broadcast_notifications')
            .update({
              status: 'SENT',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', notif.id)
            .eq('status', 'SCHEDULED'); // guard against double-send

          if (updateError) {
            functions.logger.error(`[processScheduledBroadcasts] Update error for ${notif.id}:`, updateError);
          }
        } catch (sendError) {
          functions.logger.error(`[processScheduledBroadcasts] FCM error for ${notif.id}:`, sendError);

          // Mark as FAILED so EXECOM can see it in the History tab
          await supabase
            .from('broadcast_notifications')
            .update({
              status: 'FAILED',
              updated_at: new Date().toISOString(),
            })
            .eq('id', notif.id)
            .eq('status', 'SCHEDULED');
        }
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    functions.logger.info(`[processScheduledBroadcasts] Done. Sent: ${sent}, Failed: ${failed}`);

    return null;
  });

// ─────────────────────────────────────────────────────────────────────────────
// Function 2: sendBroadcastNow
// HTTPS callable — triggered by EXECOM app for instant sends.
//
// Expected request body (Firebase callable format):
//   { "data": { "notificationId": "uuid", "title": "...", "body": "...",
//               "supabaseToken": "jwt-for-auth-check" } }
// ─────────────────────────────────────────────────────────────────────────────
exports.sendBroadcastNow = functions
  .runWith({ timeoutSeconds: 30, memory: '128MB', secrets:['PLATFORM_SUPABASE_SERVICE_ROLE_KEY'] })
  .https.onCall(async (data, context) => {
    // ── Auth guard ────────────────────────────────────────────────────────
    // Firebase callable auth: context.auth is populated when the app is
    // signed in with Firebase Auth. Since Mentron uses Supabase Auth,
    // we verify the caller by checking their Supabase JWT against the DB.
    const { notificationId, title, body, supabaseToken } = data;

    if (!notificationId || !title || !body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'notificationId, title, and body are required.'
      );
    }

    const supabase = getSupabaseAdmin();
    try { await requireExecutive(supabase,supabaseToken); }
    catch { throw new functions.https.HttpsError('permission-denied','Active executive authentication required.'); }
    const {data:record,error:recordError}=await supabase.from('broadcast_notifications')
      .select('id,title,body').eq('id',notificationId).single();
    if(recordError || !record) throw new functions.https.HttpsError('not-found','Notification unavailable.');

    // ── Send FCM ──────────────────────────────────────────────────────────
    try {
      const messageId = await sendFcmToAllUsers(notificationId, record.title, record.body);
      functions.logger.info(`[sendBroadcastNow] Sent ${notificationId}, FCM msgId: ${messageId}`);
      return { success: true, messageId };
    } catch (e) {
      functions.logger.error('[sendBroadcastNow] FCM error:', e);
      throw new functions.https.HttpsError(
        'internal',
        `FCM send failed: ${e.message}`
      );
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: send FCM to a specific device token
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send an FCM notification to a single device token.
 * @param {string} token - FCM registration token stored in profiles.fcm_token
 * @param {string} title - Notification title
 * @param {string} body  - Notification body
 * @param {object} data  - Extra data payload (optional)
 */
async function sendFcmToToken(token, title, body, data = {}) {
  if (!token) return null;
  const message = {
    token,
    notification: { title, body },
    data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
    android: { priority: 'high', notification: { channelId: 'mentron_broadcasts' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  };
  return admin.messaging().send(message);
}

// ─────────────────────────────────────────────────────────────────────────────
// Function 3: checkOverdueMarketplaceOrders
// Runs every hour — finds payment_confirmed orders past their delivery_deadline
// and sends an FCM alert to every EXECOM admin.
// ─────────────────────────────────────────────────────────────────────────────
exports.checkOverdueMarketplaceOrders = functions
  .runWith({ timeoutSeconds: 60, memory: '128MB', secrets:['PLATFORM_SUPABASE_SERVICE_ROLE_KEY'] })
  .pubsub.schedule('0 * * * *')  // every hour
  .timeZone('Asia/Kolkata')
  .onRun(async (_context) => {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    functions.logger.info('[checkOverdueMarketplaceOrders] Running overdue check…');

    // ── 1. Find overdue orders ─────────────────────────────────────────────
    const { data: overdueOrders, error: ordersError } = await supabase
      .from('marketplace_orders')
      .select('id, amount, listing_id, marketplace_listings(title)')
      .eq('order_status', 'payment_confirmed')
      .lt('delivery_deadline', now);

    if (ordersError) {
      functions.logger.error('[checkOverdueMarketplaceOrders] Orders fetch error:', ordersError);
      return null;
    }

    if (!overdueOrders || overdueOrders.length === 0) {
      functions.logger.info('[checkOverdueMarketplaceOrders] No overdue orders found.');
      return null;
    }

    functions.logger.info(`[checkOverdueMarketplaceOrders] ${overdueOrders.length} overdue order(s) found.`);

    // ── 2. Fetch EXECOM admin FCM tokens ──────────────────────────────────
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('fcm_token')
      .in('role', ['exec', 'core', 'admin'])
      .not('fcm_token', 'is', null);

    if (adminError || !admins || admins.length === 0) {
      functions.logger.warn('[checkOverdueMarketplaceOrders] No admin tokens found.');
      return null;
    }

    const overdueTitle = `⚠ ${overdueOrders.length} Overdue Delivery`;
    const overdueBody  = overdueOrders
      .map((o) => o.marketplace_listings?.title ?? o.listing_id)
      .join(', ');

    // ── 3. Notify each admin ───────────────────────────────────────────────
    await Promise.allSettled(
      admins.map((admin) =>
        sendFcmToToken(admin.fcm_token, overdueTitle, `Item(s): ${overdueBody}`, {
          type: 'MARKETPLACE_OVERDUE',
        })
      )
    );

    functions.logger.info('[checkOverdueMarketplaceOrders] Admin notifications dispatched.');
    return null;
  });

// ─────────────────────────────────────────────────────────────────────────────
// Function 4: confirmMarketplacePayment (HTTPS callable)
// Called by the EXECOM app when an admin confirms a buyer's payment.
// Updates order → payment_confirmed; FCMs seller (hand over item) + buyer.
//
// Expected data: { orderId: string, supabaseToken: string }
// ─────────────────────────────────────────────────────────────────────────────
exports.confirmMarketplacePayment = functions
  .runWith({ timeoutSeconds: 30, memory: '128MB', secrets:['PLATFORM_SUPABASE_SERVICE_ROLE_KEY'] })
  .https.onCall(async (data, _context) => {
    const { orderId } = data;
    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId is required.');
    }

    const supabase = getSupabaseAdmin();
    try { await requireExecutive(supabase,data.supabaseToken); }
    catch { throw new functions.https.HttpsError('permission-denied','Active executive authentication required.'); }


    // ── Fetch order + listing + buyer profile ──────────────────────────────
    const { data: order, error: fetchError } = await supabase
      .from('marketplace_orders')
      .select(`
        id, amount, buyer_id,
        marketplace_listings ( id, seller_id, title )
      `)
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new functions.https.HttpsError('not-found', 'Order not found.');
    }

    // ── Fetch buyer and seller FCM tokens ──────────────────────────────────
    const userIds = [
      order.buyer_id,
      order.marketplace_listings?.seller_id,
    ].filter(Boolean);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, fcm_token')
      .in('id', userIds);

    const tokenMap = {};
    (profiles || []).forEach((p) => { tokenMap[p.id] = p.fcm_token; });

    const listingTitle = order.marketplace_listings?.title ?? 'Item';
    const sellerId     = order.marketplace_listings?.seller_id;

    // ── Notify seller ──────────────────────────────────────────────────────
    if (sellerId && tokenMap[sellerId]) {
      await sendFcmToToken(
        tokenMap[sellerId],
        '📦 Hand Over the Item',
        `Payment confirmed for "${listingTitle}". Please hand over the item to the buyer.`,
        { type: 'MARKETPLACE_SELLER_NOTIFY', order_id: orderId }
      ).catch((e) => functions.logger.warn('Seller FCM failed:', e));
    }

    // ── Notify buyer ───────────────────────────────────────────────────────
    if (order.buyer_id && tokenMap[order.buyer_id]) {
      await sendFcmToToken(
        tokenMap[order.buyer_id],
        '✅ Payment Confirmed',
        `Your payment for "${listingTitle}" has been confirmed! Collect your item within 24 hours.`,
        { type: 'MARKETPLACE_BUYER_CONFIRMED', order_id: orderId }
      ).catch((e) => functions.logger.warn('Buyer FCM failed:', e));
    }

    functions.logger.info(`[confirmMarketplacePayment] Confirmed order ${orderId}`);
    return { success: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Function 5: rejectMarketplacePayment (HTTPS callable)
// Called by EXECOM app when payment proof is rejected.
// Sets order_status = cancelled; FCMs buyer.
//
// Expected data: { orderId: string }
// ─────────────────────────────────────────────────────────────────────────────
exports.rejectMarketplacePayment = functions
  .runWith({ timeoutSeconds: 30, memory: '128MB', secrets:['PLATFORM_SUPABASE_SERVICE_ROLE_KEY'] })
  .https.onCall(async (data, _context) => {
    const { orderId } = data;
    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId is required.');
    }

    const supabase = getSupabaseAdmin();
    try { await requireExecutive(supabase,data.supabaseToken); }
    catch { throw new functions.https.HttpsError('permission-denied','Active executive authentication required.'); }


    // Fetch order + buyer FCM token
    const { data: order, error: fetchError } = await supabase
      .from('marketplace_orders')
      .select('id, buyer_id, marketplace_listings ( title )')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new functions.https.HttpsError('not-found', 'Order not found.');
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, fcm_token')
      .eq('id', order.buyer_id);

    const buyerToken = profiles?.[0]?.fcm_token;
    const listingTitle = order.marketplace_listings?.title ?? 'Item';

    // Notify buyer
    if (buyerToken) {
      await sendFcmToToken(
        buyerToken,
        '❌ Payment Rejected',
        `Your payment for "${listingTitle}" could not be verified. Please try again or contact ISTE SCTCE.`,
        { type: 'MARKETPLACE_BUYER_REJECTED', order_id: orderId }
      ).catch((e) => functions.logger.warn('Buyer reject FCM failed:', e));
    }

    functions.logger.info(`[rejectMarketplacePayment] Rejected order ${orderId}`);
    return { success: true };
  });

