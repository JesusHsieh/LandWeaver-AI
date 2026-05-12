export function CyberBackground() {
  return (
    <div className="cyber-bg">
      <div className="grid-plane" />
      <div className="nebula bg-biosphere-green" style={{ top: '10%', left: '10%' }} />
      <div className="nebula bg-data-blue" style={{ bottom: '10%', right: '10%' }} />
      <div className="absolute inset-0 opacity-20">
        <svg height="100%" viewBox="0 0 1000 1000" width="100%" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#displacementFilter)">
            <path className="contour-path" d="M100,200 Q300,50 500,200 T900,200" />
            <path className="contour-path data-pulse" d="M100,200 Q300,50 500,200 T900,200" style={{ animationDelay: '-1s' }} />
            <path className="contour-path" d="M0,500 Q200,350 400,500 T800,500" />
            <path className="contour-path data-pulse" d="M0,500 Q200,350 400,500 T800,500" style={{ animationDelay: '-2.5s' }} />
            <path className="contour-path" d="M150,800 Q350,650 550,800 T950,800" />
            <path className="contour-path data-pulse" d="M150,800 Q350,650 550,800 T950,800" style={{ animationDelay: '-4s' }} />
          </g>
          <defs>
            <filter id="displacementFilter">
              <feTurbulence baseFrequency="0.01" numOctaves={3} result="noise" type="fractalNoise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={20} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}
