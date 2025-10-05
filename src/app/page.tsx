'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';

// --- CONFIGURATION ---
// ✅ Replace with your actual Firebase project config (safe to keep public)
const firebaseConfig = {
  apiKey: "AIzaSyD-78GjYq9_U0FAnXhEBoHGpE5BcPViG7o",
  authDomain: "myvideotranscriber.firebaseapp.com",
  projectId: "myvideotranscriber",
  storageBucket: "myvideotranscriber.firebasestorage.app",
  messagingSenderId: "169734295799",
  appId: "169734295799"
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// ✅ Replace this with your deployed backend endpoint URL
const PROCESSING_URL_ENDPOINT = 'https://start-processing-t5ugakub7a-uc.a.run.app'; 
const CANONICAL_GCS_BUCKET = firebaseConfig.storageBucket;

// ---------------------

export default function HomePage() {
  const [transcript, setTranscript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const MIN_LOADING_TIME = 1000;

  // ---- Background Drawing ----
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const ctx = el.getContext('2d');
    if (!ctx) return;

    const drawBackground = () => {
      el.width = window.innerWidth;
      el.height = window.innerHeight;

      const width = el.width;
      const height = el.height;
      const fontSize = 16;
      const cols = Math.floor(width / fontSize);
      const rows = Math.floor(height / fontSize);

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px monospace`;
      ctx.textBaseline = 'top';

      const exclusionWidth = width * 0.4;
      const exclusionHeight = height * 0.4;
      const exclusionX = (width - exclusionWidth) / 2;
      const exclusionY = (height - exclusionHeight) / 2 + height * 0.05;

      for (let y = 0; y < rows; y++) {
        const posY = y * fontSize;
        const density = 0.15 + 0.6 * (1 - posY / height);
        const fadePoint = height * 0.55;
        const fadeFactor =
          posY < fadePoint
            ? 1
            : Math.max(0, 1 - (posY - fadePoint) / (height - fadePoint));
        const baseBrightness = 150;
        const brightness = Math.floor(
          baseBrightness + (255 - baseBrightness) * (1 - fadeFactor)
        );
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;

        for (let x = 0; x < cols; x++) {
          const posX = x * fontSize;
          const inCenter =
            posX >= exclusionX &&
            posX <= exclusionX + exclusionWidth &&
            posY >= exclusionY &&
            posY <= exclusionY + exclusionHeight;
          if (inCenter) continue;
          if (Math.random() < density * 0.1) {
            const text = Math.random() > 0.5 ? '1' : '0';
            ctx.fillText(text, posX, posY);
          }
        }
      }
    };

    drawBackground();
    window.addEventListener('resize', drawBackground);
    return () => window.removeEventListener('resize', drawBackground);
  }, []);

  // ---- Firebase Upload ----
  function uploadVideoToFirebase(videoFile: File, gcsPath: string) {
    setUploadStatus("Uploading file to Firebase Storage...");

    const storageRef = ref(storage, gcsPath);
    uploadBytes(storageRef, videoFile)
      .then(() => {
        console.log("✅ Uploaded to Firebase Storage:", gcsPath);
        setUploadStatus("Upload complete. Starting transcription...");
        triggerTranscription(gcsPath);
      })
      .catch((error) => {
        console.error("❌ Firebase Upload Failed:", error);
        setUploadStatus(`Upload failed: ${error.message}`);
        setIsLoading(false);
      });
  }

  // ---- Backend Transcription Trigger ----
  function triggerTranscription(gcsPath: string) {
    setIsLoading(true);
    const gcsUri = `gs://${CANONICAL_GCS_BUCKET}/${gcsPath}`;

    fetch(PROCESSING_URL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gcsPath: gcsUri }),
    })
      .then((res) => res.json())
      .then((data) => {
        const result = data.transcript || "Transcription result unavailable.";
        console.log("✅ Transcription received:", result);
        setTranscript(result);
        setUploadStatus("Transcription complete.");
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("❌ Transcription failed:", error);
        setUploadStatus(`Processing error: ${error.message}`);
        setIsLoading(false);
      });
  }

  // ---- File Select ----
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

    const GCS_FILENAME = `user-videos/${Date.now()}-${file.name}`;
    setSelectedFile(file);
    uploadVideoToFirebase(file, GCS_FILENAME);
  };

  // ---- Download Transcript ----
  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transcript.txt';
    link.click();
  };

  // ---- Uploading Dots ----
  const LoadingDots = () => {
    const [dots, setDots] = useState('');
    useEffect(() => {
      const interval = setInterval(() => {
        setDots(prev => (prev.length < 3 ? prev + '.' : ''));
      }, 500);
      return () => clearInterval(interval);
    }, []);
    return <p style={{ marginTop: '20px', fontSize: '16px' }}>{uploadStatus || 'Processing'}{dots}</p>;
  };

  // ---- UI ----
  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, width: '100%', height: '100%' }}
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
              backgroundColor: 'white',
              cursor: 'pointer',
              width: '300px',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <p>Drag & Drop or Click to Upload</p>
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
                backgroundColor: '#f9f9f9',
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
                <p style={{ margin: 0 }}>Upload File</p>
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
                <p style={{ margin: 0 }}>Download File</p>
                <p style={{ fontSize: '12px', color: '#555' }}>Transcript.txt</p>
              </div>
            </div>

            <div
              style={{
                width: '70%',
                maxWidth: '700px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'white',
                textAlign: 'left',
              }}
            >
              <h2 style={{ marginTop: 0, textAlign: 'center' }}>Transcript:</h2>
              <p style={{ whiteSpace: 'pre-wrap' }}>{transcript}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
