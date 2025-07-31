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
    <div className="not-found-container">
      <div className="container">
        <div className="glitch-text" data-text="404">404</div>
        <p className="subheading">SIGNAL LOST</p>
        <p className="description">The page you're looking for has drifted into the digital void...</p>
        <div className="terminal-window">
          <code className="terminal-code">
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
          <span className="cursor"></span>
        </div>
        <Link href="/" className="return-link">
          RETURN TO KNOWN SECTOR
        </Link>
      </div>

      <style jsx>{`
        .not-found-container {
          margin: 0;
          padding: 0;
          font-family: 'Fira Code', monospace;
          background: #0a0a0a;
          color: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          overflow: hidden;
          position: relative;
        }

        .not-found-container::before {
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

        @keyframes pan-grid {
          from { background-position: 0 0; }
          to { background-position: -30px -30px; }
        }

        .container {
          text-align: center;
          padding: 1rem;
          animation: fade-in 1s ease-out;
          max-width: 90vw;
          width: 100%;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .glitch-text {
          font-family: 'Orbitron', sans-serif;
          font-size: clamp(3rem, 8vw, 8rem);
          color: #00aaff;
          text-shadow: 0 0 20px #00aaff;
          position: relative;
          animation: glitch-main 3s infinite linear alternate-reverse;
          margin-bottom: 1rem;
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

        @keyframes glitch-main {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }

        .subheading {
          font-size: clamp(1.2rem, 3vw, 1.5rem);
          color: #aaa;
          margin: 1rem 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 600;
        }

        .description {
          color: #ccc;
          margin: 1rem 0 2rem;
          font-size: clamp(0.9rem, 2.5vw, 1.1rem);
        }

        .terminal-window {
          max-width: 90vw;
          width: 100%;
          max-width: 500px;
          margin: 0 auto 2rem;
          background: rgba(16, 18, 27, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          font-size: clamp(0.8rem, 2vw, 1rem);
          text-align: left;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 5px 25px rgba(0,0,0,0.4);
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        .terminal-code {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Fira Code', monospace;
          line-height: 1.5;
        }

        .cursor {
          display: inline-block;
          width: 10px;
          height: 1.2rem;
          background: #00ffff;
          animation: blink 1s step-end infinite;
          margin-left: 5px;
        }

        @keyframes blink {
          0%, 100% { background: transparent; }
          50% { background: #00ffff; }
        }

        .return-link {
          display: inline-block;
          padding: 0.8rem 1.6rem;
          background: linear-gradient(45deg, #00aaff, #00ffff);
          color: #000;
          border: none;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-family: 'Orbitron', sans-serif;
          box-shadow: 0 0 15px #00aaff;
          transition: all 0.3s ease;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
        }

        .return-link:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 0 25px #00aaff, 0 0 40px #00ffff;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .container {
            padding: 0.5rem;
          }

          .glitch-text {
            font-size: clamp(2.5rem, 12vw, 5rem);
          }

          .terminal-window {
            padding: 1rem;
            margin: 0 auto 1.5rem;
          }

          .return-link {
            padding: 0.7rem 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .glitch-text {
            font-size: clamp(2rem, 15vw, 4rem);
          }

          .subheading {
            font-size: clamp(1rem, 4vw, 1.2rem);
            letter-spacing: 1px;
          }

          .terminal-window {
            padding: 0.8rem;
            font-size: 0.85rem;
          }

          .return-link {
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
      </div>
  );
}
