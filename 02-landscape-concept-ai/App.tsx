
import React, { useState, useRef, useEffect } from 'react';
import { 
    Layout, Upload, Eraser, Map, MousePointer2, Activity, 
    Pencil, PlayCircle, Image as ImageIcon, Download, Loader2, Undo, Trash2,
    Lock, Unlock, Ruler, Eye, EyeOff, Settings, RotateCcw, X,
    MoveLeft, MoveRight, Type, ChevronsRight, ChevronRight, Triangle, Minus, MoreHorizontal
} from 'lucide-react';
import DrawingCanvas from './components/DrawingCanvas';
import { ToolMode, Shape, RenderStyle, TerrainMaterial, PathMaterial, BackgroundType, ArrowType, LineStyle } from './types';
import { fileToBase64, PATH_MATERIAL_COLORS, PATH_MATERIAL_LABELS, TERRAIN_MATERIAL_LABELS, BACKGROUND_LABELS, STYLE_LABELS } from './utils';
import { generateLandscapePlan } from './services/geminiService';
import html2canvas from 'html2canvas';

// Component Styles
const BUTTON_CLASS = "p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all text-xs font-medium relative group cursor-pointer";
const ACTIVE_BTN = "bg-blue-600 text-white shadow-md ring-2 ring-blue-300";
const INACTIVE_BTN = "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200";

// Common Input Style for "White Background, Black Text"
const INPUT_STYLE = "border border-slate-300 rounded px-2 py-1 text-sm bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none";

const App: React.FC = () => {
  // State: Canvas & Data
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [refStyleImage, setRefStyleImage] = useState<string | null>(null);
  const [showBackground, setShowBackground] = useState(true);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [pixelsPerMeter, setPixelsPerMeter] = useState<number>(10); // Default scale
  const [calibrationLength, setCalibrationLength] = useState<number>(10); // Reference length for calibration
  
  // State: Tools
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.SELECT);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [lockedModes, setLockedModes] = useState<ToolMode[]>([]);

  // Current Settings (Default values for new shapes)
  const [labelInput, setLabelInput] = useState<string>("");
  const [pathWidth, setPathWidth] = useState<number>(2.0);
  const [currentTerrain, setCurrentTerrain] = useState<TerrainMaterial>(TerrainMaterial.NONE); // Default NONE
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(BackgroundType.NONE);
  
  // Default material is NONE
  const [currentPathMaterial, setCurrentPathMaterial] = useState<PathMaterial>(PathMaterial.NONE);
  
  // Path Specific Settings
  const [arrowStart, setArrowStart] = useState<boolean>(false);
  const [arrowEnd, setArrowEnd] = useState<boolean>(false);
  const [arrowType, setArrowType] = useState<ArrowType>('FILLED'); // Default filled
  const [lineStyle, setLineStyle] = useState<LineStyle>('SOLID'); // Default solid
  const [showLabel, setShowLabel] = useState<boolean>(true);

  // State: Generation
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<RenderStyle>(RenderStyle.REALISTIC);
  const [customPrompt, setCustomPrompt] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  // Effect: Sync inputs when selection changes
  useEffect(() => {
    if (selectedShapeId) {
        const shape = shapes.find(s => s.id === selectedShapeId);
        if (shape) {
            setLabelInput(shape.label || "");
            if (shape.pathWidth) setPathWidth(shape.pathWidth);
            // Sync Terrain Material
            setCurrentTerrain(shape.terrainMaterial || TerrainMaterial.NONE);
            // If the shape has a material, use it. If not (old shapes), default to NONE
            setCurrentPathMaterial(shape.pathMaterial || PathMaterial.NONE);
            
            // Sync Path options
            setArrowStart(!!shape.arrowStart);
            setArrowEnd(!!shape.arrowEnd);
            setArrowType(shape.arrowType || 'FILLED');
            setLineStyle(shape.lineStyle || 'SOLID');
            setShowLabel(shape.showLabel !== false); // Default to true if undefined
        }
    } else {
        // Reset defaults when deselecting
        setCurrentPathMaterial(PathMaterial.NONE);
        setCurrentTerrain(TerrainMaterial.NONE);
        setLabelInput("");
        setArrowStart(false);
        setArrowEnd(false);
        setArrowType('FILLED');
        setLineStyle('SOLID');
        setShowLabel(true);
    }
  }, [selectedShapeId, shapes]);

  // Handlers
  const handleToolChange = (mode: ToolMode, defaultLabel: string = "") => {
      setToolMode(mode);
      setSelectedShapeId(null);
      setLabelInput(defaultLabel);
      // Reset material to NONE when switching tools
      if (mode === ToolMode.PATH) {
          setCurrentPathMaterial(PathMaterial.NONE);
          setArrowStart(false);
          setArrowEnd(false);
          setLineStyle('SOLID');
      }
      if (mode === ToolMode.BOUNDARY) {
          setCurrentTerrain(TerrainMaterial.NONE);
      }
      setShowLabel(true);
  };

  const toggleLock = (mode: ToolMode, e: React.MouseEvent) => {
    e.stopPropagation();
    setLockedModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
    if (selectedShapeId) {
       const shape = shapes.find(s => s.id === selectedShapeId);
       if (shape && shape.type === mode) {
           setSelectedShapeId(null);
       }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isBg: boolean) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        if (isBg) setBackgroundImage(base64);
        else setRefStyleImage(base64);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
  };

  // Called when user finishes drawing the calibration line (2nd click)
  const handleCalibrationFinish = (pixels: number) => {
      if (calibrationLength > 0 && pixels > 0) {
          const newScale = pixels / calibrationLength;
          setPixelsPerMeter(newScale);
          setToolMode(ToolMode.BACKGROUND); // Automatically return to settings
      } else {
          alert("請確保校正長度大於 0");
      }
  };

  // Generic Update Handler for Shapes
  const updateSelectedShape = (updates: Partial<Shape>) => {
      if (selectedShapeId) {
          setShapes(prev => prev.map(s => s.id === selectedShapeId ? { ...s, ...updates } : s));
      } else {
          // If no shape is selected, these might update "current settings" state for the next drawing
          if (updates.pathMaterial) setCurrentPathMaterial(updates.pathMaterial);
          if (updates.terrainMaterial) setCurrentTerrain(updates.terrainMaterial);
          if (updates.pathWidth) setPathWidth(updates.pathWidth);
          if (updates.label !== undefined) setLabelInput(updates.label);
          if (updates.arrowStart !== undefined) setArrowStart(updates.arrowStart);
          if (updates.arrowEnd !== undefined) setArrowEnd(updates.arrowEnd);
          if (updates.arrowType !== undefined) setArrowType(updates.arrowType);
          if (updates.lineStyle !== undefined) setLineStyle(updates.lineStyle);
          if (updates.showLabel !== undefined) setShowLabel(updates.showLabel);
      }
  };

  const handleDeleteShape = () => {
      if (selectedShapeId) {
          setShapes(prev => prev.filter(s => s.id !== selectedShapeId));
          setSelectedShapeId(null);
      }
  };

  const handleGenerate = async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedImage(null);

    try {
        // 1. Capture the canvas
        const canvasElement = await html2canvas(canvasRef.current, {
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const sketchBase64 = canvasElement.toDataURL('image/png');

        // 2. Call API
        const resultImage = await generateLandscapePlan(
            sketchBase64,
            refStyleImage,
            selectedStyle,
            backgroundType,
            customPrompt,
            canvasRef.current.clientWidth,
            canvasRef.current.clientHeight,
            shapes // Pass shapes for metadata extraction
        );

        setGeneratedImage(resultImage);

    } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "生成失敗");
    } finally {
        setIsGenerating(false);
    }
  };

  const undoLastShape = () => {
      let indexToRemove = -1;
      for (let i = shapes.length - 1; i >= 0; i--) {
          if (!lockedModes.includes(shapes[i].type)) {
              indexToRemove = i;
              break;
          }
      }

      if (indexToRemove !== -1) {
          const newShapes = [...shapes];
          newShapes.splice(indexToRemove, 1);
          setShapes(newShapes);
          
          if (selectedShapeId === shapes[indexToRemove].id) {
              setSelectedShapeId(null);
          }
      }
  };

  const handleReset = (e?: React.MouseEvent) => {
      // Prevent default to ensure no form submission or bubble issues
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (window.confirm("確定要全部清除並重新開始嗎？此動作無法復原。")) {
          // Clear Images
          setBackgroundImage(null);
          setRefStyleImage(null);
          setGeneratedImage(null);
          
          // Clear File Inputs to allow re-uploading same file
          if (fileInputRef.current) fileInputRef.current.value = "";
          if (styleInputRef.current) styleInputRef.current.value = "";

          // Clear Shapes
          setShapes([]);
          
          // Reset Tools & Selection
          setToolMode(ToolMode.SELECT);
          setSelectedShapeId(null);
          setLockedModes([]);
          setIsGenerating(false);
          
          // Reset Settings to Defaults
          setLabelInput("");
          setPathWidth(2.0);
          setCurrentTerrain(TerrainMaterial.NONE);
          setCurrentPathMaterial(PathMaterial.NONE);
          setBackgroundType(BackgroundType.NONE);
          setArrowStart(false);
          setArrowEnd(false);
          setArrowType('FILLED');
          setLineStyle('SOLID');
          setShowLabel(true);
          
          // Reset Generation Settings
          setSelectedStyle(RenderStyle.REALISTIC);
          setCustomPrompt("");
          setErrorMsg(null);
          
          // Reset Scale to default
          setPixelsPerMeter(10);
      }
  };

  // Helper to render tool button with lock
  const renderToolButton = (mode: ToolMode, label: string, icon: React.ReactNode) => {
      const isLocked = lockedModes.includes(mode);
      const isActive = toolMode === mode;
      
      return (
        <div className="relative w-24">
            <button 
                onClick={() => handleToolChange(mode, label)}
                className={`${BUTTON_CLASS} ${isActive ? ACTIVE_BTN : INACTIVE_BTN} w-full`}
            >
                {icon}
                <span>{label}</span>
            </button>
            <button 
                onClick={(e) => toggleLock(mode, e)}
                className={`absolute -top-1 -right-1 p-1 rounded-full shadow-sm border ${isLocked ? 'bg-red-100 border-red-300 text-red-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'} cursor-pointer`}
                title={isLocked ? "解鎖" : "鎖定"}
            >
                {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
            </button>
        </div>
      );
  };

  // Determine what inputs to show based on tool/selection
  const showPathControls = toolMode === ToolMode.PATH || (toolMode === ToolMode.SELECT && shapes.find(s => s.id === selectedShapeId)?.type === ToolMode.PATH);
  
  const showBoundaryControls = toolMode === ToolMode.BOUNDARY || (toolMode === ToolMode.SELECT && shapes.find(s => s.id === selectedShapeId)?.type === ToolMode.BOUNDARY);

  const showBubbleControls = toolMode === ToolMode.BUBBLE || (toolMode === ToolMode.SELECT && shapes.find(s => s.id === selectedShapeId)?.type === ToolMode.BUBBLE);

  // Render controls for the Top Bar
  const renderTopBarControls = () => {
    // 1. Background Settings Mode
    if (toolMode === ToolMode.BACKGROUND) {
        return (
            <>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, true)} 
                />
                
                {/* Upload */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">底圖來源</span>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white border border-slate-300 hover:bg-slate-50 rounded px-2 py-1 text-sm flex items-center gap-1.5 transition-colors cursor-pointer text-slate-900"
                    >
                        <Upload size={14} className="text-slate-600"/>
                        <span className="font-medium">上傳圖片</span>
                    </button>
                </div>

                {/* Visibility */}
                <div className="flex flex-col gap-0.5 border-l pl-3 border-slate-200 ml-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">顯示設定</span>
                    <button 
                        onClick={() => setShowBackground(!showBackground)}
                        className={`border rounded px-2 py-1 text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${!showBackground ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-slate-300 text-slate-900'}`}
                    >
                        {showBackground ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span className="font-medium">{showBackground ? '顯示中' : '已隱藏'}</span>
                    </button>
                </div>

                {/* Background Type Dropdown */}
                <div className="flex flex-col gap-0.5 border-l pl-3 border-slate-200 ml-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">背景材質 (環境)</span>
                    <select 
                        value={backgroundType}
                        onChange={(e) => setBackgroundType(e.target.value as BackgroundType)}
                        className={`${INPUT_STYLE} min-w-[120px]`}
                    >
                        {Object.entries(BACKGROUND_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>

                 {/* Scale Calibration Button (Moved from Sidebar) */}
                 <div className="flex flex-col gap-0.5 border-l pl-3 border-slate-200 ml-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">輔助工具</span>
                    <button 
                        onClick={() => setToolMode(ToolMode.SCALE)}
                        className="bg-white border border-slate-300 hover:bg-slate-50 rounded px-2 py-1 text-sm flex items-center gap-1.5 transition-colors cursor-pointer text-slate-900"
                    >
                        <Ruler size={14} className="text-slate-600"/>
                        <span className="font-medium">比例校正</span>
                    </button>
                </div>
            </>
        );
    }
    
    // 2. Scale Mode (Now appears when triggered from Background settings)
    if (toolMode === ToolMode.SCALE) {
        return (
            <div className="flex items-center gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                        <Ruler size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-900">畫出一條線並輸入長度：</span>
                    <input 
                        type="number" 
                        value={calibrationLength}
                        onChange={(e) => setCalibrationLength(parseFloat(e.target.value) || 0)}
                        className={`${INPUT_STYLE} w-24 font-bold text-center`}
                    />
                    <span className="text-sm font-bold text-slate-900">公尺 (m)</span>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2" />

                <button 
                    onClick={() => setToolMode(ToolMode.BACKGROUND)}
                    className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded cursor-pointer"
                >
                    <X size={14} />
                    取消 / 完成
                </button>
            </div>
        );
    }

    // 3. Path / Selection (Path)
    if (showPathControls) {
        return (
            <>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">路徑寬度 (m)</span>
                    <div className="flex items-center gap-2">
                        <input 
                            type="range" 
                            min="0.5" 
                            max="10" 
                            step="0.5" 
                            value={pathWidth}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setPathWidth(val);
                                updateSelectedShape({ pathWidth: val });
                            }}
                            className="w-24 accent-blue-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold font-mono w-8 text-right text-slate-900">{pathWidth}m</span>
                    </div>
                </div>

                <div className="flex flex-col gap-0.5 border-l pl-3 border-slate-200 ml-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">鋪面材質</span>
                    <select 
                        value={currentPathMaterial}
                        onChange={(e) => {
                            const val = e.target.value as PathMaterial;
                            setCurrentPathMaterial(val);
                            // Update both material AND color based on the fixed palette
                            updateSelectedShape({ 
                                pathMaterial: val, 
                                color: PATH_MATERIAL_COLORS[val] 
                            });
                        }}
                        className={`${INPUT_STYLE} min-w-[160px]`}
                    >
                        {Object.entries(PATH_MATERIAL_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>
                
                {/* Arrows, Line Style, Label Visibility */}
                 <div className="flex flex-col gap-0.5 border-l pl-3 border-slate-200 ml-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">動線箭頭 / 線條樣式</span>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => {
                                setArrowStart(!arrowStart);
                                updateSelectedShape({ arrowStart: !arrowStart });
                            }}
                            className={`p-1 rounded border transition-colors ${arrowStart ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}
                            title="起點箭頭"
                        >
                            <MoveLeft size={16} />
                        </button>
                        <button 
                            onClick={() => {
                                setArrowEnd(!arrowEnd);
                                updateSelectedShape({ arrowEnd: !arrowEnd });
                            }}
                            className={`p-1 rounded border transition-colors ${arrowEnd ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}
                            title="終點箭頭"
                        >
                            <MoveRight size={16} />
                        </button>

                        <button 
                            onClick={() => {
                                const newType = arrowType === 'FILLED' ? 'LINEAR' : 'FILLED';
                                setArrowType(newType);
                                updateSelectedShape({ arrowType: newType });
                            }}
                            className={`p-1 rounded border transition-colors bg-white border-slate-200 text-slate-600 hover:bg-slate-50`}
                            title={arrowType === 'FILLED' ? "切換為線性箭頭" : "切換為實心箭頭"}
                        >
                            {arrowType === 'FILLED' ? <Triangle size={16} fill="currentColor" /> : <ChevronRight size={16} />}
                        </button>
                        
                        <div className="h-4 w-px bg-slate-200 mx-1"/>

                        <button 
                            onClick={() => {
                                const newStyle = lineStyle === 'SOLID' ? 'DASHED' : 'SOLID';
                                setLineStyle(newStyle);
                                updateSelectedShape({ lineStyle: newStyle });
                            }}
                            className={`p-1 rounded border transition-colors ${lineStyle === 'DASHED' ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}
                            title={lineStyle === 'SOLID' ? "切換為虛線" : "切換為實線"}
                        >
                            {lineStyle === 'SOLID' ? <Minus size={16} /> : <MoreHorizontal size={16} />}
                        </button>

                        <div className="h-4 w-px bg-slate-200 mx-1"/>

                        <button 
                            onClick={() => {
                                setShowLabel(!showLabel);
                                updateSelectedShape({ showLabel: !showLabel });
                            }}
                            className={`p-1 rounded border transition-colors ${showLabel ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}
                            title="顯示文字"
                        >
                            <Type size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-0.5 border-l pl-3 border-slate-200 ml-1">
                     <span className="text-[10px] text-slate-500 font-bold uppercase">標籤名稱</span>
                     <input 
                        type="text" 
                        value={labelInput}
                        onChange={(e) => {
                            setLabelInput(e.target.value);
                            updateSelectedShape({ label: e.target.value });
                        }}
                        placeholder="例如: 主步道"
                        className={`${INPUT_STYLE} w-32`}
                     />
                </div>
            </>
        );
    }

    // 4. Boundary / Selection (Boundary)
    if (showBoundaryControls) {
        return (
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase">基地地坪材質</span>
                <select 
                    value={currentTerrain}
                    onChange={(e) => {
                        const val = e.target.value as TerrainMaterial;
                        setCurrentTerrain(val);
                        updateSelectedShape({ terrainMaterial: val });
                    }}
                    className={`${INPUT_STYLE} min-w-[160px]`}
                >
                    {Object.entries(TERRAIN_MATERIAL_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
            </div>
        );
    }
    
    // 5. Bubble
    if (showBubbleControls) {
        return (
            <div className="flex flex-col gap-0.5">
                 <span className="text-[10px] text-slate-500 font-bold uppercase">空間機能 / 植栽分區</span>
                 <input 
                    type="text" 
                    value={labelInput}
                    onChange={(e) => {
                        setLabelInput(e.target.value);
                        updateSelectedShape({ label: e.target.value });
                    }}
                    placeholder="例如: 草坪區, 休憩區"
                    className={`${INPUT_STYLE} w-48`}
                 />
            </div>
        );
    }
    
    // Default: Selection mode prompt
    if (toolMode === ToolMode.SELECT && !selectedShapeId) {
        return <span className="text-sm text-slate-400 italic font-medium">點擊畫布上的物件進行編輯...</span>;
    }

    return null;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-slate-900 bg-slate-50 font-sans">
      
      {/* Left Sidebar: Tools */}
      <aside className="w-24 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-3 z-20 shadow-sm shrink-0 overflow-y-auto">
        <div className="mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Map className="text-white" size={24} />
            </div>
        </div>

        {renderToolButton(ToolMode.SELECT, "選取", <MousePointer2 size={20} />)}
        {renderToolButton(ToolMode.BACKGROUND, "底圖設定", <ImageIcon size={20} />)}
        
        {/* Removed dedicated SCALE button from sidebar */}
        
        <div className="w-16 h-px bg-slate-200 my-1" />
        
        {renderToolButton(ToolMode.BOUNDARY, "基地範圍", <Layout size={20} />)}
        {renderToolButton(ToolMode.PATH, "動線/鋪面", <Pencil size={20} />)}
        {renderToolButton(ToolMode.BUBBLE, "空間泡泡", <Activity size={20} />)}

        <div className="mt-auto flex flex-col gap-3 w-full px-2">
            <div className="w-full h-px bg-slate-200" />
            
            <button 
                onClick={undoLastShape}
                className={`${BUTTON_CLASS} ${INACTIVE_BTN} w-full`}
                title="復原上一步"
            >
                <Undo size={18} />
                <span>復原</span>
            </button>
            
            {selectedShapeId && (
                <button 
                    onClick={handleDeleteShape}
                    className={`${BUTTON_CLASS} bg-red-50 text-red-600 border-red-200 hover:bg-red-100 w-full`}
                    title="刪除選取物件"
                >
                    <Trash2 size={18} />
                    <span>刪除</span>
                </button>
            )}

            <button 
                onClick={handleReset}
                className={`${BUTTON_CLASS} bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 w-full`}
                title="全部重置"
            >
                <RotateCcw size={18} />
                <span>重置</span>
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative">
        
        {/* Top Bar: Settings */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center gap-6 shadow-sm z-10 shrink-0">
             <div className="flex items-center gap-2 text-slate-400">
                 <Settings size={18} />
                 <span className="text-xs font-bold uppercase tracking-wider">工具設定</span>
             </div>
             <div className="h-8 w-px bg-slate-200" />
             
             {/* Dynamic Controls Render */}
             {renderTopBarControls()}
        </header>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 bg-slate-50">
            <div className="relative shadow-2xl bg-white border border-slate-200">
                <DrawingCanvas
                    backgroundImage={backgroundImage}
                    showBackground={showBackground}
                    toolMode={toolMode}
                    currentSettings={{
                        width: pathWidth,
                        label: labelInput,
                        terrain: currentTerrain,
                        pathMaterial: currentPathMaterial,
                        arrowStart: arrowStart,
                        arrowEnd: arrowEnd,
                        arrowType: arrowType,
                        lineStyle: lineStyle,
                        showLabel: showLabel
                    }}
                    shapes={shapes}
                    onShapesChange={setShapes}
                    width={800}
                    height={600}
                    setCanvasRef={(ref) => canvasRef.current = ref}
                    selectedShapeId={selectedShapeId}
                    onSelectShape={setSelectedShapeId}
                    lockedModes={lockedModes}
                    scale={pixelsPerMeter}
                    onCalibrationFinish={handleCalibrationFinish}
                />
            </div>
        </div>
      </main>

      {/* Right Sidebar: Generation */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col z-20 shadow-xl shrink-0">
          <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <PlayCircle className="text-blue-600" />
                  AI 生成設定
              </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Style Selection */}
              <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">渲染風格</label>
                  <select 
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value as RenderStyle)}
                    className={`${INPUT_STYLE} w-full p-2`}
                  >
                      {Object.entries(STYLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                      ))}
                  </select>
              </div>

              {/* Style Reference Image */}
              <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">風格參考圖 (選填)</label>
                  <input 
                      type="file" 
                      ref={styleInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                  />
                  <div 
                    onClick={() => styleInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors relative overflow-hidden bg-white"
                  >
                      {refStyleImage ? (
                          <img src={refStyleImage} alt="Style Ref" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                          <>
                             <Upload className="text-slate-400 mb-2" size={24} />
                             <span className="text-xs text-slate-500 font-medium">點擊上傳參考圖片</span>
                          </>
                      )}
                  </div>
                  {refStyleImage && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRefStyleImage(null); if(styleInputRef.current) styleInputRef.current.value=""; }}
                        className="text-xs text-red-500 hover:underline font-medium"
                      >
                          移除參考圖
                      </button>
                  )}
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">補充提示詞 (選填)</label>
                  <textarea 
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="例如：現代簡約風格，周圍有櫻花樹..."
                      className={`${INPUT_STYLE} w-full p-2 h-24 resize-none`}
                  />
              </div>

              {/* Error Message */}
              {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100 font-medium">
                      {errorMsg}
                  </div>
              )}

              {/* Generate Button */}
              <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200'}`}
              >
                  {isGenerating ? (
                      <div className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" size={20} />
                          <span>AI 生成中...</span>
                      </div>
                  ) : (
                      <div className="flex items-center justify-center gap-2">
                          <Activity size={20} />
                          <span>開始生成</span>
                      </div>
                  )}
              </button>
          </div>
          
          {/* Result Area (Mini Preview) */}
          {generatedImage && (
             <div className="p-5 border-t border-slate-100 bg-slate-50">
                 <h3 className="text-sm font-bold mb-3 text-slate-700">生成結果</h3>
                 <div className="relative rounded-lg overflow-hidden shadow-sm border border-slate-200 group">
                     <img src={generatedImage} alt="Result" className="w-full h-auto" />
                     <a 
                        href={generatedImage} 
                        download="landscape-plan.png"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                     >
                         <Download className="text-white" size={32} />
                     </a>
                 </div>
                 <p className="text-xs text-center text-slate-400 mt-2 font-medium">點擊圖片下載大圖</p>
             </div>
          )}
      </aside>
    </div>
  );
};

export default App;