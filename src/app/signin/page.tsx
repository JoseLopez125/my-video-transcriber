'use client';

import { useState, useRef, ChangeEvent, useEffect, JSX } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/firebase/config';
import Link from 'next/link';

export default function SignInPage(): JSX.Element {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/home');
        } catch (err) {
            const firebaseError = err as FirebaseError; 
            setError(firebaseError.message);
            console.error("Sign-in Error:", firebaseError);
        }
    };

    return (
        // The outermost div needs positioning handled by app/layout.tsx.
        // This div is just the content wrapper.
        <>
            {/* Header (z-index 1, black background provided here) */}
            <header
                style={{
                    backgroundColor: 'black',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 30px',
                    position: 'relative', // Ensures header sits above the main content's z-index if needed
                    zIndex: 10,
                }}
            >
                <h1 style={{ margin: 0, fontSize: '24px' }}>Scrybe</h1>
                {/* Optional: Add a link to the sign-up page here */}
            </header>

            {/* Main Content Area: Centers the form */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    // Occupy the full remaining viewport height for centering
                    minHeight: 'calc(100vh - 54px)', // 54px is roughly the header height
                    zIndex: 2, // Must be above the Matrix background's z-index (-1)
                    position: 'relative',
                }}
            >
                {/* Form Box (White background applied here) */}
                <form 
                    onSubmit={handleSignIn} 
                    className="p-8 bg-black shadow-lg rounded-lg w-80" // Increased padding and width
                >
                    <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-3 mb-4 h-12 text-lg border rounded-lg"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-3 mb-4 h-12 text-lg border rounded-lg"
                    />
                    <button 
                        type="submit" 
                        className="w-full p-3 h-12 text-lg border rounded-lg bg-green-600 text-white font-bold"
                    >
                        Sign In
                    </button>
                    {error && <p className="text-red-500 mt-4 text-sm text-center">{error}</p>}
                </form>
            <p className="mt-4 text-sm text-white">
                Don't have an account?{' '}
                <Link 
                    href="/signup" 
                    className="font-bold text-blue-400 hover:text-blue-300"
                >
                    Sign Up Here
                </Link>
            </p>
            </div>
        </>
    );
}