'use server'

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
// import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import path from 'path';
import fs from 'fs/promises';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });


// INVOICES ACTIONS

const InvoiceFormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.'
    }).min(1, { message: 'Please select a customer.' }), // Added min(1) for explicit check
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status'
    }),
    date: z.string()
});

const CreateInvoice = InvoiceFormSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoiceFormSchema.omit({ id: true, date: true });

export type InvoiceState = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
    formData?: {
        customerId?: string;
        amount?: string;
        status?: string;
    } | null;
    success?: boolean;
};

export async function createInvoice(prevState: InvoiceState, formData: FormData): Promise<InvoiceState> { // Add Promise<State> for clarity
    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };

    // Validate form using Zod
    const validatedFields = CreateInvoice.safeParse(rawFormData);

    console.log(validatedFields.error);

    // If form validation fails, return errors and the submitted data early.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing or Invalid Fields. Failed to Create Invoice.',
            // Include the raw form data (as strings)
            formData: {
                customerId: rawFormData.customerId?.toString(),
                amount: rawFormData.amount?.toString(),
                status: rawFormData.status?.toString(),
            },
            success: false,
        }
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert data into the database
    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Invoice.' + `\n ${error}`,
            success: false,
        }
    }

    revalidatePath('/dashboard/invoices'); // Update route view (renew cache / prerender)
    // redirect('/dashboard/invoices');

    return {
        message: 'Invoice created successfully!',
        success: true,
        errors: {}, // Clear any previous errors
        formData: null // Clear previous form data
    };
};

export async function updateInvoice(
    id: string,
    prevState: InvoiceState,
    formData: FormData
): Promise<InvoiceState> {
    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };

    const validatedFields = UpdateInvoice.safeParse(rawFormData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing or Invalid Fields. Failed to Create Invoice.',
            // Include the raw form data (as strings)
            formData: {
                customerId: rawFormData.customerId?.toString(),
                amount: rawFormData.amount?.toString(),
                status: rawFormData.status?.toString(),
            },
            success: false, // Explicitly false on error
        }
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        return {
            message: 'Database Error: Failed to Update Invoice.' + `\n ${error}`,
            success: false,
        }
    }

    revalidatePath('/dashboard/invoices');   // Update route view (renew cache / prerender)

    return {
        message: 'Invoice updated successfully!',
        success: true,
        errors: {}, // Clear any previous errors
        formData: null // Clear previous form data
    };

    // redirect('/dashboard/invoices');
};

export async function deleteInvoice(id: string, prevState: InvoiceState, formData: FormData): Promise<InvoiceState> {
    console.log(prevState, formData);
    if (!id) return { message: 'Missing Invoice ID.', success: false };

    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return { message: 'Invoice Deleted Successfully.', success: true };

    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Database Error: Failed to Delete Invoice.', success: false };
    }
}



// CUSTOMER ACTIONS

const CustomerFormSchema = z.object({
    id: z.string(),
    name: z.string().trim().min(3, { message: 'Please enter a customer name.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }).trim(),
});

const CreateCustomer = CustomerFormSchema.omit({ id: true });

export type CustomerState = {
    errors?: {
        name?: string[];
        email?: string[];
        imageFile?: string[];
    };
    message?: string | null;
    formData?: {
        name?: string;
        email?: string;
    } | null;
    success?: boolean;
};

export async function createCustomer(prevState: CustomerState, formData: FormData): Promise<CustomerState> {

    // --- File Handling ---
    const imageFile = formData.get('imageFile');
    let savedImagePath: string | null = null; // Path relative to /public folder (e.g., /customers/image.png)
    const MAX_FILE_SIZE_MB = 2; // Set max file size (e.g., 2MB)
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
        return {
            errors: { imageFile: ['Please add an image file.'] },
            formData: { name: formData.get('name')?.toString(), email: formData.get('email')?.toString() },
            success: false,
        };
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(imageFile.type)) {
        return {
            errors: { imageFile: ['Invalid file type. Only JPEG, PNG, and WEBP are allowed.'] },
            formData: { name: formData.get('name')?.toString(), email: formData.get('email')?.toString() },
            success: false,
        };
    }

    // Check file size
    if (imageFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return {
            errors: { imageFile: [`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`] },
            formData: { name: formData.get('name')?.toString(), email: formData.get('email')?.toString() },
            success: false,
        };
    }

    // 1. Extract data
    const rawFormData = {
        name: formData.get('name'),
        email: formData.get('email'),
    };

    // 2. Validate data
    const validatedFields = CreateCustomer.safeParse(rawFormData);

    // 3. If validation fails, return errors early
    // if (!validatedFields.success) {
    //     return {
    //         errors: validatedFields.error.flatten().fieldErrors,
    //         message: 'Missing or Invalid Fields. Failed to Create Customer.',
    //         // Include the raw form data (as strings)
    //         formData: {
    //             name: rawFormData.name?.toString(),
    //             email: rawFormData.email?.toString(),
    //             image_url: rawFormData.image_url?.toString(),
    //         },
    //         success: false,
    //     }
    // }

    if (!validatedFields.success) {
        // Combine file error (if any) with Zod errors
        // const errors = {
        //     ...prevState.errors, // Carry over potential file error? No, generate fresh.
        //     ...(prevState.errors?.imageFile ? { imageFile: prevState.errors.imageFile } : {}), // Carry file error if needed, or better generate fresh? Let's do fresh below
        //     ...validatedFields.error.flatten().fieldErrors,
        // };
        // If file validation failed above, this won't run, handle combination carefully if needed.
        // Re-check file validation if you want errors combined
        const fileErrorState = { // Re-run basic file presence check to combine errors
            ...(!imageFile || !(imageFile instanceof File) || imageFile.size === 0 ? { imageFile: ['Please select an image file.'] } : {}),
            ...(!ALLOWED_MIME_TYPES.includes(imageFile.type) ? { imageFile: ['Invalid file type.'] } : {}),
            ...(imageFile.size > MAX_FILE_SIZE_MB * 1024 * 1024 ? { imageFile: [`Max size is ${MAX_FILE_SIZE_MB}MB.`] } : {})
        }

        return {
            errors: { ...validatedFields.error.flatten().fieldErrors, ...fileErrorState },
            message: 'Missing or Invalid Fields. Failed to Create Customer.',
            formData: {
                name: formData.get('name')?.toString(),
                email: formData.get('email')?.toString(),
            },
            success: false,
        };
    }

    // 4. Prepare data for insertion
    const { name, email } = validatedFields.data;

    // --- Save the File ---
    try {
        // Generate a unique filename (e.g., using timestamp or UUID) - SIMPLE VERSION: use original name + timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Sanitize filename - basic version: replace spaces, keep extension
        const originalName = imageFile.name.replace(/\s+/g, '_');
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        // Basic sanitization: remove non-alphanumeric except underscore/hyphen
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `${sanitizedBaseName}-${uniqueSuffix}${extension}`;


        // Define the save path within the /public directory
        const uploadDir = path.join(process.cwd(), 'public', 'customers');
        const filePath = path.join(uploadDir, filename);

        // Ensure the directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        // Read the file content
        const buffer = Buffer.from(await imageFile.arrayBuffer());

        // Write the file
        await fs.writeFile(filePath, buffer);

        // Store the *web-accessible* path for the database
        savedImagePath = `/customers/${filename}`; // Path relative to /public

    } catch (error) {
        console.error('Failed to save image:', error);
        return {
            message: 'Failed to save customer image.',
            errors: { imageFile: ['Could not save the uploaded image.'] },
            formData: { name, email }, // Keep name/email if file fails to save
            success: false,
        };
    }

    // 5. Insert data into the database
    try {
        await sql`
            INSERT INTO customers (name, email, image_url)
            VALUES (${name}, ${email}, ${savedImagePath})
        `;
    } catch (error: any) { // Catch any error for DB insertion
        console.error('Database Error:', error);
        // Unique constraint violation check remains useful
        if (error?.code === '23505' && error?.constraint?.includes('customers_email_key')) {
            return {
                message: 'Database Error: This email address is already registered.',
                errors: { email: ['Email already exists.'] },
                formData: { name, email }, // Pass back original valid name/email
                success: false,
            };
        }
        // Generic database error
        return {
            message: 'Database Error: Failed to Create Customer record.',
            formData: { name, email },
            success: false,
        };
    }


    // 6. Prerender and revalidate cache for customers page
    revalidatePath('/dashboard/customers');
    // redirect('/dashboard/customers');

    return {
        message: 'Customer  created successfully!',
        success: true,
        errors: {}, // Clear any previous errors
        formData: null // Clear previous form data
    };
};


// AUTH ACTIONS

export type AuthErrorMessage = string | undefined;

export async function authenticate(
    prevState: AuthErrorMessage,
    formData: FormData
): Promise<AuthErrorMessage> {
    try {
        const redirectTo = formData.get('redirectTo')?.toString();
        await signIn('credentials', formData, {
            redirectTo: redirectTo || '/dashboard'
        });
        return undefined;
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                // case 'CallbackRouteError':
                //     return `Callback Error: ${error.cause?.err?.message || 'Unknown callback error'}`;
                default:
                    console.error(`Caught specific AuthError type: ${error.type}`, error.cause);
                    throw error;
            }
        }
        // Re-throw other errors that are not AuthError
        console.error("Non-Auth Error during authentication:", error);
        // return 'An unexpected error occurred.';
        // Or re-throw if you have global error handling: throw error;
        throw error;
    }
}
