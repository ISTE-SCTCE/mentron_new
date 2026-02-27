import sharp from 'sharp'
import zlib from 'zlib'
import { promisify } from 'util'

const gzip = promisify(zlib.gzip)

/**
 * Compresses an image by converting it to WebP with 80% quality.
 * @param buffer The original image buffer
 * @returns Compressed WebP buffer
 */
export async function compressImage(buffer: Buffer): Promise<Buffer> {
    try {
        return await sharp(buffer)
            .webp({ quality: 80 })
            .toBuffer()
    } catch (error) {
        console.error('Sharp Image Compression failed, falling back to original:', error)
        return buffer
    }
}

/**
 * Compresses any file buffer using Gzip.
 * @param buffer The original file buffer
 * @returns Gzipped buffer
 */
export async function compressFile(buffer: Buffer): Promise<Buffer> {
    try {
        return await gzip(buffer)
    } catch (error) {
        console.error('Gzip Compression failed, falling back to original:', error)
        return buffer
    }
}

/**
 * Helper to determine if a file is an image based on its name or mime-type.
 */
export function isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/')
}
