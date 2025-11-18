'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth'; 
import { auth, storage, storageBucket } from '@/firebase/config';

const PROCESSING_URL_ENDPOINT = 'https://start-processing-t5ugakub7a-uc.a.run.app';
const CANONICAL_GCS_BUCKET = storageBucket;

const HelpBox: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const style = {
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    position: 'absolute' as const,
    top: '45px',
    right: '0',
    zIndex: 50,
    width: '300px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
    borderRadius: '8px',
    backgroundColor: '#1f2937',
    border: '1px solid #10b981',
    textAlign: 'left' as const,
  };

  return (
    <div 
      style={style}
    >
      <div className="p-4">
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginBottom: '10px' }}>
          How To Use Scrybe 💡
        </h3>
        <p style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.4' }}>
          <span style={{ display: 'block', marginBottom: '5px' }}>1. Click the box to <strong style={{ fontWeight: 'bold', color: '#fff' }}>upload</strong> a media file.</span>
          <span style={{ display: 'block', marginBottom: '5px' }}>2. Wait for file to <strong style={{ fontWeight: 'bold', color: '#fff' }}>transcribe</strong>.</span>
          <span style={{ display: 'block', marginBottom: '5px' }}><strong style={{ fontWeight: 'bold', color: '#fff' }}>That's it!</strong> Your transcription will be displayed on screen and available for download!</span>
        </p>
      </div>
    </div>
  );
};

export default function HomePage() {
  const router = useRouter(); 
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [transcript, setTranscript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const menuStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%', // Position dropdown below the main button
    right: 0,
    zIndex: 20,
    backgroundColor: '#333', // Dark background for the menu
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
    marginTop: '2px',
};

const buttonItemStyle: React.CSSProperties = {
    padding: '10px 15px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'white',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
};

    const handleTranscripts = () => {
        router.push("/transcripts");
    };

  // --- Auth State Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
        } else {
            // Redirect unauthenticated user
            router.replace('/signin');
        }
        setLoading(false)
    });
    return () => unsubscribe();
  }, [router]);
// --- End Auth State Listener ---

  // ---- MATRIX BACKGROUND EFFECT ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = Math.random() > 0.5 ? '1' : '0';
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.4;
      }

      requestAnimationFrame(draw);
    };

    draw();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // --- Dropdown Close Listener ---
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
      // If the dropdown is open AND the click target is NOT inside the dropdown ref container
      if (isProfileOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsProfileOpen(false); // Close the menu
      }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
      document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isProfileOpen]);

// ... later in the render function ...
// If the user is loading or unauthenticated, display a loading screen or nothing.



  // ---- UPLOAD TO FIREBASE ----
  function uploadVideoToFirebase(videoFile: File, gcsPath: string) {
    setUploadStatus('Uploading file to Firebase Storage...');
    const storageRef = ref(storage, gcsPath);

    uploadBytes(storageRef, videoFile)
      .then(() => {
        console.log('✅ Uploaded to Firebase Storage:', gcsPath);
        setUploadStatus('Upload complete. Starting transcription...');
        triggerTranscription(gcsPath, videoFile);
      })
      .catch((error) => {
        console.error('❌ Firebase Upload Failed:', error);
        setUploadStatus(`Upload failed: ${error.message}`);
        setIsLoading(false);
      });
  }

  // ---- CALL BACKEND TRANSCRIPTION FUNCTION ----
  function triggerTranscription(gcsPath: string, videoFile: File) {
    setIsLoading(true);
    const gcsUri = `gs://${CANONICAL_GCS_BUCKET}/${gcsPath}`;

    fetch(PROCESSING_URL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gcsPath: gcsUri, "userId": user?.uid, "originalFilename": videoFile.name }),
    })
      .then((res) => res.json())
      .then((data) => {
        const result = data.transcript || 'Transcription result unavailable.';
        console.log('✅ Transcription received:', result);
        setTranscript(result);
        setUploadStatus('Transcription complete.');
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('❌ Transcription failed:', error);
        setUploadStatus(`Processing error: ${error.message}`);
        setIsLoading(false);
      });
  }

  // ---- FILE SELECTION ----
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTranscript('');
    setUploadStatus('');
    setIsLoading(true);

    const validTypes = ['video/mp4', 'video/quicktime', 'audio/mpeg'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type! Please upload .mp4, .mov, or .mp3');
      setIsLoading(false);
      return;
    }

    if (!user) {
      alert("Please wait for authentication or sign in.");
      setIsLoading(false);
      return;
    }
  
    // Use user.uid to create the path
    const GCS_FILENAME = `user-videos/${user.uid}/${Date.now()}-${file.name}`;
    uploadVideoToFirebase(file, GCS_FILENAME);
  };

  // ---- DOWNLOAD TRANSCRIPT ----
  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transcript.txt';
    link.click();
  };

  const handleSignOut = async () => {
    try {
        await auth.signOut(); // Calls the Firebase sign-out API
        // Redirect user to the sign-in page after successful sign-out
        router.push('/signin');
    } catch (error) {
        console.error("Error signing out:", error);
        alert("Failed to sign out. Please try again.");
    }
};

  // ---- UPLOADING DOTS ----
  const LoadingDots = () => {
    const [dots, setDots] = useState('');
    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
      }, 500);
      return () => clearInterval(interval);
    }, []);
    return (
      <p
        style={{
          marginTop: '20px',
          fontSize: '16px',
          color: 'rgba(255,255,255,0.8)',
          fontWeight: 300,
          animation: 'fade 1.5s ease-in-out infinite',
        }}
      >
        {uploadStatus || 'Processing'}
        {dots}
        <style>{`
          @keyframes fade {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
        `}</style>
      </p>
    );
  };

  // ---- UI ----
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        overflowY: 'auto',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -1,
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
        }}
      />

      <header
        style={{
          backgroundColor: 'black',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px 30px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>Scrybe</h1>

        <div 
        style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px', // Space between user info, Sign Out, and About Scrybe
            position: 'relative', // Ensures HelpBox positions correctly
            zIndex: 11 
        }}
    >
        {/* About Scrybe Button (Toggle) */}
        <button
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            style={{
                fontSize: '14px',
                padding: '6px 12px',
                backgroundColor: '#10b981', 
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 'bold'
            }}
        >
            About Scrybe
            {/* SVG Icon remains here */}
        </button>
        {/* Sign Out Button (Styled to look like a button) */}
        <div
            ref={dropdownRef}
            // Outer wrapper must be relative to position the menu absolutely
            style={{ position: 'relative', display: 'inline-block' }} 
        >
            {/* --- 1. Main Hover Button --- */}
            <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{ 
                  fontSize: '14px',
                  padding: '6px 12px',
                  backgroundColor: '#10b981', 
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 'bold'
                }}
            >
                Account ▼
            </button>

            {/* --- 2. Hidden Menu Container --- */}
            {isProfileOpen && (
                <div style={menuStyles}>
                    <button 
                        style={buttonItemStyle} 
                        onClick={() => handleTranscripts()}
                    >
                        Transcripts
                    </button>
                    <button 
                        style={{...buttonItemStyle, color: '#ff4d4d', borderTop: '1px solid #555'}}
                        onClick={() => handleSignOut()}
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
        {/* --- RENDER HELP BOX HERE --- */}
        <HelpBox isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
      </header>

      <div
        style={{
          height: 'calc(100vh - 70px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {!isLoading && !transcript && (
          <div
            style={{
              padding: '40px',
              border: '2px dashed #007bff',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              cursor: 'pointer',
              width: '300px',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <p style={{ fontSize: '20px', color: '#555' }}>Click to Upload a File</p>
            <p style={{ fontSize: '12px', color: '#555' }}>.mp4, .mov, .mp3 only</p>
          </div>
        )}

        {isLoading && <LoadingDots />}

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".mp4,.mov,.mp3"
          onChange={handleFileSelect}
        />

        {transcript && !isLoading && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '550px',
                height: '180px',
                border: '2px solid #ccc',
                borderRadius: '12px',
                padding: '20px 30px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                marginBottom: '30px',
              }}
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #007bff',
                  borderRadius: '10px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  padding: '20px',
                  width: '180px',
                  height: '100px',
                }}
              >
                <p style={{ fontSize: '20px', color: '#555' }}>Upload File</p>
                <p style={{ fontSize: '12px', color: '#555' }}>.mp4, .mov, .mp3</p>
              </div>

              <div
                style={{
                  width: '1px',
                  height: '100px',
                  backgroundColor: '#ccc',
                  margin: '0 20px',
                }}
              />

              <div
                onClick={handleDownload}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #007bff',
                  borderRadius: '10px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  padding: '20px',
                  width: '180px',
                  height: '100px',
                }}
              >
                <p style={{ fontSize: '20px', color: '#555' }}>Download File</p>
                <p style={{ fontSize: '12px', color: '#555' }}>Transcript.txt</p>
              </div>
            </div>

            {/* ---- SCROLLABLE TRANSCRIPT BOX ---- */}
            <div
              style={{
                width: '70%',
                maxWidth: '700px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'left',
                maxHeight: '400px',        // <-- Scroll limit
                overflowY: 'auto',          // <-- Enables scrolling
              }}
            >
              <h2 style={{ marginTop: 0, textAlign: 'center', color: '#555' }}>Transcript:</h2>
              <p
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  fontSize: '14px',
                  color: '#333',
                }}
              >
                {transcript}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );


if (loading) {
  return <div className="p-8 text-center">Checking authentication...</div>;
}

if (!user) {
  return (
      <div style={{ backgroundColor: 'black', color: 'white', padding: '50px', textAlign: 'center' }}>
          Checking authentication...
      </div>
  );
}

}
