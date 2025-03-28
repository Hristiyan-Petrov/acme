'use server'

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
// import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { saveCustomerImage, validateImageFile } from './utils';

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
    // id: z.string(),
    name: z.string().trim().min(3, { message: 'Please enter a customer name.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }).trim(),
});

// const CreateCustomer = CustomerFormSchema.omit({ id: true });
const CreateCustomer = CustomerFormSchema;

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

    // --- Combine all errors here ---
    let combinedErrors: CustomerState['errors'] = {};

    // 1. --- Validate Text Fields ---
    const rawFormData = {
        name: formData.get('name'),
        email: formData.get('email'),
    };
    const validatedFields = CreateCustomer.safeParse(rawFormData);

    if (!validatedFields.success) {
        // Add Zod errors to the combined errors object
        combinedErrors = {
            ...combinedErrors,
            ...validatedFields.error.flatten().fieldErrors,
        };
    }

    // 2. --- Validate Image File ---
    const imageFile = formData.get('imageFile');
    const fileValidationErrors = validateImageFile(imageFile); // Use the util function

    if (fileValidationErrors.length > 0) {
        // Add file errors to the combined errors object
        // Use || [] to ensure imageFile array exists before pushing
        combinedErrors.imageFile = [...(combinedErrors.imageFile || []), ...fileValidationErrors];
    }

    // 3. --- Check if ANY validation failed (either Zod or File) ---
    if (Object.keys(combinedErrors).length > 0) {
        console.log("Validation Errors:", combinedErrors);
        return {
            errors: combinedErrors,
            // message: 'Missing or Invalid Fields. Please correct the errors below.',
            formData: { // Repopulate form with raw data
                name: rawFormData.name?.toString(),
                email: rawFormData.email?.toString(),
            },
            success: false,
        };
    }

    // --- At this point, we KNOW combinedErrors is empty. ---
    // --- This IMPLICITLY means fileValidationErrors was empty. ---
    // --- It ALSO IMPLICITLY means validatedFields.success was true. ---

    // 4. --- Type Guard for TypeScript ---
    // Even though logically success must be true, explicitly check for TS safety.
    if (!validatedFields.success) {
         // This state should be logically unreachable if combinedErrors is empty
        console.error("Internal Error: Zod validation failed but wasn't caught earlier.");
        return {
            message: "An unexpected validation error occurred.",
            formData: {
                 name: rawFormData.name?.toString(),
                 email: rawFormData.email?.toString(),
            },
            success: false,
        };
    }

    // 5. --- Prepare Data (Safe to access .data now) ---
    const { name, email } = validatedFields.data; // NOW TypeScript is happy
    const validImageFile = imageFile as File; // Type assertion is safe due to file validation check

    // 6. --- Save the File ---
    const saveResult = await saveCustomerImage(validImageFile);

    if (!saveResult.success) {
        return {
            // Add save errors to imageFile field
            errors: { imageFile: saveResult.errors },
            formData: { name, email }, // Keep validated name/email
            success: false,
        };
    }
    const savedImagePath = saveResult.path;

    // 7. --- Insert data into the database ---
    try {
        await sql`
            INSERT INTO customers (name, email, image_url)
            VALUES (${name}, ${email}, ${savedImagePath})
        `;
    } catch (error: unknown) {
        console.error('Database Error:', error);

        if (typeof error === 'object' && error !== null && 'code' in error) {
            const dbError = error as { code: string; message?: string; constraint_name?: string };
            if (dbError.code === '23505') { // Unique violation
                 if (dbError.constraint_name === 'customers_email_key' || (dbError.message && dbError.message.includes('customers_email_key'))) {
                    // Return field-specific error for unique email
                    return {
                        errors: { email: ['Email already exists.'] },
                        formData: { name, email },
                        success: false,
                    };
                }
                // Potentially handle other unique constraints here
            }
        }

        // Generic DB error message (non-field specific)
        return {
            message: 'Database Error: Failed to create customer record. Please try again.',
            formData: { name, email }, // Keep data for retry
            success: false,
        };
    }

    // 8. --- Revalidate and Return Success ---
    revalidatePath('/dashboard/customers');
    revalidatePath('/dashboard/invoices');

    return {
        message: 'Customer created successfully!',
        success: true,
        errors: {},
        formData: null
    };
}


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
