'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [terminalText, setTerminalText] = useState('');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  const lines = [
    { text: "> Establishing connection to requested route...", color: "#aaa" },
    { text: "> Route: /the-page-you-want", color: "#e0e0e0" },
    { text: "> Sending SYN packet...", color: "#aaa" },
    { text: "> ...", delay: 500 },
    { text: "> ...", delay: 500 },
    { text: "> ERROR: No ACK received.", color: "#ff3c3c" },
    { text: "> STATUS: Route not found in datalog.", color: "#ff3c3c" },
    { text: "> RECOMMENDATION: Verify coordinates and try again.", color: "#00ffff" },
  ];

  useEffect(() => {
    if (currentLineIndex >= lines.length) return;

    const currentLine = lines[currentLineIndex];
    const timer = setTimeout(() => {
      if (currentCharIndex < currentLine.text.length) {
        setTerminalText(prev => prev + currentLine.text.charAt(currentCharIndex));
        setCurrentCharIndex(prev => prev + 1);
      } else {
        setTerminalText(prev => prev + '\n');
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }
    }, currentCharIndex < currentLine.text.length ? 30 : (currentLine.delay || 100));

    return () => clearTimeout(timer);
  }, [currentLineIndex, currentCharIndex, lines]);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');
        
        @keyframes pan-grid {
          from { background-position: 0 0; }
          to { background-position: -30px -30px; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes glitch-main {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
        
        @keyframes glitch-anim-1 {
          0%, 100% { clip-path: polygon(0 45%, 100% 45%, 100% 55%, 0 55%); }
          25% { clip-path: polygon(0 0, 100% 0, 100% 20%, 0 20%); }
          50% { clip-path: polygon(0 80%, 100% 80%, 100% 100%, 0 100%); }
          75% { clip-path: polygon(0 30%, 100% 30%, 100% 40%, 0 40%); }
        }
        
        @keyframes glitch-anim-2 {
          0%, 100% { clip-path: polygon(0 60%, 100% 60%, 100% 70%, 0 70%); }
          25% { clip-path: polygon(0 20%, 100% 20%, 100% 35%, 0 35%); }
          50% { clip-path: polygon(0 5%, 100% 5%, 100% 15%, 0 15%); }
          75% { clip-path: polygon(0 75%, 100% 75%, 100% 90%, 0 90%); }
        }
        
        @keyframes blink {
          0%, 100% { background: transparent; }
          50% { background: #00ffff; }
        }
        
        .not-found-grid::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 30px 30px;
          animation: pan-grid 20s linear infinite;
          z-index: -1;
        }
        
        .glitch-text {
          position: relative;
          animation: glitch-main 3s infinite linear alternate-reverse;
        }
        
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .glitch-text::before {
          color: #ff3c3c;
          left: -2px;
          text-shadow: -2px 0 #ff3c3c;
          animation: glitch-anim-1 2s infinite linear alternate-reverse;
          clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
        }
        
        .glitch-text::after {
          color: #00ffff;
          left: 2px;
          text-shadow: 2px 0 #00ffff;
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
          clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0 100%);
        }
        
        .terminal-cursor {
          display: inline-block;
          width: 10px;
          height: 1.2rem;
          background: #00ffff;
          animation: blink 1s step-end infinite;
          margin-left: 5px;
        }
        
        .fade-in-container {
          animation: fade-in 1s ease-out;
        }
      `}</style>
      
      <div 
        className="not-found-grid m-0 p-0 bg-black text-gray-200 flex items-center justify-center overflow-hidden relative"
        style={{ 
          fontFamily: "'Fira Code', monospace",
          height: "calc(100vh - 120px)"
        }}
      >
        <div className="fade-in-container text-center p-4 max-w-[90vw] w-full">
          <div 
            className="glitch-text text-blue-400 relative mb-4"
            data-text="404"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(3rem, 8vw, 8rem)",
              textShadow: "0 0 20px #00aaff"
            }}
          >
            404
          </div>
          
          <p 
            className="text-gray-400 my-4 uppercase tracking-widest font-semibold"
            style={{ fontSize: "clamp(1.2rem, 3vw, 1.5rem)", letterSpacing: "2px" }}
          >
            SIGNAL LOST
          </p>
          
          <p 
            className="text-gray-300 my-4 mb-8"
            style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)" }}
          >
            The page you're looking for has drifted into the digital void...
          </p>
          
          <div 
            className="max-w-[90vw] w-full max-w-lg mx-auto mb-8 bg-gray-900 bg-opacity-60 border border-gray-700 rounded-xl p-6 text-left backdrop-blur-sm shadow-2xl overflow-hidden"
            style={{ fontSize: "clamp(0.8rem, 2vw, 1rem)" }}
          >
            <code 
              className="whitespace-pre-wrap break-words leading-relaxed"
              style={{ fontFamily: "'Fira Code', monospace" }}
            >
              {terminalText.split('\n').map((line, index) => {
                const lineData = lines[index];
                return (
                  <span 
                    key={index} 
                    style={{ color: lineData?.color || '#e0e0e0' }}
                  >
                    {line}
                    {index < terminalText.split('\n').length - 1 && <br />}
                  </span>
                );
              })}
            </code>
            <span className="terminal-cursor"></span>
          </div>
          
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-black border-none rounded-lg no-underline font-bold transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-blue-400/50"
            style={{ 
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
              boxShadow: "0 0 15px #00aaff"
            }}
          >
            RETURN TO KNOWN SECTOR
          </Link>
        </div>
      </div>
    </>
  );
}
