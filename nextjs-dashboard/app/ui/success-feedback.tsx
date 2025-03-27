'use client';

import { useState, useEffect } from 'react';

// The SuccessFeedback component from EditInvoiceForm
export function SuccessFeedback({ message }: { message: string }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={`success-animation-container ${isVisible ? 'visible' : ''}`}
            role="status"
            aria-live="polite"
        >
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
            <p className="mt-2 text-sm text-green-600 font-medium">
                {message}
            </p>
        </div>
    );
}