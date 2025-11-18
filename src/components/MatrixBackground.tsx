'use client';

import React, { useRef, useEffect, useState } from 'react';

// The MatrixBackground component should only render the canvas.
const MatrixBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isClient, setIsClient] = useState(false); // Used to ensure canvas setup runs client-side

    useEffect(() => {
        setIsClient(true);
    }, []);

    // ---- MATRIX BACKGROUND EFFECT LOGIC ----
    useEffect(() => {
        if (!isClient) return;
        
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

                if (y * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i] += 0.4;
            }

            requestAnimationFrame(draw);
        };

        draw();
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [isClient]);
    // ----------------------------------------

    return (
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: -1, // Sits behind all content
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
          }}
        />
    );
};

export default MatrixBackground;

// NOTE: You must move the HelpBox component definition and the Header/Button JSX 
// back into your app/layout.tsx (for the Header) and app/home/page.tsx (for the logic/UI).