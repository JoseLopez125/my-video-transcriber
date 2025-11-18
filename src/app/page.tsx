'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config'; // Import your initialized auth service

export default function StartPage() {
    const [authChecked, setAuthChecked] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // This listener runs once when the component mounts and checks the session state
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is authenticated: send them to the main application dashboard
                router.replace('/home');
            } else {
                // User is NOT authenticated: send them to the login screen
                router.replace('/signin');
            }
            setAuthChecked(true);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, [router]);

    // Show a minimal loading screen while the client-side session check is happening
    if (!authChecked) {
        return (
            <div style={{ 
                height: '100vh', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: 'black', // Matches your matrix background
                color: '#0F0' 
            }}>
                Initializing Session...
            </div>
        );
    }
    
    // Fallback return (should only briefly flash if the redirect works instantly)
    return null; 
}