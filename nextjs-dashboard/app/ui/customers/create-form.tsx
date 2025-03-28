'use client';

import Link from 'next/link';
import {
    UserCircleIcon, // For Name
    EnvelopeIcon, // For Email
    PhotoIcon,
    ArrowUpTrayIcon, // For Image URL (or LinkIcon)
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createCustomer, CustomerState } from '@/app/lib/actions'; // Import action and State
import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SuccessFeedback } from '@/app/ui/success-feedback'; // Assuming feedback.tsx is in ui folder
import Image from 'next/image';

export default function CreateCustomerForm() {
    // Initial state for the customer form
    const initialState: CustomerState = { message: null, errors: {}, formData: null, success: false };
    const [state, formAction] = useActionState(createCustomer, initialState);
    const router = useRouter();

    // State for previewing selected image
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');

    // --- useEffect for delayed redirection on success ---
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;
        if (state.success && state.message) {
            // Match delay from other forms (e.g., 1000ms)
            timeoutId = setTimeout(() => {
                router.push('/dashboard/customers'); // Redirect to customers list
            }, 1000);
        }
        // Cleanup function
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            // Clean up object URL if component unmounts
            if (filePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [state.success, state.message, router, filePreview]);

    // Handle file selection for preview
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name); // Store file name
            // Create temporary URL for preview
            const reader = new FileReader();
            reader.onloadend = () => {
                // Clean up previous blob URL if exists
                if (filePreview?.startsWith('blob:')) {
                    URL.revokeObjectURL(filePreview);
                }
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            // Alternatively use URL.createObjectURL for performance, but requires revoke
            // if (filePreview?.startsWith('blob:')) { URL.revokeObjectURL(filePreview); } // Clean up old one
            // setFilePreview(URL.createObjectURL(file));
        } else {
            setFileName('');
            if (filePreview?.startsWith('blob:')) { URL.revokeObjectURL(filePreview); } // Clean up
            setFilePreview(null);
        }
    };

    return (
        <form action={formAction} encType='multipart/form-data'>
            {/* --- Conditional Rendering: Success Animation OR Form --- */}
            {state.success && state.message ? (
                <div className="rounded-md bg-gray-50 p-4 md:p-6 flex justify-center items-center min-h-[300px]">
                    <SuccessFeedback message={state.message} />
                </div>
            ) : (
                <>
                    <div className="rounded-md bg-gray-50 p-4 md:p-6">
                        {/* Customer Name */}
                        <div className="mb-4">
                            <label htmlFor="name" className="mb-2 block text-sm font-medium">
                                Customer Name
                            </label>
                            <div className="relative">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter full name"
                                    className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                    defaultValue={state.formData?.name ?? ''}
                                    aria-describedby='name-error'
                                    disabled={!!state.success}
                                    required // Add basic HTML validation
                                />
                                <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                            </div>
                            <div id="name-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.name &&
                                    state.errors.name.map((error: string) => (
                                        <p className="mt-2 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>

                        {/* Customer Email */}
                        <div className="mb-4">
                            <label htmlFor="email" className="mb-2 block text-sm font-medium">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="text"
                                    placeholder="Enter email address"
                                    className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                    defaultValue={state.formData?.email ?? ''}
                                    aria-describedby='email-error'
                                    disabled={!!state.success}
                                    required
                                />
                                <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                            </div>
                            <div id="email-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.email &&
                                    state.errors.email.map((error: string) => (
                                        <p className="mt-2 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>

                        {/* --- Customer Image Upload --- */}
                        <div className="mb-4">
                            <label htmlFor="imageFile" className="mb-2 block text-sm font-medium">
                                Customer Photo
                            </label>
                            <div className="relative mt-2 flex items-center gap-4">
                                {/* Optional Image Preview */}
                                {filePreview ? (
                                    <Image src={filePreview} alt="Selected preview" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                                ) : (
                                    <PhotoIcon className="h-12 w-12 text-gray-400" aria-hidden="true" />
                                )}
                                {/* Styled File Input */}
                                <label htmlFor="imageFile" className="flex items-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 cursor-pointer">
                                    <ArrowUpTrayIcon className="w-4 h-4" />
                                    <span>{fileName || 'Choose File'}</span>
                                </label>
                                <input
                                    id="imageFile"
                                    name="imageFile" // Name used in formData.get('imageFile')
                                    type="file"
                                    className="sr-only" // Hide the default ugly input
                                    aria-describedby='image-file-error'
                                    disabled={!!state.success}
                                    accept="image/png, image/jpeg, image/webp" // Specify allowed types
                                    onChange={handleFileChange} // Add onChange for preview
                                />
                            </div>
                            
                            {/* Error Display for File Input */}
                            <div id="image-file-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.imageFile &&
                                    state.errors.imageFile.map((error: string) => (
                                        <p className="mt-2 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>

                        {/* --- Display General Error Message --- */}
                        {state.message && !state.success && (
                            <div aria-live="polite" className="my-2 text-sm text-red-500">
                                {state.message}
                            </div>
                        )}
                    </div>

                    {/* --- Form Actions --- */}
                    <div className="mt-6 flex justify-end gap-4">
                        <Link
                            href="/dashboard/customers"
                            aria-disabled={!!state.success}
                            tabIndex={state.success ? -1 : undefined}
                            className={`flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 ${state.success ? 'pointer-events-none opacity-50' : ''}`}
                        >
                            Cancel
                        </Link>
                        <Button type="submit" disabled={!!state.success}>
                            Create Customer
                        </Button>
                    </div>
                </>
            )}
        </form>
    );
}