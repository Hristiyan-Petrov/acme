'use server'

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
// import { redirect } from 'next/navigation';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
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

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });


export type State = {
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

export async function createInvoice(prevState: State, formData: FormData): Promise<State> { // Add Promise<State> for clarity
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

    return {
        message: 'Invoice created successfully!',
        success: true,
        errors: {}, // Clear any previous errors
        formData: null // Clear previous form data
    };

    // redirect('/dashboard/invoices');
};

export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData
) {
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

export async function deleteInvoice(id: string): Promise<{ message: string, success: boolean }> {
    try {
        await sql`DELETE FROM invoices WHERE id =${id}`;
        revalidatePath('/dashboard/invoices');
        return { message: 'Invoice Deleted Successfully.', success: true };

    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Database Error: Failed to Delete Invoice.', success: false };
    }
}