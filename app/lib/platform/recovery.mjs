/** Exchange a recovery link explicitly with the shared Auth client.
 * Invalid/expired credentials must not fall through to an unrelated session.
 * @param {any} auth @param {string} href
 * @returns {Promise<boolean>}
 */
export async function establishRecoverySession(auth, href) {
  const url = new URL(href);
  const query = url.searchParams;
  const fragment = new URLSearchParams(url.hash.slice(1));
  if (
    query.has("error") ||
    query.has("error_description") ||
    fragment.has("error") ||
    fragment.has("error_description")
  )
    return false;
  const type = query.get("type") || fragment.get("type");
  if (type && type !== "recovery") return false;
  const hash = query.get("token_hash");
  const code = query.get("code");
  const access = fragment.get("access_token");
  const refresh = fragment.get("refresh_token");
  let result;
  if (hash)
    result = await auth.verifyOtp({ token_hash: hash, type: "recovery" });
  else if (code) result = await auth.exchangeCodeForSession(code);
  else if (access || refresh) {
    if (!access || !refresh || type !== "recovery") return false;
    result = await auth.setSession({
      access_token: access,
      refresh_token: refresh,
    });
  }
  if (result && (result.error || !result.data?.session)) return false;
  const { data, error } = await auth.getUser();
  return !error && !!data?.user;
}
