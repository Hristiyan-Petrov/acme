'use client'

import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
// import { Metadata } from 'next';
import { useEffect } from 'react';

// export const metadata: Metadata = {
//     title: {
//         template: '%s | Acme Dashboard',
//         default: 'Acme Dashboard'
//     },
//     description: 'The official Next.js Course Dashboard, built with App Router.',
//     metadataBase: new URL('https://next-learn-dashboard.vercel.sh')
// };



export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        // --- ERUDA INITIALIZATION ---
        // Dynamically import eruda to avoid including it in production bundles
        import('eruda').then((eruda) => {
            try {
                eruda.default.init(); // Initialize eruda
                console.log('Eruda initialized for mobile debugging.');
            } catch (error) {
                console.error('Failed to initialize Eruda:', error);
            }
        });
    }, [])

    return (
        <html lang="en">
            <body className={`${inter.className} antialiased`}>{children}</body>
        </html>
    );
}
