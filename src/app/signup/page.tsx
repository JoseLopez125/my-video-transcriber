'use client';

import { JSX, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app'; 
import { auth } from '@/firebase/config'; 
import Link from 'next/link'; // Import Link

export default function SignUpPage(): JSX.Element {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            router.push('/home');

        } catch (err) {
            const firebaseError = err as FirebaseError;
            setError(firebaseError.message);
            console.error("Signup Error:", firebaseError.code, firebaseError.message);
        }
    };

    return (
        <>
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
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 54px)', 
            zIndex: 2,
            position: 'relative',
        }}> 
            <form onSubmit={handleSignUp} className="p-8 bg-black shadow-md rounded-lg w-80">      
                <h1 className="text-3xl font-bold mb-6 text-white">Create Account</h1>          
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
                    Sign Up
                </button>
                {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
            </form>
            
            {/* Added Link to Login Page */}
            <p className="mt-4 text-sm text-white">
                Already have an account?{' '}
                <Link 
                    href="/signin" 
                    className="font-bold text-blue-400 hover:text-blue-300"
                >
                    Log In Here
                </Link>
            </p>
        </div>
        </>
    );
}