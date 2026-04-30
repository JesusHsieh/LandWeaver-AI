
import React from 'react';
import { ViewStyle, GenerationConfig, AspectRatio } from '../types';
import { Loader2, Wand2, RefreshCcw, Eye, MoveVertical, ChevronDown, Monitor } from 'lucide-react';

interface ControlPanelProps {
  config: GenerationConfig;
  onConfigChange: (newConfig: GenerationConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasMarker: boolean;
  angle: number;
  onAngleChange: (angle: number) => void;
  height: number;
  onHeightChange: (height: number) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onConfigChange,
  onGenerate,
  isGenerating,
  hasMarker,
  angle,
  onAngleChange,
  height,
  onHeightChange,
  pitch,
  onPitchChange,
  onReset
}) => {
  
  const styles = Object.values(ViewStyle);
  const ratios: { value: AspectRatio; label: string }[] = [
    { value: "1:1", label: "1:1 (正方形)" },
    { value: "4:3", label: "4:3 (標準橫版)" },
    { value: "3:4", label: "3:4 (標準直版)" },
    { value: "16:9", label: "16:9 (寬螢幕)" },
    { value: "9:16", label: "9:16 (手機滿版)" },
  ];

  return (
    <div className="w-full md:w-80 bg-slate-800 border-l border-slate-700 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
      <div className="p-6 space-y-8">
        
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white mb-2">參數設定</h2>
          <p className="text-slate-400 text-sm">設定相機視角與風格</p>
        </div>

        {/* Camera Control Section */}
        <div className="space-y-6 border-b border-slate-700 pb-6">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Eye className="w-4 h-4" /> 設定視點
            </h3>

            {/* Direction Control */}
            <div className="space-y-3">
            <label className="text-xs font-medium text-slate-400 flex justify-between">
                <span>水平旋轉 (Yaw)</span>
                <span className="text-blue-400 font-mono">{Math.round(angle)}°</span>
            </label>
            <input
                type="range"
                min="0"
                max="359"
                value={angle}
                onChange={(e) => onAngleChange(parseInt(e.target.value))}
                disabled={!hasMarker}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
            />
            </div>

            {/* Height Control */}
            <div className="space-y-3">
                <label className="text-xs font-medium text-slate-400 flex justify-between">
                    <span>視點高度 (Height)</span>
                    <span className="text-blue-400 font-mono">{height} cm</span>
                </label>
                <div className="flex items-center gap-3">
                    <MoveVertical className="w-4 h-4 text-slate-500" />
                    <input
                        type="range"
                        min="50"
                        max="300"
                        step="10"
                        value={height}
                        onChange={(e) => onHeightChange(parseInt(e.target.value))}
                        disabled={!hasMarker}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
                    />
                </div>
            </div>

            {/* Pitch Control */}
            <div className="space-y-3">
                <label className="text-xs font-medium text-slate-400 flex justify-between">
                    <span>垂直角度 (Pitch)</span>
                    <span className="text-blue-400 font-mono">{pitch}°</span>
                </label>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 justify-between px-1">
                    <span>俯角</span>
                    <span>平視</span>
                    <span>仰角</span>
                </div>
                <input
                    type="range"
                    min="-60"
                    max="60"
                    value={pitch}
                    onChange={(e) => onPitchChange(parseInt(e.target.value))}
                    disabled={!hasMarker}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
                />
            </div>

             <p className="text-xs text-slate-500 mt-2">
                {!hasMarker ? "請在平面圖上點擊以設定視點位置" : "調整參數以改變相機位置"}
            </p>
        </div>

        {/* Style & Ratio Selection */}
        <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> 輸出設定
            </h3>

            {/* Style Selection */}
            <div className="space-y-3">
            <label className="text-xs font-medium text-slate-300">渲染風格</label>
            <div className="relative">
                <select
                value={config.style}
                onChange={(e) => onConfigChange({ ...config, style: e.target.value as ViewStyle })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-3 pr-10 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                >
                {styles.map((style) => (
                    <option key={style} value={style} className="bg-slate-800 text-slate-200">
                    {style}
                    </option>
                ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
                </div>
            </div>
            </div>

            {/* Ratio Selection */}
            <div className="space-y-3">
                <label className="text-xs font-medium text-slate-300">輸出比例</label>
                <div className="relative">
                    <select
                    value={config.ratio}
                    onChange={(e) => onConfigChange({ ...config, ratio: e.target.value as AspectRatio })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-3 pr-10 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                    {ratios.map((r) => (
                        <option key={r.value} value={r.value} className="bg-slate-800 text-slate-200">
                        {r.label}
                        </option>
                    ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>

        {/* Text Prompt */}
        <div className="space-y-3 pt-4 border-t border-slate-700">
          <label className="text-sm font-medium text-slate-300">場景說明增強 (選填)</label>
          <textarea
            value={config.prompt}
            onChange={(e) => onConfigChange({ ...config, prompt: e.target.value })}
            placeholder="例如：明亮現代風格木質地板、挑高天花板..."
            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t border-slate-700 pb-10">
          <button
            onClick={onGenerate}
            disabled={!hasMarker || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold shadow-lg transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                渲染中..
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                生成 3D 模擬圖
              </>
            )}
          </button>
          
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-transparent border border-slate-600 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            重新渲染
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
