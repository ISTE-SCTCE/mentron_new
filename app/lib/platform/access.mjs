/** @typedef {'mlynq'|'mentron'} Product */
/** @param {unknown} value */
export function isProduct(value) { return value === 'mlynq' || value === 'mentron' }
/** @param {Product} product */
export function productHome(product) { return product === 'mlynq' ? '/mlynq/home' : '/mentron/dashboard' }
/** @param {any} profile @param {Date} [now] */
export function isActiveProfile(profile, now = new Date()) {
    if(!profile || profile.status !== 'active') return false
    if(profile.suspended_until == null) return true
    const until = new Date(profile.suspended_until)
    return Number.isFinite(until.getTime()) && until <= now
}
/** @param {any} profile @param {Product} product */
export function canOpenProduct(profile,product) {
    return isActiveProfile(profile) && (product === 'mlynq' ? profile.is_mlynq_user === true : profile.is_mentron_user === true)
}
const routes = new Set(['mlynq','mentron','home','qr','profile','certificates','events','attendance','history','notifications','dashboard','notes','projects','marketplace','orders','new','gate','year','semester','dept','group','folder','settings','team','leaderboard','societies','analytics','live','contributions','admin','core','privacy','members','upload','add','edit'])
/** @param {string} pathname */
export function routeTemplate(pathname) {
    return pathname.split(/[?#]/,1)[0].split('/').map(segment =>
        !segment || routes.has(segment) ? segment : ':item'
    ).join('/')
}
