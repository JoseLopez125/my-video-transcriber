"use client";

import { useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, auth } from "./firebaseConfig";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click(); // Open file picker
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!auth.currentUser) return alert("You must be signed in to upload!");

    const storageRef = ref(storage, `videos/${auth.currentUser.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      null, // skip progress for simple button
      (error) => console.error("Upload failed:", error),
      () =>
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          console.log("Upload complete! File URL:", url);
          alert("Upload complete!");
        })
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* Hidden file input */}
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      
      {/* Upload button */}
      <button
        onClick={handleButtonClick}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Upload Video
      </button>
    </div>
  );
}
