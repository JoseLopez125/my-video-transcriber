'use client';

import { useState, useRef, ChangeEvent } from 'react';
// Import the Firebase client library modules
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';

// --- CONFIGURATION ---
// REPLACE with your actual Firebase Project Configuration (from Firebase Console -> Project Settings)
const firebaseConfig = {
  apiKey: "AIzaSyD-78GjYq9_U0FAnXhEBoHGpE5BcPViG7o",
  authDomain: "myvideotranscriber.firebaseapp.com",
  projectId: "myvideotranscriber",
  storageBucket: "myvideotranscriber.firebasestorage.app", // This is the default bucket
  messagingSenderId: "169734295799",
  appId: "169734295799"
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// NOTE: This URL must be replaced with the actual deployed endpoint for start_processing
const PROCESSING_URL_ENDPOINT = 'https://start-processing-t5ugakub7a-uc.a.run.app'; 
const FIREBASE_BUCKET_NAME = firebaseConfig.storageBucket; // Use the configured bucket name
// ---------------------

export default function HomePage() {
  const [transcript, setTranscript] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- STEP 1: Uploads file using Firebase Storage SDK ---
  function uploadVideoToFirebase(videoFile: File, gcsPath: string) {
    setUploadStatus("Uploading file to Firebase Storage...");
    
    // Create a reference to the file location in Firebase Storage
    const storageRef = ref(storage, gcsPath);

    uploadBytes(storageRef, videoFile)
        .then((snapshot) => {
            console.log("✅ Video uploaded to Firebase Storage!");
            setUploadStatus("Upload complete. Starting transcription...");
            // Proceed to Step 2: Call the backend processing function
            triggerTranscription(gcsPath);
        })
        .catch((error) => {
            console.error("❌ Firebase Upload Failed:", error);
            setUploadStatus(`Upload failed: Check Storage Rules or network.`);
            setIsLoading(false);
        });
  }

  // --- STEP 2: Calls the processing function on the backend ---
  function triggerTranscription(gcsPath: string) {
    const CANONICAL_GCS_BUCKET = "myvideotranscriber.firebasestorage.app"; 
    // Construct the GCS URI for the backend (Video Intelligence API requirement)
    const gcsUri = `gs://${CANONICAL_GCS_BUCKET}/${gcsPath}`;

    // Make a light POST request to your backend processing function
    fetch(PROCESSING_URL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            gcsPath: gcsUri // Send the full GCS URI
        })
    })
    .then(response => response.json())
    .then(data => {
        setTranscript(data.transcript || "Transcription result is empty or failed.");
        setUploadStatus("Transcription complete.");
        setIsLoading(false);
    })
    .catch(error => {
        console.error("Error during final processing step:", error);
        setUploadStatus(`Processing error: ${error.message}`);
        setIsLoading(false);
    });
  }

  // --- Initial file selection and validation ---
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTranscript(""); 
    setUploadStatus("");
    setIsLoading(true);

    const validTypes = ['video/mp4', 'video/quicktime', 'audio/mpeg', ''];
    if (!validTypes.includes(file.type) && !validTypes.includes(file.type.split('/')[0])) {
      alert('Invalid file type! Please upload .mp4, .mov, or .mp3');
      setIsLoading(false);
      return;
    }

    const GCS_FILENAME = `user-videos/${Date.now()}-${file.name}`; 
    setSelectedFile(file);
    
    // Start the Firebase Storage upload
    uploadVideoToFirebase(file, GCS_FILENAME);
  };

  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header (Styling omitted for brevity) */}
      <header style={{backgroundColor: '#1f2937', color: 'white', padding: '15px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',}}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>🎥 Video Transcriber (Firebase Storage)</h1>
      </header>

      {/* Main upload area (Styling omitted for brevity) */}
      <div style={{padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center',}}>
        <div onClick={() => fileInputRef.current?.click()} style={{padding: '40px', border: '2px dashed #007bff', borderRadius: '12px', backgroundColor: 'white', cursor: 'pointer', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'all 0.2s',}}>
          <p style={{ fontSize: '16px', margin: '0 0 5px 0', fontWeight: 500 }}>
            Drag & Drop or Click to Upload
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            .mp4, .mov, .mp3 supported
          </p>
        </div>
        
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="video/*,audio/*" onChange={handleFileSelect}/>

        {selectedFile && (<p style={{ marginTop: '20px', color: '#1f2937', fontWeight: 500 }}>Selected: {selectedFile.name}</p>)}

        <p style={{ marginTop: '10px', color: isLoading ? '#f59e0b' : '#34d399', fontWeight: 600 }}>{uploadStatus}</p>

        {isLoading && <p style={{ color: '#10b981' }}>Please wait, transcription can take up to 10 minutes...</p>}

        {transcript && (
          <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #d1d5db', borderRadius: '8px', width: '100%', maxWidth: '800px', backgroundColor: '#ffffff', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <h2 style={{ fontSize: '20px', marginBottom: '10px', color: '#1f2937' }}>📝 Final Transcript</h2>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#374151' }}>{transcript}</p>
          </div>
        )}
      </div>
    </div>
  );
}
