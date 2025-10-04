'use client';

import { useState, useRef, ChangeEvent } from 'react';


export default function HomePage() {
  function uploadVideoToGCS(signedUrl, videoFile, gcsPath) {
    fetch(signedUrl, {
        method: 'PUT',
        headers: { 
            // Must match the content_type="video/*" from the Python function
            'Content-Type': videoFile.type || 'video/mp4'
        },
        body: videoFile 
    })
    .then(res => {
        if (res.ok) {
            console.log("✅ Video uploaded directly to GCS!");
            // Proceed to Step 3
            triggerTranscription(gcsPath);
        } else {
            console.error("❌ GCS Upload Failed:", res.statusText);
        }
    });
}
// This function name (triggerTranscription) is defined by you.
function triggerTranscription(gcsPath: string) {
  const PROCESSING_URL = 'https://get-upload-url-t5ugakub7a-uc.a.run.app/start_processing'; 

  // Make a final, light POST request to your backend processing function
  fetch(PROCESSING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          // Send the GCS URI format so the Video Intelligence API can access it
          gcsPath: `gs://myvideotranscriber-video-uploads/${gcsPath}`
      })
  })
  .then(response => response.json())
  .then(data => {
      console.log("Processing complete. Transcript/DB response:", data);
      // Display the transcript to the user
  })
  .catch(error => {
      console.error("Error during final processing step:", error);
  });
}
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/quicktime', 'audio/mpeg'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type! Please upload .mp4, .mov, or .mp3');
      return;
    }

    setSelectedFile(file);
    // Assuming 'videoFile' is the File object from your drag-and-drop
    const GCS_FILENAME = `user-videos/${Date.now()}-${file}`;
    const FUNCTION_URL = 'https://get-upload-url-t5ugakub7a-uc.a.run.app'; // Replace this URL
    const fileContentType = file.type ? file.type : 'video/mp4'; 

    fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: GCS_FILENAME, 'Content-Type': fileContentType })
    })
    .then(res => res.json())
    .then(data => {
        if (data.uploadUrl) {
            // Proceed to Step 2
            uploadVideoToGCS(data.uploadUrl, selectedFile, GCS_FILENAME);
        } else {
            console.error("Server denied upload:", data.error);
        }
    });
  };

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Header */}
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
        <h1 style={{ margin: 0, fontSize: '24px' }}>Video Transcriber</h1>
        <button
          style={{
            fontSize: '14px',
            padding: '6px 12px',
            backgroundColor: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Account
        </button>
      </header>

      {/* Main upload area */}
      <div
        style={{
          height: 'calc(100vh - 70px)', // subtract header height
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          textAlign: 'center',
        }}
      >
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

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".mp4,.mov,.mp3"
          onChange={handleFileSelect}
        />

        {selectedFile && (
          <p style={{ marginTop: '20px', color: '#333' }}>
            Selected file: {selectedFile.name}
          </p>
        )}
      </div>
    </div>
  );
}
