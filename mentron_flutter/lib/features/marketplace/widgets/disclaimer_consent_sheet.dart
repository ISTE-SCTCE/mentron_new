import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../services/marketplace_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// DisclaimerConsentSheet
// Modal bottom sheet shown when a buyer taps "Buy Now" on a listing.
//
// Phase 1: Disclaimer text + mandatory checkbox + "I Agree" button.
// Phase 2 (after agreement): GPay QR image, UPI ID with copy button,
//          payment proof upload, UTR input, Submit button.
// ─────────────────────────────────────────────────────────────────────────────

class DisclaimerConsentSheet extends StatefulWidget {
  final String listingId;
  final String listingTitle;
  final double price;

  const DisclaimerConsentSheet({
    super.key,
    required this.listingId,
    required this.listingTitle,
    required this.price,
  });

  @override
  State<DisclaimerConsentSheet> createState() => _DisclaimerConsentSheetState();
}

class _DisclaimerConsentSheetState extends State<DisclaimerConsentSheet> {
  bool _agreed            = false;
  bool _showPhone         = false;
  bool _showPayment       = false;
  bool _isLoadingSettings = false;
  bool _isSubmitting      = false;

  String? _qrUrl;
  String? _upiId;
  String? _profilePhone;

  File?   _proofFile;
  final _utrController = TextEditingController();
  final _phoneController = TextEditingController();

  MarketplaceService? _svc;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProfilePhone();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Initialize _svc here (not in postFrameCallback) so it is guaranteed
    // ready before the first build() call — prevents LateInitializationError
    // if the user taps a button before the first frame completes.
    _svc ??= MarketplaceService(
      Provider.of<SupabaseService>(context, listen: false).client,
    );
  }

  @override
  void dispose() {
    _utrController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _loadProfilePhone() async {
    try {
      final supa = Provider.of<SupabaseService>(context, listen: false);
      final user = supa.currentUser;
      if (user != null) {
        final res = await supa.client
            .from('profiles')
            .select('phone')
            .eq('id', user.id)
            .maybeSingle();
        if (res != null && mounted) {
          setState(() {
            _profilePhone = res['phone'] as String?;
            if (_profilePhone != null) {
              _phoneController.text = _profilePhone!;
            }
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _loadPaymentSettings() async {
    setState(() => _isLoadingSettings = true);
    try {
      final settings = await _svc!.fetchPaymentSettings();
      if (mounted) {
        setState(() {
          _qrUrl = settings['qr_image_url'];
          _upiId = settings['upi_id'];
        });
      }
    } catch (e) {
      debugPrint('[DisclaimerSheet] fetchPaymentSettings error: $e');
    } finally {
      if (mounted) setState(() => _isLoadingSettings = false);
    }
  }

  void _onAgreeTap() {
    setState(() => _showPhone = true);
  }

  void _onPhoneSubmit() {
    final phone = _phoneController.text.trim();
    if (phone.length != 10 || !RegExp(r'^\d{10}$').hasMatch(phone)) {
      _showSnack('Please enter a valid 10-digit phone number.');
      return;
    }
    setState(() {
      _showPhone = false;
      _showPayment = true;
    });
    _loadPaymentSettings();
  }

  Future<void> _pickProof() async {
    final picker = ImagePicker();
    final xFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (xFile != null && mounted) {
      setState(() => _proofFile = File(xFile.path));
    }
  }

  Future<void> _submitPayment() async {
    if (_proofFile == null) {
      _showSnack('Please upload your payment screenshot.');
      return;
    }
    final utrText = _utrController.text.trim();
    if (utrText.length != 12 || !RegExp(r'^\d{12}$').hasMatch(utrText)) {
      _showSnack('Please enter a valid 12-digit UPI Transaction ID (numbers only).');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final supa  = Provider.of<SupabaseService>(context, listen: false);
      final buyer = supa.currentUser;
      if (buyer == null) throw Exception('Not signed in');

      // Upload proof screenshot
      final proofUrl = await _svc!.uploadPaymentProof(_proofFile!, buyer.id);

      // Create order row
      await _svc!.createOrder(
        listingId:      widget.listingId,
        buyerId:        buyer.id,
        amount:         widget.price,
        paymentProofUrl: proofUrl,
        utrNumber:      utrText,
        phoneNumber:    _phoneController.text.trim(),
      );

      if (mounted) {
        await showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            backgroundColor: const Color(0xFF1E1C31),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            title: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.check_circle_rounded,
                  color: Colors.greenAccent,
                  size: 54,
                ),
                SizedBox(height: 16),
                Text(
                  'Submitted for Review',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
              ],
            ),
            content: const Text(
              'Your payment details have been successfully submitted! The EXECOM team will verify it shortly. 🎉',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white70,
                fontSize: 14,
                height: 1.5,
              ),
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7B6EF6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                ),
                child: const Text(
                  'OK',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        );
        Navigator.pop(context, true); // signal success to parent
      }
    } catch (e) {
      if (mounted) _showSnack('Error: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating),
    );
  }

  void _copyUpi() {
    if (_upiId == null) return;
    Clipboard.setData(ClipboardData(text: _upiId!));
    _showSnack('UPI ID copied! ✓');
  }

  @override
  Widget build(BuildContext context) {
    double initialSize = 0.6;
    if (_showPhone) {
      initialSize = 0.55;
    } else if (_showPayment) {
      initialSize = 0.92;
    }

    return DraggableScrollableSheet(
      initialChildSize: initialSize,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      expand: false,
      builder: (_, controller) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            children: [
              // Handle bar
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE5E3F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 8),

              // Scrollable content
              Expanded(
                child: SingleChildScrollView(
                  controller: controller,
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
                  child: _showPayment
                      ? _buildPaymentSection()
                      : (_showPhone ? _buildPhoneSection() : _buildDisclaimerSection()),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ── Phase 1: Disclaimer ────────────────────────────────────────────────────

  Widget _buildDisclaimerSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Payment Notice', style: MarketplaceTheme.heading(20)),
        const SizedBox(height: 16),

        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: MarketplaceTheme.purpleSoft,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            'The payment you make goes directly into ISTE\'s account. '
            'ISTE will then release the payment to the seller, and the '
            'product will be issued to you by ISTE.\n\n'
            'If the item is not received within 24 hours of confirmed '
            'payment, ISTE will process a full refund. By proceeding, '
            'you agree to these terms.',
            style: MarketplaceTheme.body_(14, color: MarketplaceTheme.ink),
          ),
        ),

        const SizedBox(height: 20),

        // Checkbox
        GestureDetector(
          onTap: () => setState(() => _agreed = !_agreed),
          child: Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  gradient: _agreed ? MarketplaceTheme.heroGradient : null,
                  border: Border.all(
                    color: _agreed
                        ? Colors.transparent
                        : MarketplaceTheme.body,
                    width: 1.5,
                  ),
                ),
                child: _agreed
                    ? const Icon(Icons.check_rounded, color: Colors.white, size: 16)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'I have read and agree to the terms above',
                  style: MarketplaceTheme.label(14, color: MarketplaceTheme.ink),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // "I Agree" button
        SizedBox(
          width: double.infinity,
          child: GestureDetector(
            onTap: _agreed ? _onAgreeTap : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              height: 52,
              decoration: BoxDecoration(
                gradient: _agreed ? MarketplaceTheme.heroGradient : null,
                color: _agreed ? null : const Color(0xFFE5E3F0),
                borderRadius: BorderRadius.circular(26),
              ),
              child: Center(
                child: Text(
                  'I Agree — Show Payment Details',
                  style: GoogleFonts.baloo2(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: _agreed ? Colors.white : MarketplaceTheme.body,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── Phase 2: Payment Details ───────────────────────────────────────────────

  Widget _buildPaymentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Complete Payment', style: MarketplaceTheme.heading(20)),
        Text(
          'Pay ₹${widget.price.toStringAsFixed(0)} to the ISTE SCTCE GPay account',
          style: MarketplaceTheme.body_(13),
        ),
        const SizedBox(height: 20),

        if (_isLoadingSettings)
          const Center(
            child: CircularProgressIndicator(color: Color(0xFF7B6EF6)),
          )
        else ...[
          // ── QR Code ─────────────────────────────────────────────────────
          Center(
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: MarketplaceTheme.background,
                borderRadius: BorderRadius.circular(20),
                boxShadow: MarketplaceTheme.cardShadow,
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: _qrUrl != null
                    ? CachedNetworkImage(
                        imageUrl: _qrUrl!,
                        fit: BoxFit.contain,
                        placeholder: (_, __) => const Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFF7B6EF6),
                          ),
                        ),
                        errorWidget: (_, __, ___) => const Center(
                          child: Icon(Icons.qr_code_2_rounded,
                              size: 80, color: Color(0xFF7B6EF6)),
                        ),
                      )
                    : const Center(
                        child: Icon(Icons.qr_code_2_rounded,
                            size: 80, color: Color(0xFF7B6EF6)),
                      ),
              ),
            ),
          ),

          const SizedBox(height: 16),

          // ── UPI ID with Copy button ──────────────────────────────────────
          if (_upiId != null && _upiId!.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: MarketplaceTheme.purpleSoft,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Icon(Icons.account_balance_wallet_outlined,
                      color: Color(0xFF7B6EF6), size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'UPI ID',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: MarketplaceTheme.purple,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          _upiId!,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: MarketplaceTheme.ink,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _copyUpi,
                    icon: const Icon(Icons.copy_rounded),
                    color: MarketplaceTheme.purple,
                    iconSize: 20,
                    tooltip: 'Copy UPI ID',
                  ),
                ],
              ),
            ),

          const SizedBox(height: 20),
        ],

        // ── Upload proof ─────────────────────────────────────────────────
        Text('Upload Payment Screenshot', style: MarketplaceTheme.heading(15)),
        const SizedBox(height: 10),

        GestureDetector(
          onTap: _pickProof,
          child: Container(
            height: 120,
            decoration: BoxDecoration(
              color: MarketplaceTheme.background,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _proofFile != null
                    ? MarketplaceTheme.purple
                    : const Color(0xFFE5E3F0),
                width: 1.5,
              ),
            ),
            child: _proofFile != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.file(_proofFile!, fit: BoxFit.cover),
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.upload_file_rounded,
                          color: MarketplaceTheme.purple, size: 32),
                      const SizedBox(height: 8),
                      Text(
                        'Tap to upload screenshot',
                        style: MarketplaceTheme.label(13,
                            color: MarketplaceTheme.purple),
                      ),
                    ],
                  ),
          ),
        ),

        const SizedBox(height: 16),

        // ── UTR input ────────────────────────────────────────────────────
        Text('UPI Transaction ID / UTR', style: MarketplaceTheme.heading(15)),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: MarketplaceTheme.background,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E3F0), width: 1.5),
          ),
          child: TextField(
            controller: _utrController,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(12),
            ],
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: MarketplaceTheme.ink,
            ),
            decoration: InputDecoration(
              hintText: 'Enter 12-digit transaction ID',
              hintStyle: MarketplaceTheme.body_(14),
              prefixIcon: const Icon(Icons.numbers_rounded,
                  color: Color(0xFF8D8AA0), size: 18),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Please enter the 12-digit transaction ID. Note: Transaction ID refers to the UPI transaction ID or UTR number shown in your GPay / PhonePe / Paytm payment screen.',
          style: MarketplaceTheme.body_(11, color: Colors.grey),
        ),

        const SizedBox(height: 24),

        // ── Submit button ────────────────────────────────────────────────
        SizedBox(
          width: double.infinity,
          child: GestureDetector(
            onTap: _isSubmitting ? null : _submitPayment,
            child: Container(
              height: 52,
              decoration: BoxDecoration(
                gradient: MarketplaceTheme.heroGradient,
                borderRadius: BorderRadius.circular(26),
                boxShadow: [
                  BoxShadow(
                    color: MarketplaceTheme.purple.withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Center(
                child: _isSubmitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        'Submit Payment Proof',
                        style: GoogleFonts.baloo2(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ),
        ),
      ],
    );
  }
  Widget _buildPhoneSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Contact Information', style: MarketplaceTheme.heading(20)),
        const SizedBox(height: 8),
        Text(
          'Please confirm your phone number. Sellers or EXECOM will use this to contact you for the product handoff.',
          style: MarketplaceTheme.body_(13),
        ),
        const SizedBox(height: 20),

        Container(
          decoration: BoxDecoration(
            color: MarketplaceTheme.background,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E3F0), width: 1.5),
          ),
          child: TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(10),
            ],
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: MarketplaceTheme.ink,
            ),
            decoration: InputDecoration(
              hintText: 'Enter 10-digit Mobile Number',
              hintStyle: MarketplaceTheme.body_(14),
              prefixIcon: const Icon(Icons.phone_android_rounded,
                  color: Color(0xFF8D8AA0), size: 18),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
          ),
        ),

        const SizedBox(height: 24),

        SizedBox(
          width: double.infinity,
          child: GestureDetector(
            onTap: _onPhoneSubmit,
            child: Container(
              height: 52,
              decoration: BoxDecoration(
                gradient: MarketplaceTheme.heroGradient,
                borderRadius: BorderRadius.circular(26),
                boxShadow: [
                  BoxShadow(
                    color: MarketplaceTheme.purple.withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  'Confirm & Proceed to Payment',
                  style: GoogleFonts.baloo2(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
