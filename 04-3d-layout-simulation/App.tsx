
import React, { useState, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import FloorPlanViewer from './components/FloorPlanViewer';
import ResultViewer from './components/ResultViewer';
import { Point, ViewStyle, GenerationConfig } from './types';
import { generateAnnotatedImage } from './utils/canvasUtils';
import { generate3DView } from './services/geminiService';
import { Map, AlertCircle, X } from 'lucide-react';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [marker, setMarker] = useState<Point | null>(null);
  
  // Camera State
  const [angle, setAngle] = useState<number>(0);
  const [height, setHeight] = useState<number>(150); // Default 150cm (Eye level)
  const [pitch, setPitch] = useState<number>(0); // Default 0 (Level)
  
  const [config, setConfig] = useState<GenerationConfig>({
    style: ViewStyle.REALISTIC,
    prompt: '',
    ratio: '4:3'
  });
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setImageSrc(ev.target.result);
          setMarker(null); // Reset marker on new upload
          setGeneratedImage(null);
          setError(null);
          // Reset camera
          setAngle(0);
          setHeight(150);
          setPitch(0);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!imageSrc || !marker) {
      setError("請上傳平面圖並設定視點標記。");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 1. Create the visual prompt (floor plan + marker)
      const annotatedImage = await generateAnnotatedImage(imageSrc, marker, angle);
      
      // 2. Call AI with extended camera parameters
      const result = await generate3DView(
          annotatedImage, 
          config.style, 
          config.prompt,
          height,
          pitch,
          config.ratio
      );
      
      setGeneratedImage(result);
    } catch (err) {
      console.error(err);
      setError("生成視圖失敗，請重試。" + (err instanceof Error ? err.message : ""));
    } finally {
      setIsGenerating(false);
    }
  }, [imageSrc, marker, angle, height, pitch, config]);

  const handleReset = () => {
    setImageSrc(null);
    setMarker(null);
    setAngle(0);
    setHeight(150);
    setPitch(0);
    setGeneratedImage(null);
    setError(null);
    setConfig({
        style: ViewStyle.REALISTIC,
        prompt: '',
        ratio: '4:3'
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="h-16 border-b border-slate-700 bg-slate-800/80 backdrop-blur-md flex items-center px-6 justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Map className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            平面圖 AI 視覺化
          </h1>
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          由 Gemini 2.5 Flash Image 驅動
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <FloorPlanViewer
          imageSrc={imageSrc}
          onImageUpload={handleImageUpload}
          marker={marker}
          angle={angle}
          onMarkerChange={setMarker}
        />
        
        <ControlPanel
          config={config}
          onConfigChange={setConfig}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          hasMarker={!!marker}
          angle={angle}
          onAngleChange={setAngle}
          height={height}
          onHeightChange={setHeight}
          pitch={pitch}
          onPitchChange={setPitch}
          onReset={handleReset}
        />

        {/* Error Toast */}
        {error && (
            <div className="absolute bottom-6 left-6 right-80 max-w-md mx-auto bg-red-900/90 border border-red-700 text-red-100 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto hover:text-white"><X className="w-4 h-4"/></button>
            </div>
        )}
      </div>

      {/* Result Modal */}
      <ResultViewer 
        generatedImage={generatedImage} 
        onClose={() => setGeneratedImage(null)} 
      />
    </div>
  );
};

export default App;
