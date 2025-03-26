'use server'

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
    // Add field to hold submitted data on error
    formData?: {
        customerId?: string;
        amount?: string; // Keep as string as it comes from FormData
        status?: string;
    } | null; // Make it nullable for the initial state
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
            }
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
        // If a database error occurs, return a more specific error.
        return {
            message: 'Database Error: Failed to Create Invoice.'
            // Optionally keep formData here too if needed, but likely not required for DB errors
            // formData: { ... }
        }
    }

    // Revalidate the cache for the invoices page and redirect the user.
    // On success, state is not returned because redirect throws an error.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
};

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100;

    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        console.error(error);
    }

    revalidatePath('/dashboard/invoices');   // Update route view (renew cache / prerender)
    redirect('/dashboard/invoices');
};

export async function deleteInvoice(id: string) {
    await sql`
            DELETE FROM invoices WHERE id =${id}
        `;
    revalidatePath('/dashboard/invoices');   // Update route view (renew cache / prerender)
};