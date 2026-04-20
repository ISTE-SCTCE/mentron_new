import { S3Client } from '@aws-sdk/client-s3'

const endpoint = process.env.R2_ENDPOINT
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
export const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'mentron-files'

// Validation to prevent cryptic DNS errors
if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.warn('⚠️ R2 Storage configuration is incomplete. Uploads and file serving will fail until variables are added to Vercel/Env.')
}

export const s3Client = new S3Client({
    region: 'auto',
    endpoint: endpoint || 'https://missing-endpoint.invalid', // Prevent SDK from using default AWS hostname
    credentials: {
        accessKeyId: accessKeyId || 'missing',
        secretAccessKey: secretAccessKey || 'missing',
    },
})
