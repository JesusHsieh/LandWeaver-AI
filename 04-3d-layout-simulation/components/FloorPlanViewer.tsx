import React, { useRef, useState, useEffect } from 'react';
import { Point } from '../types';
import { getRelativeCoordinates } from '../utils/canvasUtils';
import { UploadCloud, Move } from 'lucide-react';

interface FloorPlanViewerProps {
  imageSrc: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  marker: Point | null;
  angle: number;
  onMarkerChange: (point: Point) => void;
}

const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  imageSrc,
  onImageUpload,
  marker,
  angle,
  onMarkerChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number, height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
         setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageSrc || !containerRef.current) return;
    const point = getRelativeCoordinates(e, containerRef.current);
    onMarkerChange(point);
  };

  return (
    <div className="flex-1 bg-slate-900/50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {!imageSrc ? (
        <div className="text-center p-10 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 transition-colors cursor-pointer group">
           <label className="cursor-pointer flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">上傳平面圖</h3>
            <p className="text-slate-400 text-sm max-w-xs">點擊選擇裝置中的 PNG 或 JPG 平面圖檔案。</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImageUpload}
            />
          </label>
        </div>
      ) : (
        <div className="relative shadow-2xl rounded-lg overflow-hidden max-w-full max-h-full border border-slate-700">
          <div 
            ref={containerRef}
            className="relative cursor-crosshair select-none"
            onClick={handleClick}
          >
            <img
              src={imageSrc}
              alt="Floor Plan"
              className="max-h-[80vh] object-contain pointer-events-none"
            />
            
            {/* Marker Overlay */}
            {marker && (
              <div
                className="absolute w-0 h-0 flex items-center justify-center pointer-events-none"
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                }}
              >
                {/* 
                   Visual Marker using SVG.
                   We rotate the entire SVG container.
                   Inside SVG, we draw everything pointing UP (North).
                */}
                <div 
                    style={{ 
                        width: '300px', 
                        height: '300px', 
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: 'center center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Center is 150, 150 */}
                        
                        {/* 1. Field of View Cone (Pointing UP) */}
                        <path d="M150 150 L90 30 L210 30 Z" fill="url(#grad1)" opacity="0.3" />
                        
                        {/* 2. Cone Edges */}
                        <path d="M150 150 L90 30" stroke="red" strokeWidth="1" strokeOpacity="0.5" />
                        <path d="M150 150 L210 30" stroke="red" strokeWidth="1" strokeOpacity="0.5" />

                        {/* 3. Center Direction Line (Strong Arrow) */}
                        <line x1="150" y1="150" x2="150" y2="30" stroke="red" strokeWidth="4" />

                        {/* 4. Arrow Head at tip */}
                        <path d="M150 20 L135 45 L150 35 L165 45 L150 20Z" fill="red" />

                        {/* 5. Text Label - Aligned with the arrow direction (Vertical in SVG space) */}
                        {/* Reading direction: Bottom to Top along the arrow */}
                        <text 
                            x="150" 
                            y="15" 
                            fill="red" 
                            fontSize="14" 
                            fontWeight="bold" 
                            textAnchor="middle" 
                            style={{ textShadow: "0px 0px 4px black" }}
                            transform="rotate(0, 150, 15)"
                        >
                            VIEW DIRECTION
                        </text>

                        {/* 6. Center Dot (Camera Position) */}
                        <circle cx="150" cy="150" r="8" fill="red" stroke="white" strokeWidth="3" />
                        
                        <defs>
                            <linearGradient id="grad1" x1="150" y1="150" x2="150" y2="30" gradientUnits="userSpaceOnUse">
                                <stop stopColor="red" stopOpacity="0.5"/>
                                <stop offset="1" stopColor="red" stopOpacity="0"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
              </div>
            )}
          </div>
          
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white border border-white/10 pointer-events-none flex items-center gap-2">
            <Move className="w-3 h-3" />
            <span className="font-semibold text-red-400">紅點</span> = 您的位置 | <span className="font-semibold text-red-400">紅箭頭</span> = 視野方向
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanViewer;