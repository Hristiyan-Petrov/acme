// 'use client';

// import { CustomerField, InvoiceForm } from '@/app/lib/definitions';
// import {
//   CheckIcon,
//   ClockIcon,
//   CurrencyDollarIcon,
//   UserCircleIcon,
// } from '@heroicons/react/24/outline';
// import Link from 'next/link';
// import { Button } from '@/app/ui/button';
// import { State, updateInvoice } from '@/app/lib/actions';
// import { useActionState } from 'react';

// export default function EditInvoiceForm({
//   invoice,
//   customers,
// }: {
//   invoice: InvoiceForm;
//   customers: CustomerField[];
// }) {
//   const initialState: State = { message: null, errors: {}, formData: {} };
//   const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);
//   const [state, formAction] = useActionState(updateInvoiceWithId, initialState);

//   return (
//     <form action={formAction}>
//       <div className="rounded-md bg-gray-50 p-4 md:p-6">
//         {/* Customer Name */}
//         <div className="mb-4">
//           <label htmlFor="customer" className="mb-2 block text-sm font-medium">
//             Choose customer
//           </label>
//           <div className="relative">
//             <select
//               id="customer"
//               name="customerId"
//               className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
//               defaultValue={invoice.customer_id}
//             >
//               <option value="" disabled>
//                 Select a customer
//               </option>
//               {customers.map((customer) => (
//                 <option key={customer.id} value={customer.id}>
//                   {customer.name}
//                 </option>
//               ))}
//             </select>
//             <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
//           </div>
//           <div id="customer-error" aria-live="polite" aria-atomic="true">
//             {state.errors?.customerId &&
//               state.errors.customerId.map((error: string) => (
//                 <p className="mt-2 text-sm text-red-500" key={error}>
//                   {error}
//                 </p>
//               ))}
//           </div>
//         </div>

//         {/* Invoice Amount */}
//         <div className="mb-4">
//           <label htmlFor="amount" className="mb-2 block text-sm font-medium">
//             Choose an amount
//           </label>
//           <div className="relative mt-2 rounded-md">
//             <div className="relative">
//               <input
//                 id="amount"
//                 name="amount"
//                 type="number"
//                 step="0.01"
//                 defaultValue={invoice.amount}
//                 placeholder="Enter USD amount"
//                 className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
//               />
//               <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
//             </div>
//           </div>
//           <div id="amount-error" aria-live="polite" aria-atomic="true">
//             {state.errors?.amount &&
//               state.errors.amount.map((error: string) => (
//                 <p className="mt-2 text-sm text-red-500" key={error}>
//                   {error}
//                 </p>
//               ))}
//           </div>
//         </div>

//         {/* Invoice Status */}
//         <fieldset aria-describedby='status-error'>
//           <legend className="mb-2 block text-sm font-medium">
//             Set the invoice status
//           </legend>
//           <div className="rounded-md border border-gray-200 bg-white px-[14px] py-3">
//             <div className="flex gap-4">
//               <div className="flex items-center">
//                 <input
//                   id="pending"
//                   name="status"
//                   type="radio"
//                   value="pending"
//                   defaultChecked={invoice.status === 'pending'}
//                   className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
//                 />
//                 <label
//                   htmlFor="pending"
//                   className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
//                 >
//                   Pending <ClockIcon className="h-4 w-4" />
//                 </label>
//               </div>
//               <div className="flex items-center">
//                 <input
//                   id="paid"
//                   name="status"
//                   type="radio"
//                   value="paid"
//                   defaultChecked={invoice.status === 'paid'}
//                   className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
//                 />
//                 <label
//                   htmlFor="paid"
//                   className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white"
//                 >
//                   Paid <CheckIcon className="h-4 w-4" />
//                 </label>
//               </div>
//             </div>
//           </div>
//           <div id="status-error" aria-live="polite" aria-atomic="true">
//             {state.errors?.status &&
//               state.errors.status.map((error: string) => (
//                 <p className="mt-2 text-sm text-red-500" key={error}>
//                   {error}
//                 </p>
//               ))}
//           </div>
//         </fieldset>
//       </div>
//       <div className="mt-6 flex justify-end gap-4">
//         <Link
//           href="/dashboard/invoices"
//           className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
//         >
//           Cancel
//         </Link>
//         <Button type="submit">Edit Invoice</Button>
//       </div>
//     </form>
//   );
// }





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
import { State, updateInvoice } from '@/app/lib/actions';
// Import necessary hooks
import { useActionState, useEffect, useState } from 'react'; // Import useState
import { useRouter } from 'next/navigation'; // Import useRouter

// (Optional but good practice) Define the Success Animation structure
function SuccessFeedback({ message }: { message: string }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      // Trigger fade-in shortly after component mounts
      const timer = setTimeout(() => setIsVisible(true), 50); // Short delay for CSS transition
      return () => clearTimeout(timer);
    }, []);

    return (
        <div
          className={`success-animation-container ${isVisible ? 'visible' : ''}`}
          role="status"
          aria-live="polite" // Make sure screen readers announce the success
        >
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <p className="mt-2 text-sm text-green-600 font-medium">
                {message}
            </p>
        </div>
    );
}


export default function EditInvoiceForm({
  invoice,
  customers,
}: {
  invoice: InvoiceForm; // Ensure this contains amount in dollars
  customers: CustomerField[];
}) {
  const initialState: State = { message: null, errors: {}, formData: null, success: false };
  const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);
  const [state, formAction] = useActionState(updateInvoiceWithId, initialState);
  const router = useRouter();

  // --- useEffect to handle redirection on success ---
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (state.success && state.message) {
      // Set a 4-second timeout for redirection
      timeoutId = setTimeout(() => {
        router.push('/dashboard/invoices'); // Redirect after delay
      }, 1500); // <<< Set timeout to 4000ms (4 seconds) >>>
    }

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [state.success, state.message, router]);


  // Determine values to display (remains the same)
  const displayCustomerId = state.formData?.customerId ?? invoice.customer_id;
  const displayAmount = state.formData?.amount ?? invoice.amount;
  const displayStatus = state.formData?.status ?? invoice.status;

  return (
    <form id={`edit-invoice-form-${invoice.id}`} action={formAction}>
      {/* --- Render Success Animation OR Form Fields --- */}
      {state.success && state.message ? (
          // Show only success animation + message when successful
          <div className="rounded-md bg-gray-50 p-4 md:p-6 flex justify-center items-center min-h-[300px]"> {/* Adjust min-height as needed */}
              <SuccessFeedback message={state.message} />
          </div>
      ) : (
          // Otherwise, show the form fields and potential error messages
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
                        key={displayCustomerId}
                        defaultValue={displayCustomerId}
                        aria-describedby='customer-error'
                        disabled={state.success} // Should not be reachable if success, but keep for safety
                      >
                        <option value="" disabled={!customers.find(c => c.id === displayCustomerId)}>
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
                          defaultValue={displayAmount}
                          placeholder="Enter USD amount"
                          className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                          aria-describedby='amount-error'
                          disabled={state.success}
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
                  <fieldset aria-describedby='status-error' disabled={state.success}>
                    <legend className="mb-2 block text-sm font-medium">
                      Set the invoice status
                    </legend>
                    <div className="rounded-md border border-gray-200 bg-white px-[14px] py-3">
                      <div className="flex gap-4">
                        <div className="flex items-center">
                          <input
                            id="pending" name="status" type="radio" value="pending"
                            defaultChecked={displayStatus === 'pending'}
                            className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                          />
                          <label htmlFor="pending" className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                            Pending <ClockIcon className="h-4 w-4" />
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="paid" name="status" type="radio" value="paid"
                            defaultChecked={displayStatus === 'paid'}
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

                  {/* --- Display General Error Message Only --- */}
                  {state.message && !state.success && ( // Only show message if it's NOT a success message
                    <div
                        aria-live="polite"
                        role="status"
                        className="my-2 text-sm text-red-500" // Always red here
                      >
                          {state.message}
                    </div>
                  )}
              </div>

              {/* Form Actions - Hide if successful */}
              <div className="mt-6 flex justify-end gap-4">
                  <Link
                    href="/dashboard/invoices"
                    aria-disabled={state.success} // Technically unreachable, but safe
                    tabIndex={state.success ? -1 : undefined}
                    className={`flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 ${state.success ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Cancel
                  </Link>
                  <Button type="submit" disabled={state.success}>
                    Update Invoice
                  </Button>
              </div>
          </>
      )}
    </form>
  );
}