// components/AuthProvider.tsx
'use client';
import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/config'; 

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Note: This only monitors state; redirection is best handled on individual pages (like /home)
        });
        return () => unsubscribe();
    }, []);
    return <>{children}</>;
}