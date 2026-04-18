
import React, { useRef, useState, MouseEvent, useEffect } from 'react';
import { Shape, ToolMode, Point, TerrainMaterial, PathMaterial, ArrowType, LineStyle } from '../types';
import { getPolygonArea, getPolylineLength, getPolygonCentroid, getDistance, PATH_MATERIAL_COLORS, PATH_MATERIAL_LABELS } from '../utils';

interface DrawingCanvasProps {
  backgroundImage: string | null;
  showBackground: boolean;
  toolMode: ToolMode;
  currentSettings: { 
      width: number; 
      label: string;
      terrain: TerrainMaterial;
      pathMaterial: PathMaterial;
      arrowStart: boolean;
      arrowEnd: boolean;
      arrowType: ArrowType;
      lineStyle: LineStyle;
      showLabel: boolean;
  };
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  width: number;
  height: number;
  setCanvasRef: (ref: HTMLDivElement | null) => void;
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  lockedModes: ToolMode[];
  scale: number; // Pixels per meter
  onCalibrationFinish?: (pixels: number) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  backgroundImage,
  showBackground,
  toolMode,
  currentSettings,
  shapes,
  onShapesChange,
  width,
  height,
  setCanvasRef,
  selectedShapeId,
  onSelectShape,
  lockedModes,
  scale,
  onCalibrationFinish
}) => {
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Reset points when tool changes to avoid stuck states
  useEffect(() => {
    setCurrentPoints([]);
    setIsPressed(false);
  }, [toolMode]);

  // Helper to get coordinates relative to SVG
  const getRelativePoint = (e: MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (toolMode === ToolMode.SELECT || toolMode === ToolMode.BACKGROUND) {
        onSelectShape(null); // Deselect on background click
        return;
    }
    
    // Check if the current tool is locked
    if (lockedModes.includes(toolMode)) {
        return;
    }
    
    const point = getRelativePoint(e);

    // SCALE Tool Logic: Explicit "Click Start" -> "Click End"
    if (toolMode === ToolMode.SCALE) {
        if (currentPoints.length === 0) {
            setCurrentPoints([point]);
        } else {
            const startPoint = currentPoints[0];
            const dist = getDistance(startPoint, point);
            
            if (dist > 5 && onCalibrationFinish) {
                onCalibrationFinish(dist);
            }
            setCurrentPoints([]); // Reset
        }
        return;
    }

    setIsPressed(true);
    setCurrentPoints(prev => [...prev, point]);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (toolMode === ToolMode.SELECT || toolMode === ToolMode.BACKGROUND) return;
    
    const point = getRelativePoint(e);

    if (toolMode === ToolMode.SCALE) {
        if (currentPoints.length === 1) {
            setCurrentPoints([currentPoints[0], point]);
        } else if (currentPoints.length === 2) {
             setCurrentPoints([currentPoints[0], point]);
        }
        return;
    }

    if (isPressed) {
       const lastPoint = currentPoints[currentPoints.length - 1];
       if (lastPoint && getDistance(lastPoint, point) > 5) {
           setCurrentPoints(prev => {
               const newPts = [...prev, point];
               // Auto-close check for Polygons only
               if (toolMode !== ToolMode.PATH && newPts.length > 10) {
                   const startPoint = newPts[0];
                   if (getDistance(point, startPoint) < 20) {
                       finishShapeInternal(newPts, true); 
                       return []; 
                   }
               }
               return newPts;
           });
       }
    }
  };

  const handleMouseUp = () => {
      if (toolMode === ToolMode.SCALE) return;
      setIsPressed(false);
  };

  const handleDoubleClick = () => {
    if (toolMode !== ToolMode.SELECT && toolMode !== ToolMode.BACKGROUND && toolMode !== ToolMode.SCALE && currentPoints.length > 1) {
      const shouldClose = toolMode !== ToolMode.PATH; 
      finishShapeInternal(currentPoints, shouldClose); 
      setCurrentPoints([]);
    }
  };

  const getColorForMode = (mode: ToolMode) => {
      switch (mode) {
          case ToolMode.BOUNDARY: return 'none'; 
          case ToolMode.BUBBLE: return 'rgba(34, 197, 94, 0.4)'; 
          case ToolMode.PATH: 
            return PATH_MATERIAL_COLORS[currentSettings.pathMaterial || PathMaterial.NONE];
          default: return 'black';
      }
  };

  const finishShapeInternal = (points: Point[], shouldClose: boolean) => {
      setIsPressed(false);
      
      const uniquePoints = points.filter((p, i) => {
          if (i === 0) return true;
          return getDistance(p, points[i-1]) > 1; 
      });

      if (uniquePoints.length < 2) return;

      const newShape: Shape = {
        id: Date.now().toString(),
        type: toolMode,
        points: uniquePoints,
        label: currentSettings.label,
        showLabel: currentSettings.showLabel,
        pathWidth: toolMode === ToolMode.PATH ? currentSettings.width : undefined,
        arrowStart: toolMode === ToolMode.PATH ? currentSettings.arrowStart : false,
        arrowEnd: toolMode === ToolMode.PATH ? currentSettings.arrowEnd : false,
        arrowType: toolMode === ToolMode.PATH ? currentSettings.arrowType : 'FILLED',
        lineStyle: toolMode === ToolMode.PATH ? currentSettings.lineStyle : 'SOLID',
        terrainMaterial: toolMode === ToolMode.BOUNDARY ? currentSettings.terrain : undefined,
        pathMaterial: toolMode === ToolMode.PATH ? currentSettings.pathMaterial : undefined,
        color: getColorForMode(toolMode),
      };

      onShapesChange([...shapes, newShape]);
      setCurrentPoints([]); 
  };

  /**
   * Generates a Smooth SVG path using Quadratic Bezier curves.
   * This is used for Path and Bubble to make them look organic.
   */
  const pointsToSmoothPath = (pts: Point[], close: boolean) => {
      if (pts.length < 2) return '';
      if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

      let d = `M ${pts[0].x} ${pts[0].y}`;

      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        
        if (i === 0) {
           // For the first segment, draw a straight line to the midpoint to start the curve
           d += ` L ${(p0.x + p1.x) / 2} ${(p0.y + p1.y) / 2}`;
        }
        
        const nextMidX = (p1.x + (pts[i+2]?.x || p1.x)) / 2;
        const nextMidY = (p1.y + (pts[i+2]?.y || p1.y)) / 2;

        // Quadratic curve from current midpoint to next midpoint, using p1 as control
        if (i < pts.length - 2) {
            d += ` Q ${p1.x} ${p1.y} ${nextMidX} ${nextMidY}`;
        } else {
            d += ` L ${p1.x} ${p1.y}`;
        }
      }

      if (close) d += ' Z';
      return d;
  };

  const pointsToLinearPath = (pts: Point[], close: boolean) => {
    if (pts.length === 0) return '';
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return close ? `${d} Z` : d;
  };
  
  // Calculate Arrow Rotation
  const getArrowRotation = (p1: Point, p2: Point) => {
      const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      return (angleRad * 180) / Math.PI;
  };

  // --- LAYERING LOGIC ---
  // STRICT ORDER: Boundary (1) -> Bubble (2) -> Path (3)
  // This ensures paths are always drawn ON TOP of bubbles.
  const getLayerOrder = (type: ToolMode) => {
      switch (type) {
          case ToolMode.BOUNDARY: return 1;
          case ToolMode.BUBBLE: return 2;
          case ToolMode.PATH: return 3;
          default: return 0;
      }
  };

  // Helper: Check if points are dense enough to warrant smoothing (e.g. drawn by dragging)
  // If points are far apart, it's likely a "click-click" straight line input.
  const isFreehandDrawing = (points: Point[]): boolean => {
      if (points.length < 3) return false;
      let totalDist = 0;
      for(let i = 0; i < points.length - 1; i++) {
          totalDist += getDistance(points[i], points[i+1]);
      }
      const avgDist = totalDist / (points.length - 1);
      
      // Threshold: If avg distance between points is small (<20px), assume freehand/dragging -> Apply Smoothing.
      // If avg distance is large, assume specific click waypoints -> Apply Linear.
      return avgDist < 20; 
  };

  // Sort shapes for rendering
  const sortedShapes = [...shapes].sort((a, b) => {
      const layerA = getLayerOrder(a.type);
      const layerB = getLayerOrder(b.type);
      
      if (layerA !== layerB) {
          return layerA - layerB; // Ascending order: 1 (Bottom), 2, 3 (Top)
      }
      return parseInt(a.id) - parseInt(b.id);
  });

  return (
    <div 
        ref={setCanvasRef}
        className="relative bg-white overflow-hidden select-none"
        style={{ width, height, cursor: (toolMode === ToolMode.SELECT || toolMode === ToolMode.BACKGROUND) ? 'default' : 'crosshair' }}
    >
      {/* Background Layer */}
      {backgroundImage && (
        <img 
          src={backgroundImage} 
          alt="Site Base" 
          className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 ${showBackground ? 'opacity-50' : 'opacity-0'}`}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Grid */}
      {!backgroundImage && (
         <div className="absolute inset-0 opacity-10" 
              style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
         </div>
      )}

      {/* SVG Drawing Layer */}
      <svg 
        ref={svgRef}
        width={width} 
        height={height} 
        className="absolute top-0 left-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {sortedShapes.map(shape => {
           const isPolygon = shape.type === ToolMode.BOUNDARY || shape.type === ToolMode.BUBBLE;
           const center = isPolygon ? getPolygonCentroid(shape.points) : shape.points[Math.floor(shape.points.length / 2)];
           const isSelected = shape.id === selectedShapeId;
           const isLocked = lockedModes.includes(shape.type);

           // VISUAL: Smooth only if freehand or user preference (implicit density check)
           // If user clicked far apart points, force linear.
           let renderSmooth = false;
           if (shape.type === ToolMode.PATH || shape.type === ToolMode.BUBBLE) {
               renderSmooth = isFreehandDrawing(shape.points);
           }
           
           const pathD = renderSmooth ? pointsToSmoothPath(shape.points, isPolygon) : pointsToLinearPath(shape.points, isPolygon);
           
           const area = isPolygon ? getPolygonArea(shape.points, scale) : 0;
           const length = !isPolygon ? getPolylineLength(shape.points, scale) : 0;

           let strokeColor = 'black';
           let strokeDash = '0';
           let fillColor = 'none';
           let strokeW = 2;

           if (shape.type === ToolMode.BUBBLE) {
               // BUBBLE CHANGE: Remove stroke completely. Use only Fill.
               // This prevents the "Dashed Line" from appearing in the AI generation.
               strokeColor = 'none';
               strokeDash = '0'; 
               fillColor = shape.color; 
           } else if (shape.type === ToolMode.PATH) {
               strokeColor = shape.color; 
               strokeDash = '0';
               strokeW = (shape.pathWidth || 1) * scale;
               
               // Apply Dashed style if selected
               if (shape.lineStyle === 'DASHED') {
                   // Create a dash pattern that scales roughly with stroke width for visibility, 
                   // but remains clear as a dashed line.
                   // 3x width dash, 2x width gap is a good ratio.
                   const dashSize = Math.max(strokeW * 2, 10);
                   strokeDash = `${dashSize}, ${dashSize}`;
               }
           } else if (shape.type === ToolMode.BOUNDARY) {
               strokeColor = 'black';
               fillColor = 'none';
               strokeW = 3;
           } else {
               strokeColor = shape.color;
           }

           let labelText = shape.label || '';
           if (shape.type === ToolMode.PATH && shape.pathMaterial && shape.pathMaterial !== 'NONE') {
               const matLabel = PATH_MATERIAL_LABELS[shape.pathMaterial];
               if (matLabel) {
                   const shortName = matLabel.split(' (')[0]; 
                   labelText = labelText ? `${labelText} [${shortName}]` : shortName;
               }
           }
           
           // Calculate Arrows if Path
           const showArrowStart = !isPolygon && shape.arrowStart && shape.points.length >= 2;
           const showArrowEnd = !isPolygon && shape.arrowEnd && shape.points.length >= 2;
           
           let startTransform = '';
           let endTransform = '';
           
           if (showArrowStart) {
               const p0 = shape.points[0];
               const p1 = shape.points[1];
               // Pointing back from p1 to p0
               const rot = getArrowRotation(p1, p0);
               startTransform = `translate(${p0.x}, ${p0.y}) rotate(${rot})`;
           }
           
           if (showArrowEnd) {
               const n = shape.points.length;
               const pn = shape.points[n-1];
               const pn_1 = shape.points[n-2];
               const rot = getArrowRotation(pn_1, pn);
               endTransform = `translate(${pn.x}, ${pn.y}) rotate(${rot})`;
           }

           const isLinearArrow = shape.arrowType === 'LINEAR';
           const arrowPathD = isLinearArrow 
                ? "M0,-4 L6,0 L0,4" // Chevron (Base at 0, Tip at 6)
                : "M5,0 L0,-3 L0,3 Z"; // Triangle (Base at 0, Tip at 5)
           const arrowFill = isLinearArrow ? 'none' : strokeColor;
           const arrowStroke = isLinearArrow ? strokeColor : 'none';
           const arrowStrokeW = isLinearArrow ? Math.max(2, strokeW/2) : 0; // Linear arrow line weight

           return (
             <g 
                key={shape.id}
                onClick={(e) => {
                    if (toolMode === ToolMode.SELECT && !isLocked) {
                        e.stopPropagation();
                        onSelectShape(shape.id);
                    }
                }}
                style={{ 
                    cursor: toolMode === ToolMode.SELECT ? (isLocked ? 'not-allowed' : 'pointer') : 'inherit',
                    opacity: isLocked ? 0.8 : 1
                }}
             >
               {/* Hit Area for Paths */}
               {!isPolygon && (
                 <path 
                   d={pathD}
                   fill="none"
                   stroke="transparent"
                   strokeWidth="20"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                 />
               )}

               {/* Selection Highlight */}
               {isSelected && (
                   <path 
                     d={pathD}
                     fill="none"
                     stroke="#3b82f6"
                     strokeWidth={strokeW + 6}
                     strokeOpacity="0.5"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                   />
               )}

               {/* Actual Shape */}
               <path 
                 d={pathD}
                 fill={fillColor}
                 stroke={strokeColor}
                 strokeWidth={strokeW}
                 strokeDasharray={strokeDash}
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 className="transition-all hover:opacity-90"
               />
               
               {/* Arrows */}
               {showArrowStart && (
                   <path 
                     d={arrowPathD} 
                     fill={arrowFill} 
                     stroke={arrowStroke}
                     strokeWidth={arrowStrokeW}
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     transform={`${startTransform} scale(${Math.max(1, strokeW/2)})`} 
                   />
               )}
               {showArrowEnd && (
                   <path 
                     d={arrowPathD} 
                     fill={arrowFill} 
                     stroke={arrowStroke}
                     strokeWidth={arrowStrokeW}
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     transform={`${endTransform} scale(${Math.max(1, strokeW/2)})`}
                   />
               )}
               
               {/* Labels */}
               {(shape.showLabel !== false) && (
                   <>
                       <text 
                         x={center.x} 
                         y={center.y - 10} 
                         textAnchor="middle" 
                         fill="#000000" 
                         fontSize="12" 
                         fontWeight="bold"
                         className="bg-white"
                         style={{ textShadow: '0px 0px 4px white', pointerEvents: 'none' }}
                       >
                         {labelText}
                       </text>
                       <text 
                         x={center.x} 
                         y={center.y + 15} 
                         textAnchor="middle" 
                         fill="#000000" 
                         fontSize="10"
                         fontWeight="500"
                         style={{ textShadow: '0px 0px 4px white', pointerEvents: 'none' }}
                       >
                         {area > 0 ? `${Math.round(area)} m²` : ''}
                         {length > 0 ? `長: ${Math.round(length)} m` : ''}
                       </text>
                   </>
               )}
             </g>
           );
        })}

        {/* Render Current Drawing Line - Always Top */}
        {currentPoints.length > 0 && (
          <g style={{ pointerEvents: 'none' }}>
            {/* While drawing, use Linear Path for immediate feedback accuracy */}
            <path 
                d={pointsToLinearPath(currentPoints, toolMode !== ToolMode.PATH)}
                fill={toolMode === ToolMode.BUBBLE ? 'rgba(34, 197, 94, 0.2)' : 'none'}
                stroke={toolMode === ToolMode.SCALE ? "#ef4444" : "blue"}
                strokeWidth="2"
                strokeDasharray={toolMode === ToolMode.SCALE ? "0" : "5,5"}
            />
            
            {toolMode === ToolMode.SCALE && currentPoints.length > 1 && (
                <text 
                    x={(currentPoints[0].x + currentPoints[1].x) / 2} 
                    y={(currentPoints[0].y + currentPoints[1].y) / 2 - 10} 
                    fill="red" 
                    fontSize="12" 
                    fontWeight="bold" 
                    textAnchor="middle"
                    style={{ textShadow: '0 0 2px white' }}
                >
                    {Math.round(getDistance(currentPoints[0], currentPoints[1]))} px
                </text>
            )}

            {toolMode !== ToolMode.PATH && toolMode !== ToolMode.BACKGROUND && (
                <circle cx={currentPoints[0].x} cy={currentPoints[0].y} r="4" fill={toolMode === ToolMode.SCALE ? "red" : "blue"} fillOpacity="0.5" />
            )}
          </g>
        )}
      </svg>
      
      {currentPoints.length > 0 && toolMode !== ToolMode.SELECT && toolMode !== ToolMode.BACKGROUND && toolMode !== ToolMode.SCALE && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-xs pointer-events-none z-50">
              {toolMode === ToolMode.PATH 
                ? "點擊繪製直線，拖曳繪製曲線。雙擊結束繪製。"
                : "點擊繪製直線，拖曳繪製曲線。雙擊或連接起點以閉合。"}
          </div>
      )}
      {toolMode === ToolMode.SCALE && (
           <div className="absolute bottom-4 left-4 bg-red-600/90 text-white px-3 py-1 rounded text-xs pointer-events-none font-bold z-50">
               {currentPoints.length === 0 ? "1. 點擊起點" : "2. 點擊終點完成校正"}
           </div>
      )}
    </div>
  );
};

export default DrawingCanvas;