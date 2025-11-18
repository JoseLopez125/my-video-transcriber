'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Define the type for the transcript, same as on the list page
type Transcript = {
  id: string;
  originalFilename: string;
  transcript: string;
  createdAt: any;
  status: string;
  userId: string; // We need this to verify ownership
};

export default function TranscriptDetailPage() {
  const router = useRouter();
  const params = useParams(); // Hook to get URL parameters
  
  const [user, setUser] = useState<User | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the document ID from the URL
  const { id } = params;

  // --- 1. Authentication Gate ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace('/signin');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- 2. Data Fetching ---
  // This effect runs when the user and ID are available
  useEffect(() => {
    if (!user || !id) return; // Wait for auth and ID

    const fetchTranscript = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Create a reference to the single document
        const docRef = doc(db, 'transcripts', id as string);
        
        // 2. Fetch the document
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<Transcript, 'id'>;

          // 3. SECURITY CHECK: Verify this user owns this document
          if (data.userId === user.uid) {
            setTranscript({ id: docSnap.id, ...data });
          } else {
            // User is logged in but doesn't own this file
            setError("Access Denied: You do not have permission to view this transcript.");
          }
        } else {
          setError("Transcript not found.");
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load transcript.");
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [user, id]); // Re-run if user or ID changes

  // --- 3. Render States ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Loading Transcript...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <p>{error}</p>
        <Link href="/transcripts" className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            ← Back to History
        </Link>
      </div>
    );
  }

  if (!transcript) {
    return null; // Should be covered by loading/error states
  }

  // --- 4. Render the Transcript ---
  return (
    <div className="p-8 md:p-12 text-white max-w-4xl mx-auto">
        
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold truncate" title={transcript.originalFilename}>
            {transcript.originalFilename}
          </h1>
          <p className="text-sm text-gray-400">
            Created: {new Date(transcript.createdAt?.toDate()).toLocaleString()}
          </p>
        </div>
        <Link href="/transcripts" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            ← Back to History
        </Link>
      </header>

      {/* Transcript Text Box */}
      <div
        className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
      >
        <h2 className="text-xl font-semibold mb-4 text-green-400">Full Transcript:</h2>
        <p
          className="text-gray-200 whitespace-pre-wrap leading-relaxed"
          style={{ fontFamily: 'monospace' }}
        >
          {transcript.transcript}
        </p>
      </div>
    </div>
  );
}