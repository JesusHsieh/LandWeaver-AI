
import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Layout, Loader2, Download, AlertCircle, RotateCcw } from 'lucide-react';
import SpatialCanvas from './components/SpatialCanvas';
import { CameraState, SceneObject, GenerationRequest, ObjectType } from './types';
import { generateSynthesizedImage } from './services/geminiService';

const App: React.FC = () => {
  // Application State
  const [resetKey, setResetKey] = useState(0); // Used to force-remount components on reset
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [contextDescription, setContextDescription] = useState<string>('');
  const [atmosphereDescription, setAtmosphereDescription] = useState<string>('');
  const [objectPrompt, setObjectPrompt] = useState<string>(''); // New State
  
  // Spatial State
  const [camera, setCamera] = useState<CameraState>({ x: 50, y: 90, rotation: 0 });
  const [objects, setObjects] = useState<SceneObject[]>([]);
  
  // Generation State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    // Reset all state variables
    setReferenceImage(null);
    setContextDescription('');
    setAtmosphereDescription('');
    setObjectPrompt('');
    setCamera({ x: 50, y: 90, rotation: 0 });
    setObjects([]);
    setGeneratedImage(null);
    setError(null);
    
    // Force remount of children components (clears their internal state)
    setResetKey(prev => prev + 1);

    // Clear the file input value so onChange triggers again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!referenceImage) {
      setError("請先上傳參考照片作為合成底圖。");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    const request: GenerationRequest = {
      referenceImage,
      contextDescription,
      atmosphereDescription,
      objectPrompt, // Pass new field
      camera,
      objects
    };

    try {
      const result = await generateSynthesizedImage(request);
      setGeneratedImage(result);
    } catch (err) {
      setError("生成圖片失敗，請檢查 API Key 或稍後再試。");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white" size={18} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              AI 空間合成大師
            </h1>
          </div>
          <div className="text-xs text-gray-500">v1.4.0 • Photo Synthesis</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Inputs */}
        {/* Added h-full and flex-col to ensure proper vertical spacing */}
        <div className="lg:col-span-4 flex flex-col gap-6" style={{ minHeight: 'calc(100vh - 120px)' }}>
          
          {/* 1. Reference Image */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-4">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">1</span>
              上傳底圖 (基礎照片)
            </h2>
            <div className="relative group">
              <input 
                key={resetKey} // Re-create input on reset
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`
                border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors
                ${referenceImage ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-gray-700 hover:border-blue-500 hover:bg-gray-800'}
              `}>
                {referenceImage ? (
                  <div className="relative w-full aspect-video rounded overflow-hidden">
                    <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium">點擊更換照片</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gray-500 mb-2" size={24} />
                    <p className="text-sm text-gray-400 text-center">點擊上傳原始照片</p>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">此照片將作為合成的基礎，AI 僅會在此照片上增加物件，不會改變原始場景結構。</p>
          </section>

          {/* 2. Context Info */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-4">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">2</span>
              照片資訊補充說明
            </h2>
            <textarea
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-20"
              placeholder="請描述場景性質（例如：現代風格的庭院、商業辦公室入口）..."
              value={contextDescription}
              onChange={(e) => setContextDescription(e.target.value)}
            />
          </section>

          {/* 3. Object Prompt (New) */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-4">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">3</span>
              物件外觀/風格描述
            </h2>
            <textarea
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-20"
              placeholder="針對要合成的物件補充細節。例如：人物都穿著紅色制服、樹木要有秋天的黃葉..."
              value={objectPrompt}
              onChange={(e) => setObjectPrompt(e.target.value)}
            />
          </section>

          {/* 4. Atmosphere */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-4">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">4</span>
              照片氛圍與光影
            </h2>
            <textarea
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-20"
              placeholder="例如：保持原有光影、增加戲劇性的夕陽光輝..."
              value={atmosphereDescription}
              onChange={(e) => setAtmosphereDescription(e.target.value)}
            />
          </section>

          <div className="flex-grow"></div>

          {/* Reset Button (Moved to bottom) */}
          <button 
            type="button"
            onClick={handleReset}
            className="w-full py-4 px-4 bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-900/50 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-auto"
          >
            <RotateCcw size={16} /> 重新開始 (RESET)
          </button>

        </div>

        {/* Center Column: Spatial Planner (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm h-full flex flex-col">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-4">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">5</span>
              平面空間配置 (合成規劃)
            </h2>
            <div className="flex-1">
               <SpatialCanvas 
                 key={resetKey} // Force reset on key change
                 objects={objects} 
                 setObjects={setObjects} 
                 camera={camera} 
                 setCamera={setCamera} 
               />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`
                mt-6 w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all
                ${isGenerating 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white transform active:scale-[0.99]'}
              `}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  合成處理中...
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  生成合成照片
                </>
              )}
            </button>
          </section>
        </div>

        {/* Right Column: Result (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm h-full min-h-[400px] flex flex-col">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-4">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">6</span>
              生成結果
            </h2>
            
            <div className="flex-1 bg-black rounded-lg border-2 border-gray-800 flex items-center justify-center relative overflow-hidden group">
              {generatedImage ? (
                <>
                  <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                  <a 
                    href={generatedImage} 
                    download="spatial-synth-result.png"
                    className="absolute bottom-4 right-4 bg-white text-black p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
                  >
                    <Download size={20} />
                  </a>
                </>
              ) : isGenerating ? (
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-800 border-t-blue-500 animate-spin"></div>
                  </div>
                  <p className="text-sm animate-pulse">正在依照底圖與配置合成中...</p>
                </div>
              ) : (
                <div className="text-center p-6">
                  <ImageIcon className="mx-auto text-gray-700 mb-3" size={48} />
                  <p className="text-sm text-gray-500">合成後的照片將會顯示在這裡。</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-xs flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </section>
        </div>

      </main>
    </div>
  );
};

export default App;
