import React from 'react';
import { Download, X, ArrowLeft } from 'lucide-react';

interface ResultViewerProps {
  generatedImage: string | null;
  onClose: () => void;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ generatedImage, onClose }) => {
  if (!generatedImage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative max-w-6xl w-full flex flex-col items-center">
        
        <div className="absolute top-0 right-0 p-4 z-50 flex gap-2">
            <a 
                href={generatedImage} 
                download="simulated-view.png"
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                title="下載"
            >
                <Download className="w-6 h-6" />
            </a>
            <button 
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                title="關閉"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="bg-slate-800 p-2 rounded-lg shadow-2xl border border-slate-700">
             <img 
                src={generatedImage} 
                alt="Generated 3D View" 
                className="max-h-[85vh] w-auto rounded object-cover"
            />
        </div>
        
        <div className="mt-6 text-center space-y-4">
            <div>
                <h3 className="text-xl font-semibold text-white">生成的 3D 模擬圖</h3>
                <p className="text-slate-400 text-sm">根據您的平面圖配置生成的 AI 模擬視圖。</p>
            </div>

            <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600 shadow-lg"
            >
                <ArrowLeft className="w-4 h-4" />
                返回編輯
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResultViewer;