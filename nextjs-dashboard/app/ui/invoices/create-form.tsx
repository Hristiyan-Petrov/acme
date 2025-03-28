'use client'

import { CustomerField } from '@/app/lib/definitions';
import Link from 'next/link';
import {
    CheckIcon,
    ClockIcon,
    CurrencyDollarIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createInvoice, InvoiceState } from '@/app/lib/actions';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SuccessFeedback } from '../success-feedback';

export default function Form({ customers }: { customers: CustomerField[] }) {
    // Update initial state to match the new State type
    const initialState: InvoiceState = { message: null, errors: {}, formData: {} };
    const [state, formAction] = useActionState(createInvoice, initialState);
    const router = useRouter();

    // --- useEffect to handle redirection on success ---
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        if (state.success && state.message) {
            // Set a 1-second timeout for redirection
            timeoutId = setTimeout(() => {
                router.push('/dashboard/invoices'); // Redirect after delay
            }, 1000);
        }

        // Cleanup function
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [state.success, state.message, router]);

    return (
        <form action={formAction}>
            {state.success && state.message ? (
                <div
                    key="success-container-create"
                    className="rounded-md bg-gray-50 p-4 md:p-6 flex justify-center items-center min-h-[300px]"
                >
                    <SuccessFeedback message={state.message} />
                </div>
            ) : (
                <>
                    <div className="rounded-md bg-gray-50 p-4 md:p-6">
                        {/* Customer Name */}
                        <div className="mb-4">
                            <label htmlFor="customer" className="mb-2 block text-sm font-medium">
                                Choose customer
                            </label>
                            <div className="relative">
                                <select
                                    id="customer"
                                    name="customerId"
                                    className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                    // Use key to force re-render if necessary, 'default' when no selection yet
                                    key={state.formData?.customerId ?? 'select-customer'}
                                    // Set defaultValue based on state, fall back to 'default'
                                    defaultValue={state.formData?.customerId ?? 'default'}
                                    aria-describedby='customer-error'
                                    disabled={!!state.success} // Disable if successful
                                >
                                    <option value="default" disabled>
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
                            <div id="customer-error" aria-live="polite" aria-atomic="true">
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
                            <label htmlFor="amount" className="mb-2 block text-sm font-medium">
                                Choose an amount
                            </label>
                            <div className="relative mt-2 rounded-md">
                                <div className="relative">
                                    <input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter USD amount"
                                        className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                        // Use state for defaultValue if repopulating on error
                                        defaultValue={state.formData?.amount ?? ''}
                                        aria-describedby='amount-error'
                                        disabled={!!state.success} // Disable if successful
                                    />
                                    <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                                </div>
                            </div>
                            <div id="amount-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.amount &&
                                    state.errors.amount.map((error: string) => (
                                        <p className="mt-2 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>

                        {/* Invoice Status */}
                        <fieldset aria-describedby='status-error' disabled={!!state.success}> {/* Disable if successful */}
                            <legend className="mb-2 block text-sm font-medium">
                                Set the invoice status
                            </legend>
                            <div className="rounded-md border border-gray-200 bg-white px-[14px] py-3">
                                <div className="flex gap-4">
                                    {/* Pending Radio */}
                                    <div className="flex items-center">
                                        <input
                                            id="pending" name="status" type="radio" value="pending"
                                            // Check based on state or default to true if state is null/undefined initially
                                            defaultChecked={state.formData?.status === 'pending' || (!state.formData?.status)} // Default to pending if no state
                                            className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                                        />
                                        <label htmlFor="pending" className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                                            Pending <ClockIcon className="h-4 w-4" />
                                        </label>
                                    </div>
                                    {/* Paid Radio */}
                                    <div className="flex items-center">
                                        <input
                                            id="paid" name="status" type="radio" value="paid"
                                            defaultChecked={state.formData?.status === 'paid'}
                                            className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                                        />
                                        <label htmlFor="paid" className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white">
                                            Paid <CheckIcon className="h-4 w-4" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div id="status-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.status &&
                                    state.errors.status.map((error: string) => (
                                        <p className="mt-2 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </fieldset>

                        {/* Display General Error Message ONLY if NOT successful */}
                        {state.message && !state.success && (
                            <div aria-live="polite" className="my-2 text-sm text-red-500">
                                {state.message}
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="mt-6 flex justify-end gap-4">
                        <Link
                            href="/dashboard/invoices"
                            // Add disabled styles/attributes if successful
                            aria-disabled={!!state.success}
                            tabIndex={state.success ? -1 : undefined}
                            className={`flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 ${state.success ? 'pointer-events-none opacity-50' : ''}`}
                        >
                            Cancel
                        </Link>
                        <Button type="submit" disabled={!!state.success}> {/* Disable button if successful */}
                            Create Invoice
                        </Button>
                    </div>
                </>
            )}
        </form>
    );
}
