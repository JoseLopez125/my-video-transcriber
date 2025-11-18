import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; 
import MatrixBackground from '../components/MatrixBackground'; 
import AuthProvider from '../components/AuthProvider'; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Scrybe',
  description: 'Upload and transcribe videos with Scrybe!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        
        {/* 1. RENDER THE MATRIX BACKGROUND (z-index: -1) */}
        <MatrixBackground />

        {/* 2. WRAP CONTENT IN AUTH PROVIDER AND POSITION IT ABOVE BACKGROUND */}
        <AuthProvider>
          <main 
            // Apply positioning and font globally
            style={{ 
              position: 'relative', 
              zIndex: 1, 
              minHeight: '100vh', 
              fontFamily: 'var(--font-geist-sans)',
              // The individual pages (like /signin) must set their own background-color (e.g., bg-white)
            }}
          >
            {children}
          </main>
        </AuthProvider>
        
      </body>
    </html>
  );
}