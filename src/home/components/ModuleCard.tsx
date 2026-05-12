import type { ModuleEntry } from '../data/modules';

interface Props {
  module: ModuleEntry;
}

/* ── SVG illustrations for each module ── */
function ModuleIllustration({ number }: { number: string }) {
  switch (number) {
    case '05':
      return (
        <svg className="card-img absolute inset-0 w-full h-full" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="150" r="120" fill="none" stroke="#b6f642" strokeWidth="1" opacity="0.6" />
          <circle cx="200" cy="150" r="90"  fill="none" stroke="#b6f642" strokeWidth="0.7" opacity="0.5" />
          <circle cx="200" cy="150" r="60"  fill="none" stroke="#9bd923" strokeWidth="0.6" opacity="0.4" />
          <circle cx="200" cy="150" r="30"  fill="none" stroke="#9bd923" strokeWidth="0.5" opacity="0.5" />
          <line x1="80"  y1="150" x2="320" y2="150" stroke="#424935" strokeWidth="0.6" opacity="0.7" />
          <line x1="200" y1="30"  x2="200" y2="270" stroke="#424935" strokeWidth="0.6" opacity="0.7" />
          <path d="M50 200 Q120 100 200 150 T350 120" fill="none" stroke="#9bd923" strokeWidth="1.2" opacity="0.5" />
          <circle cx="200" cy="150" r="5" fill="#BCFD49" opacity="1" />
          <circle cx="200" cy="150" r="12" fill="none" stroke="#BCFD49" strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case '01':
      return (
        <svg className="card-img w-full h-full" viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
          <rect x="60"  y="40"  width="80"  height="60" fill="none" stroke="#b6f642" strokeWidth="1" opacity="0.6" />
          <rect x="170" y="55"  width="100" height="80" fill="none" stroke="#9bd923" strokeWidth="0.8" opacity="0.5" />
          <circle cx="110" cy="70" r="20" fill="none" stroke="#b6f642" strokeWidth="0.8" opacity="0.5" />
          <circle cx="270" cy="90" r="30" fill="none" stroke="#9bd923" strokeWidth="0.6" opacity="0.4" />
          <path d="M60 150 Q120 120 180 145 T310 130" fill="none" stroke="#424935" strokeWidth="1.2" opacity="0.6" />
        </svg>
      );
    case '02':
      return (
        <svg className="card-img w-full h-full" viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
          <rect x="40"  y="30"  width="320" height="150" fill="none" stroke="#424935" strokeWidth="0.8" opacity="0.7" />
          <line x1="40" y1="105" x2="360" y2="105" stroke="#424935" strokeWidth="0.6" opacity="0.5" />
          <line x1="200" y1="30" x2="200" y2="180" stroke="#424935" strokeWidth="0.6" opacity="0.5" />
          <rect x="80"  y="50"  width="100" height="80" fill="none" stroke="#b6f642" strokeWidth="1" opacity="0.6" />
          <rect x="220" y="50"  width="100" height="80" fill="none" stroke="#9bd923" strokeWidth="0.8" opacity="0.5" />
        </svg>
      );
    case '03':
      return (
        <svg className="card-img w-full h-full" viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
          <rect x="60" y="30" width="280" height="150" rx="4" fill="none" stroke="#424935" strokeWidth="0.8" opacity="0.6" />
          <circle cx="120" cy="90" r="30" fill="none" stroke="#b6f642" strokeWidth="1" opacity="0.6" />
          <path d="M60 180 L160 110 L220 140 L280 80 L340 180Z" fill="none" stroke="#9bd923" strokeWidth="1" opacity="0.5" />
          <line x1="60" y1="180" x2="340" y2="180" stroke="#424935" strokeWidth="0.6" opacity="0.7" />
        </svg>
      );
    case '04':
      return (
        <svg className="card-img w-full h-full" viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
          <polygon points="200,20 340,110 200,150 60,110" fill="none" stroke="#b6f642" strokeWidth="1" opacity="0.6" />
          <polygon points="200,45 315,112 200,140 85,112" fill="none" stroke="#9bd923" strokeWidth="0.7" opacity="0.4" />
          <line x1="200" y1="20"  x2="200" y2="150" stroke="#424935" strokeWidth="0.6" opacity="0.6" />
          <line x1="60"  y1="110" x2="340" y2="110" stroke="#424935" strokeWidth="0.6" opacity="0.6" />
          <circle cx="200" cy="100" r="7" fill="#BCFD49" opacity="0.8" />
        </svg>
      );
    case '06':
      return (
        <svg className="card-img absolute inset-0 w-full h-full" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
          <rect x="60" y="40" width="280" height="160" fill="none" stroke="#2e6767" strokeWidth="1.5" opacity="0.7" />
          <rect x="80"  y="60"  width="70" height="50" fill="#2e6767" opacity="0.3" rx="2" />
          <rect x="170" y="60"  width="50" height="50" fill="#2e6767" opacity="0.2" rx="2" />
          <rect x="240" y="60"  width="80" height="50" fill="#2e6767" opacity="0.25" rx="2" />
          <rect x="80"  y="130" width="160" height="50" fill="#205b5b" opacity="0.2" rx="2" />
          <circle cx="115" cy="82"  r="14" fill="none" stroke="#2e6767" strokeWidth="1" opacity="0.8" />
          <circle cx="195" cy="82"  r="10" fill="none" stroke="#2e6767" strokeWidth="1" opacity="0.7" />
          <circle cx="275" cy="82"  r="16" fill="none" stroke="#2e6767" strokeWidth="1" opacity="0.8" />
          <text x="310" y="170" fontSize="28" fill="#2e6767" opacity="0.5" fontFamily="monospace">30%</text>
          <line x1="60" y1="200" x2="340" y2="200" stroke="#2e6767" strokeWidth="0.5" opacity="0.4" />
        </svg>
      );
    default:
      return null;
  }
}

/* ── Phase-01 / Phase-03 featured (large horizontal) card ── */
function FeaturedCard({ module }: Props) {
  const isPhase1 = module.phase === 1;

  if (isPhase1) {
    /* Module 05 — wide image left, content right */
    return (
      <a href={`./${module.href}`} className="glass-card relative overflow-hidden group block rounded-lg">
        <div className="flex flex-col md:flex-row min-h-[480px]">

          {/* Image panel */}
          <div className="w-full md:w-3/5 relative h-[320px] md:h-auto overflow-hidden bg-[#050605]">
            {/* Tech grid overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none z-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <pattern height="40" id="tech-grid-1" patternUnits="userSpaceOnUse" width="40">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#BCFD49" strokeWidth="0.2" />
                  <circle cx="0" cy="0" fill="#00F0FF" r="1" />
                </pattern>
                <rect fill="url(#tech-grid-1)" height="100%" width="100%" />
              </svg>
            </div>
            <ModuleIllustration number={module.number} />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
            {/* Scan line on hover */}
            <div
              className="absolute top-0 left-0 w-full h-1 bg-biosphere-green shadow-[0_0_15px_#BCFD49] opacity-0 group-hover:opacity-100 z-20"
              style={{ animation: 'scan-vertical 4s linear infinite' }}
            />
          </div>

          {/* Content panel */}
          <div className="w-full md:w-2/5 p-12 flex flex-col justify-center space-y-8 bg-[#050605]/60 backdrop-blur-xl relative">
            <div className="absolute top-4 right-4 text-[10px] font-display-phase text-data-blue opacity-50 tracking-widest">
              {module.activeLabel}
            </div>
            <div>
              <span className="font-display-phase text-primary-fixed-dim block mb-3 text-sm">{module.number}.</span>
              <h3 className="font-headline-lg text-primary text-3xl group-hover:text-biosphere-green transition-colors glitch-text">
                {module.title}
              </h3>
              <p className="font-body-md text-on-surface-variant mt-6 leading-relaxed opacity-80">
                {module.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {module.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] px-2.5 py-1 border border-biosphere-green/20 text-biosphere-green/60 tracking-wide rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="btn-cyber inline-flex items-center gap-4 px-10 py-4 font-label-caps text-primary-fixed-dim rounded cursor-pointer">
                LAUNCH ANALYSIS
                <span className="material-symbols-outlined text-[20px]">north_east</span>
              </span>
            </div>
          </div>
        </div>
      </a>
    );
  }

  /* Module 06 — narrow image left, wider content right */
  return (
    <a href={`./${module.href}`} className="glass-card relative overflow-hidden group block rounded-lg">
      <div className="flex flex-col md:flex-row min-h-[280px]">

        {/* Image panel */}
        <div className="w-full md:w-2/5 relative h-[200px] md:h-auto overflow-hidden bg-[#050605]">
          <div className="absolute inset-0 opacity-20 pointer-events-none z-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <pattern height="40" id="tech-grid-6" patternUnits="userSpaceOnUse" width="40">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2e6767" strokeWidth="0.2" />
                <circle cx="0" cy="0" fill="#2e6767" r="1" />
              </pattern>
              <rect fill="url(#tech-grid-6)" height="100%" width="100%" />
            </svg>
          </div>
          <ModuleIllustration number={module.number} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
          <div
            className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 z-20"
            style={{ background: '#2e6767', animation: 'scan-vertical 4s linear infinite' }}
          />
        </div>

        {/* Content panel */}
        <div className="w-full md:w-3/5 p-10 flex flex-col justify-center space-y-6 bg-[#050605]/60 backdrop-blur-xl relative">
          <div
            className="absolute top-4 right-4 text-[10px] font-display-phase opacity-50 tracking-widest"
            style={{ color: '#2e6767' }}
          >
            {module.activeLabel}
          </div>
          <div>
            <span className="font-display-phase text-primary-fixed-dim block mb-2 text-sm">{module.number}.</span>
            <h3 className="font-headline-lg text-primary text-2xl transition-colors glitch-text">
              <span className="group-hover:text-[#4a9e9e] transition-colors duration-300">{module.title}</span>
            </h3>
            <p className="font-body-md text-on-surface-variant mt-4 leading-relaxed opacity-80">
              {module.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {module.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[10px] px-2.5 py-1 rounded tracking-wide"
                  style={{ border: '1px solid rgba(46,103,103,0.4)', color: 'rgba(46,103,103,0.9)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span
              className="inline-flex items-center gap-3 px-8 py-3 font-label-caps text-sm rounded cursor-pointer transition-all duration-300"
              style={{ border: '1px solid rgba(46,103,103,0.5)', color: '#4a9e9e', background: 'rgba(46,103,103,0.08)' }}
            >
              LAUNCH CALCULATOR
              <span className="material-symbols-outlined text-[18px]">north_east</span>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

/* ── Standard (smaller) card — used in Phase 02 grid ── */
function StandardCard({ module }: Props) {
  const isBlue = module.accentColor === '#00F0FF';
  const accentClass = isBlue ? 'text-data-blue' : 'text-biosphere-green';
  const scanColor = isBlue ? 'bg-data-blue shadow-[0_0_15px_#00F0FF]' : 'bg-biosphere-green shadow-[0_0_15px_#BCFD49]';

  return (
    <a
      href={`./${module.href}`}
      className="glass-card flex flex-col group overflow-hidden glitch-hover min-h-[400px] rounded-lg block"
    >
      <div className="relative overflow-hidden bg-black/40" style={{ height: '60%' }}>
        <ModuleIllustration number={module.number} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050605] to-transparent" />
        <div
          className={`absolute top-0 left-0 w-full h-1 ${scanColor} opacity-0 group-hover:opacity-100 z-20`}
          style={{ animation: 'scan-vertical 3s linear infinite' }}
        />
      </div>
      <div className="flex flex-col justify-between flex-grow relative z-10 p-6">
        <div>
          <div className="flex justify-between items-start">
            <span className="font-display-phase text-primary-fixed-dim text-sm">{module.number}.</span>
            <span className={`material-symbols-outlined text-surface-variant group-hover:${accentClass} transition-all duration-500`}>
              {module.icon}
            </span>
          </div>
          <h3 className={`font-headline-lg text-primary text-2xl group-hover:${accentClass} glitch-text transition-colors duration-500 mt-2`}>
            {module.title}
          </h3>
          <p className="font-body-md text-on-surface-variant leading-relaxed opacity-70 mt-2">
            {module.description}
          </p>
        </div>
        <div className="flex justify-end pt-4">
          <span className={`material-symbols-outlined text-surface-variant group-hover:${accentClass} group-hover:translate-x-2 transition-all duration-500`}>
            arrow_forward
          </span>
        </div>
      </div>
    </a>
  );
}

export function ModuleCard({ module }: Props) {
  if (module.variant === 'featured') {
    return <FeaturedCard module={module} />;
  }
  return <StandardCard module={module} />;
}
