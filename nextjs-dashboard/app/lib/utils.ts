import { Revenue } from './definitions';
import path from 'path';
import fs from 'fs/promises';

export const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

export const formatDateToLocal = (
  dateStr: string,
  locale: string = 'en-US',
) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

export const generateYAxis = (revenue: Revenue[]) => {
  // Calculate what labels we need to display on the y-axis
  // based on highest record and in 1000s
  const yAxisLabels = [];
  const highestRecord = Math.max(...revenue.map((month) => month.revenue));
  const topLabel = Math.ceil(highestRecord / 1000) * 1000;

  for (let i = topLabel; i >= 0; i -= 1000) {
    yAxisLabels.push(`$${i / 1000}K`);
  }

  return { yAxisLabels, topLabel };
};

export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
};


// --- File Handling Configuration ---
const MAX_FILE_SIZE_MB = 2;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'customers'); // Base upload directory

/**
 * Validates the uploaded image file based on existence, type, and size.
 * Returns an array of error messages if validation fails, otherwise an empty array.
 */
export function validateImageFile(
    imageFile: FormDataEntryValue | null
): string[] {
    const errors: string[] = [];

    if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
        errors.push('Please select an image file.');
        // If no file, no need for further file validation
        return errors;
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(imageFile.type)) {
        errors.push('Invalid file type. Only JPEG, PNG, and WEBP are allowed.');
    }

    // Check file size
    if (imageFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
    }

    return errors;
}

/**
 * Saves the validated image file to the public/customers directory.
 * Returns an object with success status and either the web-accessible path or error messages.
 */
export async function saveCustomerImage(
    imageFile: File // Expect a validated File object
): Promise<{ success: true; path: string } | { success: false; errors: string[] }> {
    try {
        // --- Generate Unique Filename ---
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Sanitize filename
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