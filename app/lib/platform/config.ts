export const PLATFORM_URL = 'https://vwxbgklgkcbwrvtwypfs.supabase.co'
export const PLATFORM_PUBLISHABLE_KEY = 'sb_publishable_Kd3LkzFbiBhzLO7Ktw7Zew_L0-kpv3K'
export type Product = 'mlynq' | 'mentron'
export function productHome(product: Product) {
    return product === 'mlynq' ? '/mlynq/home' : '/mentron/dashboard'
}
export function isProduct(value: unknown): value is Product {
    return value === 'mlynq' || value === 'mentron'
}
