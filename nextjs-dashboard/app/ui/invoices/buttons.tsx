'use client'

import { deleteInvoice } from '@/app/lib/actions';
import { ArrowPathIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

export function CreateInvoice() {
    return (
        <Link
            href="/dashboard/invoices/create"
            className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
            <span className="hidden md:block">Create Invoice</span>{' '}
            <PlusIcon className="h-5 md:ml-4" />
        </Link>
    );
}

export function UpdateInvoice({ id }: { id: string }) {
    return (
        <Link
            href={`/dashboard/invoices/${id}/edit`}
            className="rounded-md border p-2 hover:bg-blue-300"
        >
            <PencilIcon className="w-5" />
        </Link>
    );
};

export function DeleteInvoice({ id }: { id: string }) {
    const initialState = { message: null, errors: {}, success: false };

     // Note: The action expects prevState and formData. It effectively creates a function like: (prevState, formData) => deleteInvoice(id, prevState, formData)
    const deleteInvoiceWithId = deleteInvoice.bind(null, id);
    const [state, formAction] = useActionState(deleteInvoiceWithId, initialState);

    return (
        <form action={formAction} aria-live="polite">
            <DeleteButton />
            {state?.message && !state.success && (
                <p className="mt-1 text-xs text-red-500" role="status">
                    {state.message}
                </p>
            )}
        </form>
    );
};

function DeleteButton() {
    const { pending } = useFormStatus();

    return (
         <button
            type="submit"
            className={clsx(
                "rounded-md border p-2 hover:bg-red-400",
                { "bg-gray-100 opacity-50 cursor-not-allowed": pending } // Style when pending
            )}
            disabled={pending} // Disable button when pending
            aria-disabled={pending} // Accessibility
        >
            <span className="sr-only">Delete</span>
            {/* Show spinner when pending, otherwise trash icon */}
            {pending ? (
                 <ArrowPathIcon className="w-5 animate-spin" />
             ) : (
                 <TrashIcon className="w-5" />
             )}
        </button>
    );
}