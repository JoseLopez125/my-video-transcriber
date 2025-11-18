'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/firebase/config'; // Make sure 'db' is exported from your config
import Link from 'next/link';

// Define a type for your transcript document data for TypeScript
type Transcript = {
  id: string; // The Firestore document ID
  originalFilename: string;
  transcript: string;
  createdAt: any; // Firestore timestamp, 'any' is simple, 'Timestamp' is better
  status: string;
  // ... any other fields you saved
};

export default function TranscriptsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Authentication Gate ---
  // Re-use the same auth listener you have on your HomePage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // User is not logged in, redirect to signin
        router.replace('/signin');
      }
      // Note: We'll set loading to false after fetching data
    });
    return () => unsubscribe();
  }, [router]);

  // --- 2. Data Fetching ---
  // This effect runs once the 'user' object is available
  useEffect(() => {
    if (!user) return; // Don't fetch if user isn't logged in yet

    const fetchTranscripts = async () => {
      try {
        setLoading(true);
        // Create a query to get documents from 'transcripts'
        const q = query(
          collection(db, 'transcripts'),
          // CRITICAL: Filter where 'userId' matches the logged-in user's UID
          where('userId', '==', user.uid),
          // Order by creation date, newest first
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);

        const userTranscripts: Transcript[] = [];
        querySnapshot.forEach((doc) => {
          userTranscripts.push({
            id: doc.id,
            ...doc.data(),
          } as Transcript);
        });

        setTranscripts(userTranscripts);
      } catch (err) {
        console.error("Error fetching transcripts:", err);
        setError("Failed to load transcripts.");
      } finally {
        setLoading(false);
      }
    };

    fetchTranscripts();
  }, [user]); // Re-run this effect when the user is populated

  // --- 3. Render States ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Loading Your Transcripts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 text-white">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Transcripts</h1>
        <Link href="/home" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            ← Back to Upload
        </Link>
      </header>

      {/* Grid or List of Transcripts */}
      {transcripts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transcripts.map((job) => (
            <div
              key={job.id}
              className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
            >
              <h2 className="text-xl font-semibold mb-2 truncate" title={job.originalFilename}>
                {job.originalFilename}
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Created: {new Date(job.createdAt?.toDate()).toLocaleString()}
              </p>
              <p className="text-sm bg-gray-700 p-3 rounded h-32 overflow-y-auto mb-4">
                {job.transcript.substring(0, 200)}...
              </p>
                <Link 
                    href={`/transcripts/${job.id}`}
                    className="w-full bg-green-600 py-2 rounded hover:bg-green-700"
                >
                    View Full Transcript
                </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">
          You have not created any transcripts yet.
        </p>
      )}
    </div>
  );
}