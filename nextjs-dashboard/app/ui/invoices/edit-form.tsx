
'use client';

import { CustomerField, InvoiceForm } from '@/app/lib/definitions';
import {
    CheckIcon,
    ClockIcon,
    CurrencyDollarIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { InvoiceState, updateInvoice } from '@/app/lib/actions';
// Import necessary hooks
import { useActionState, useEffect, useState } // Import useState if needed elsewhere, not strictly needed here anymore
    from 'react'; // Import React for Fragment if needed
import { useRouter } from 'next/navigation';
import { SuccessFeedback } from '../success-feedback'; // Make sure path is correct

export default function EditInvoiceForm({
    invoice,
    customers,
}: {
    invoice: InvoiceForm;
    customers: CustomerField[];
}) {
    const initialState: InvoiceState = { message: null, errors: {}, formData: null, success: false };
    const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);
    const [state, formAction] = useActionState(updateInvoiceWithId, initialState);
    const router = useRouter();

    // --- useEffect to handle redirection on success (no change needed) ---
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        if (state.success && state.message) {
            timeoutId = setTimeout(() => {
                router.push('/dashboard/invoices');
            }, 1000); // Redirection delay
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [state.success, state.message, router]);

    const displayCustomerId = state.formData?.customerId ?? invoice.customer_id;
    const displayAmount = state.formData?.amount ?? invoice.amount;
    const displayStatus = state.formData?.status ?? invoice.status;

    return (
        <form id={`edit-invoice-form-${invoice.id}`} action={formAction}>
            {state.success && state.message ? (
                <div
                    key="success-container-edit"
                    className="rounded-md bg-gray-50 p-4 md:p-6 flex justify-center items-center min-h-[300px]"
                >
                    <SuccessFeedback message={state.message} />
                </div>
            ) : (
                <div key="form-container-edit">
                    <div className="rounded-md bg-gray-50 p-4 md:p-6">
                        {/* Customer Name */}
                        <div className="mb-4">
                            <label htmlFor="customer-edit" className="mb-2 block text-sm font-medium">
                                Choose customer
                            </label>
                            <div className="relative">
                                <select
                                    id="customer-edit" // Unique ID
                                    name="customerId"
                                    className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                    defaultValue={displayCustomerId}
                                    aria-describedby='customer-error-edit'
                                    disabled={state.success}
                                // Add key here if defaultvalue changes often externally - not strictly needed for this problem
                                >
                                    <option value="" disabled>
                                        Select a customer
                                    </option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                                <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                            </div>
                            <div id="customer-error-edit" aria-live="polite" aria-atomic="true">
                                {state.errors?.customerId &&
                                    state.errors.customerId.map((error: string) => (
                                        <p className="mt-2 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>

                        {/* Invoice Amount */}
                        <div className="mb-4">
                            <label htmlFor="amount-edit" className="mb-2 block text-sm font-medium">
                                Choose an amount
                            </label>
                            <div className="relative mt-2 rounded-md">
                                <div className="relative">
                                    <input
                                        id="amount-edit" // Unique ID
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        // Use the dollar amount for defaultValue
                                        defaultValue={displayAmount}
                                        placeholder="Enter USD amount"
                                        className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                        aria-describedby='amount-error-edit'
                                        disabled={state.success}
                                    />
                                    <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                                </div>
                            </div>
                            <div id="amount-error-edit" aria-live="polite" aria-atomic="true">
                                {state.errors?.amount &&
                                    state.errors.amount.map((error: string) => (
                                        <p className="mt-2 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>

                        {/* Invoice Status */}
                        <fieldset aria-describedby='status-error-edit' disabled={state.success}>
                            <legend className="mb-2 block text-sm font-medium">
                                Set the invoice status
                            </legend>
                            <div className="rounded-md border border-gray-200 bg-white px-[14px] py-3">
                                <div className="flex gap-4">
                                    <div className="flex items-center">
                                        <input
                                            id="pending-edit" // Unique ID
                                            name="status" type="radio" value="pending"
                                            defaultChecked={displayStatus === 'pending'}
                                            className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                                        />
                                        <label htmlFor="pending-edit" className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                                            Pending <ClockIcon className="h-4 w-4" />
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            id="paid-edit" // Unique ID
                                            name="status" type="radio" value="paid"
                                            defaultChecked={displayStatus === 'paid'}
                                            className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                                        />
                                        <label htmlFor="paid-edit" className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white">
                                            Paid <CheckIcon className="h-4 w-4" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div id="status-error-edit" aria-live="polite" aria-atomic="true">
                                {state.errors?.status &&
                                    state.errors.status.map((error: string) => (
                                        <p className="mt-2 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </fieldset>

                        {/* --- Display General Error Message Only --- */}
                        {state.message && !state.success && (
                            <div
                                aria-live="polite"
                                role="status"
                                className="my-2 text-sm text-red-500"
                            >
                                {state.message}
                            </div>
                        )}
                    </div> {/* End rounded-md */}

                    {/* Form Actions - Hide if successful */}
                    <div className="mt-6 flex justify-end gap-4">
                        <Link
                            href="/dashboard/invoices"
                            aria-disabled={state.success}
                            tabIndex={state.success ? -1 : undefined}
                            className={`flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 ${state.success ? 'pointer-events-none opacity-50' : ''}`}
                        >
                            Cancel
                        </Link>
                        <Button type="submit" disabled={state.success}>
                            Update Invoice
                        </Button>
                    </div>
                </div> // End form-container-edit
            )}
        </form>
    );
}