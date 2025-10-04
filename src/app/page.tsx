'use client';

import { useState, useRef } from 'react';

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/quicktime', 'audio/mpeg'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type! Please upload .mp4, .mov, or .mp3');
      return;
    }

    setSelectedFile(file);
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
          onClick={() => fileInputRef.current.click()}
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
