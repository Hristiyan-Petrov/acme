// lib/server-utils.ts
import path from 'path';
import fs from 'fs/promises'; // Use promises version for async/await
import 'server-only';

// --- File Handling Configuration ---
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'customers'); // Base upload directory

/**
 * Saves the validated image file to the public/customers directory.
 * Returns an object with success status and either the web-accessible path or error messages.
 * SERVER-ONLY: This function uses 'fs' and 'path' and should only be called from server-side code (Server Actions, API routes, etc.).
 */
export async function saveCustomerImage(
    imageFile: File // Expect a validated File object
): Promise<{ success: true; path: string } | { success: false; errors: string[] }> {
   // Ensure 'server-only' prevents client-side import during build
    try {
        // --- Generate Unique Filename ---
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalName = imageFile.name.replace(/\s+/g, '_');
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `${sanitizedBaseName}-${uniqueSuffix}${extension}`;

        // --- Prepare Save Path ---
        const filePath = path.join(UPLOAD_DIR, filename);

        // --- Ensure Directory Exists ---
        await fs.mkdir(UPLOAD_DIR, { recursive: true });

        // --- Read and Write File ---
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        await fs.writeFile(filePath, buffer);

        // --- Return Web-Accessible Path ---
        const savedImagePath = `/customers/${filename}`; // Path relative to /public
        return { success: true, path: savedImagePath };

    } catch (error) {
        console.error('Failed to save image:', error);
        return {
            success: false,
            errors: ['Could not save the uploaded image. Please try again.'],
        };
    }
}

// Add any other functions from utils.ts that *require* Node.js modules (like path if used extensively)