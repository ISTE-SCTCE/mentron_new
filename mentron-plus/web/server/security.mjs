export const contentSecurityPolicy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; media-src 'self' blob: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
export function securityHeaders(res,{https=false}={}){
 res.setHeader('Content-Security-Policy',contentSecurityPolicy);
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Permissions-Policy','camera=(self), microphone=(), geolocation=()');
 if(https)res.setHeader('Strict-Transport-Security','max-age=31536000');
}
