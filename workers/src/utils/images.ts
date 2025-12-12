import { Env } from '../index';

export interface CloudflareImageUploadResponse {
    success: boolean;
    result?: {
        id: string;
        filename: string;
        uploaded: string;
        requireSignedURLs: boolean;
        variants: string[];
    };
    errors?: Array<{ code: number; message: string }>;
}

/**
 * Upload image to Cloudflare Images
 * Docs: https://developers.cloudflare.com/images/upload-images/upload-via-api/
 */
export async function uploadToCloudflareImages(
    env: Env,
    file: File,
    metadata?: Record<string, string>
): Promise<string | null> {
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_IMAGES_TOKEN) {
        console.warn('Cloudflare Images not configured, skipping upload');
        return null;
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        // Add metadata if provided
        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.CLOUDFLARE_IMAGES_TOKEN}`,
                },
                body: formData,
            }
        );

        const result: CloudflareImageUploadResponse = await response.json();

        if (!result.success || !result.result) {
            console.error('Cloudflare Images upload failed:', result.errors);
            return null;
        }

        // Return the image ID
        return result.result.id;
    } catch (error) {
        console.error('Error uploading to Cloudflare Images:', error);
        return null;
    }
}

/**
 * Get Cloudflare Images URL with variant
 * Variants: public (default), thumbnail, avatar, etc.
 * Docs: https://developers.cloudflare.com/images/transform-images/transform-via-url/
 */
export function getCloudflareImageUrl(
    env: Env,
    imageId: string,
    variant: string = 'public'
): string | null {
    if (!env.CLOUDFLARE_ACCOUNT_ID) {
        return null;
    }

    // Format: https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/<VARIANT>
    // Note: Account hash is available in Cloudflare Dashboard > Images
    return `https://imagedelivery.net/${env.CLOUDFLARE_ACCOUNT_ID}/${imageId}/${variant}`;
}

/**
 * Delete image from Cloudflare Images
 */
export async function deleteFromCloudflareImages(
    env: Env,
    imageId: string
): Promise<boolean> {
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_IMAGES_TOKEN) {
        return false;
    }

    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${env.CLOUDFLARE_IMAGES_TOKEN}`,
                },
            }
        );

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error deleting from Cloudflare Images:', error);
        return false;
    }
}

/**
 * Generate responsive image URLs for different variants
 */
export function getResponsiveImageUrls(env: Env, imageId: string) {
    return {
        thumbnail: getCloudflareImageUrl(env, imageId, 'thumbnail'),
        medium: getCloudflareImageUrl(env, imageId, 'medium'),
        large: getCloudflareImageUrl(env, imageId, 'large'),
        original: getCloudflareImageUrl(env, imageId, 'public'),
    };
}
