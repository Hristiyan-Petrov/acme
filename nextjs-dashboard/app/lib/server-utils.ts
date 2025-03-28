// lib/server-utils.ts
// NO LONGER NEED path or fs here for saving! Keep 'server-only'
import 'server-only';
// Import the Vercel Blob client-side 'put' function
import { put } from '@vercel/blob';

/**
 * Uploads the customer image file to Vercel Blob storage.
 * Returns an object with success status and either the public blob URL or error messages.
 * SERVER-ONLY: This interacts with Vercel Blob storage.
 */
export async function saveCustomerImage(
    imageFile: File // Expect a validated File object
): Promise<{ success: true; url: string } | { success: false; errors: string[] }> {
    // Ensure 'server-only' prevents client-side import during build
    try {
        // Generate a unique filename if desired, or let Vercel Blob handle it partly.
        // Adding a path prefix is good practice.
        const filename = `customers/${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;

        // Upload the file to Vercel Blob
        const blob = await put(
            filename, // The path/filename within your blob store
            imageFile,
            {
                access: 'public', // Make the blob publicly accessible
                // Optional: Add caching headers if needed
                // cacheControlMaxAge: 3600,
            }
        );

        // 'put' returns an object with the public URL
        return { success: true, url: blob.url };

    } catch (error) {
        console.error('Failed to upload image to Vercel Blob:', error);
        // Provide a more user-friendly error
        if (error instanceof Error && error.message.includes('size')) {
             return { success: false, errors: ['File size limit exceeded for storage.'] };
        }
        return {
            success: false,
            errors: ['Could not save the uploaded image. Please try again.'],
        };
    }
}

// --- Keep validation logic separate if needed, or integrate basic checks ---
// You might still want MAX_FILE_SIZE_MB and ALLOWED_MIME_TYPES defined
// elsewhere (e.g., utils.ts) for client-side feedback or pre-validation,
// even though Vercel Blob might have its own limits.