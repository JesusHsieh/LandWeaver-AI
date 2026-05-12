import { useEffect } from 'react';
import { CyberBackground } from './components/CyberBackground';
import { PhaseSection } from './components/PhaseSection';
import './home.css';

export default function App() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth)  * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <CyberBackground />

      {/* ── Header ── */}
      <header className="w-full pt-32 pb-16 text-center flex flex-col items-center relative">
        <h1
          className="brand-glow font-black tracking-tighter text-primary leading-none"
          style={{ fontSize: 'clamp(56px,10vw,96px)' }}
        >
          LANDWEAVER AI
        </h1>
        <p className="mt-4 text-on-surface-variant text-sm tracking-[0.05em]">
          景觀設計 AI 工具集 · Landscape Design AI Suite
        </p>
        <div className="mt-6 inline-flex items-center px-5 py-2 rounded-full border border-primary-fixed-dim/30 bg-primary-fixed-dim/5 backdrop-blur-md">
          <span className="font-display-phase text-[10px] tracking-[0.4em] text-primary-fixed-dim uppercase opacity-80 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-biosphere-green animate-pulse" />
            Architectural Intelligence Engine
            <span className="w-1.5 h-1.5 rounded-full bg-data-blue animate-pulse" />
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-6 md:px-margin-safe pb-xl space-y-xl relative z-10">
        <PhaseSection phase={1} />
        <PhaseSection phase={2} />
        <PhaseSection phase={3} />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-transparent font-display-phase tracking-[0.1em] text-[11px] uppercase w-full py-16 border-t border-surface-variant/30 relative z-10 mt-xl">
        <div className="max-w-7xl mx-auto px-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-biosphere-green font-black tracking-[0.2em] opacity-60">
            © 2026 LandWeaver AI · Built by C.L Hsieh
          </div>
          <div className="flex gap-10">
            <a
              className="text-gray-500 hover:text-biosphere-green hover:drop-shadow-[0_0_8px_rgba(188,253,73,0.5)] transition-all duration-300"
              href="https://github.com/JesusHsieh/LandWeaver-AI"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
