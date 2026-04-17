/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { GeneratedScene } from './Step3SceneGeneration';
import { editInteriorScene, imageSrcToBase64 } from '../services/geminiService';
import { Language, getTranslation } from '../lib/i18n';
import JSZip from 'jszip';
import DrawingCanvas, { DrawingCanvasRef } from './DrawingCanvas';

interface Step4SceneEditingProps {
    scenes: GeneratedScene[];
    onScenesChange: React.Dispatch<React.SetStateAction<GeneratedScene[]>>;
    language: Language;
}

const Step4SceneEditing: React.FC<Step4SceneEditingProps> = ({ scenes, onScenesChange, language }) => {
    const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
    const [prompt, setPrompt] = useState('');
    const [mode, setMode] = useState<'day' | 'night'>('day');
    const [temperature, setTemperature] = useState(6500);
    const [objectImage, setObjectImage] = useState<string | null>(null);
    const canvasRef = useRef<DrawingCanvasRef>(null);
    const objectInputRef = useRef<HTMLInputElement>(null);

    // Update local state when selected scene changes
    useEffect(() => {
        const scene = scenes[selectedSceneIndex];
        if (scene) {
            setMode(scene.mode);
            setTemperature(scene.temperature);
            setPrompt('');
            setObjectImage(null);
            // We can't easily clear canvas ref here because it might be null or not ready,
            // but the DrawingCanvas component handles image changes by clearing itself.
        }
    }, [selectedSceneIndex, scenes]);

    const handleObjectUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setObjectImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleApplyEdit = async () => {
        const currentScene = scenes[selectedSceneIndex];
        if (!currentScene) return;
        
        const maskBase64 = canvasRef.current?.getMaskBase64();
        const viewIndex = currentScene.viewIndex;

        onScenesChange(prev => prev.map(s => s.viewIndex === viewIndex ? { ...s, isLoading: true } : s));
        
        try {
            const baseImageSrc = currentScene.url;
            const objectImageBase64 = objectImage ? await imageSrcToBase64(objectImage) : undefined;
            
            const newUrl = await editInteriorScene(baseImageSrc, prompt, mode, temperature, maskBase64, objectImageBase64);

            onScenesChange(prev => prev.map(s => {
                if (s.viewIndex === viewIndex) {
                    const newScene = { ...s, url: newUrl, mode, temperature, isLoading: false };
                    if (s.url === s.originalUrl) {
                        newScene.originalUrl = s.url;
                    }
                    return newScene;
                }
                return s;
            }));
            setPrompt(''); // Clear prompt after success
            setObjectImage(null); // Clear object after success
        } catch (error) {
            console.error(`Error editing scene ${viewIndex}:`, error);
            alert(`Failed to edit scene. ${error instanceof Error ? error.message : ''}`);
            onScenesChange(prev => prev.map(s => s.viewIndex === viewIndex ? { ...s, isLoading: false } : s));
        }
    };
    
    const handleRestore = () => {
        const currentScene = scenes[selectedSceneIndex];
        if (!currentScene) return;

        onScenesChange(prev => prev.map(s => {
            if (s.viewIndex === currentScene.viewIndex) {
                return { ...s, url: s.originalUrl };
            }
            return s;
        }));
    };

    const downloadAllScenesAsZip = async () => {
        const completedScenes = scenes.filter(scene => scene.url && !scene.isLoading);
        if (completedScenes.length === 0) return;

        const zip = new JSZip();
        const promises: Promise<void>[] = [];

        completedScenes.forEach(scene => {
            if (scene.url) {
                promises.push(
                    fetch(scene.url)
                        .then(res => res.blob())
                        .then(blob => {
                            const fileName = `edited_landscape_scene_${scene.viewIndex}.png`;
                            zip.file(fileName, blob);
                        })
                        .catch(err => console.error('Error adding image to zip:', err))
                );
            }
        });

        try {
            await Promise.all(promises);
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `edited_landscape_scenes_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error creating zip:', error);
            alert(getTranslation('downloadFailed', language));
        }
    };

    const currentScene = scenes[selectedSceneIndex];
    if (!currentScene && scenes.length > 0) {
        setSelectedSceneIndex(0);
        return null; 
    }

    if (scenes.length === 0) {
        return <div className="text-center p-8">{getTranslation('noScenesToEdit', language)}</div>;
    }

    const isRestorable = currentScene?.url !== currentScene?.originalUrl;

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col h-[85vh]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {getTranslation('step4Title', language)}
                    </h2>
                    <p className="text-slate-500">
                        {getTranslation('step4Description', language)}
                    </p>
                </div>
                <button
                    onClick={downloadAllScenesAsZip}
                    disabled={scenes.some(s => !s.url)}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                    {getTranslation('downloadEditedScenes', language)}
                </button>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden border border-slate-200 rounded-xl bg-white shadow-lg">
                {/* Left Sidebar: Scene List */}
                <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-200 bg-slate-50">
                    <div className="p-3 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 text-center">
                        {getTranslation('stepGeneration', language)}
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {scenes.map((scene, index) => (
                            <button
                                key={scene.viewIndex}
                                onClick={() => setSelectedSceneIndex(index)}
                                className={`w-full p-2 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${selectedSceneIndex === index ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-500 shadow-sm' : 'border-white bg-white hover:border-indigo-200 hover:bg-slate-50'}`}
                            >
                                <img src={scene.url} alt={`Scene ${scene.viewIndex}`} className="w-12 h-12 object-cover rounded bg-slate-200" />
                                <div className="flex-1 min-w-0">
                                    <span className="block font-semibold text-slate-800 text-sm truncate">{getTranslation('viewpoint', language)} {scene.viewIndex}</span>
                                    <span className="text-xs text-slate-500 truncate block">{scene.style}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Center: Canvas Area */}
                <div className="flex-1 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full p-4 flex items-center justify-center">
                         {currentScene ? (
                            <div className="relative w-full h-full flex items-center justify-center shadow-inner">
                                <DrawingCanvas
                                    ref={canvasRef}
                                    imageUrl={currentScene.url}
                                    className="max-w-full max-h-full object-contain"
                                />
                                {currentScene.isLoading && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10 backdrop-blur-sm">
                                        <div className="loader border-4 border-slate-400 border-t-white rounded-full w-12 h-12 animate-spin mb-3"></div>
                                        <p className="font-semibold text-lg">{getTranslation('updatingScene', language)}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-slate-400">{getTranslation('selectSceneToEdit', language)}</div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar: Editor Controls */}
                <div className="w-80 flex-shrink-0 flex flex-col border-l border-slate-200 bg-white">
                    <div className="p-3 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 text-center">
                         {getTranslation('step4SceneEditing', language)}
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 space-y-6">
                        {/* Prompt Input */}
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-2">{getTranslation('editPromptPlaceholder', language)}</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={getTranslation('editPromptPlaceholder', language)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900 text-sm resize-none"
                                disabled={currentScene?.isLoading}
                                rows={4}
                            />
                        </div>

                        {/* Object Upload */}
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-2">{getTranslation('addObject', language)}</label>
                            <input
                                type="file"
                                accept="image/*"
                                ref={objectInputRef}
                                onChange={handleObjectUpload}
                                className="hidden"
                            />
                            {objectImage ? (
                                <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md border border-slate-200">
                                    <img src={objectImage} alt="Uploaded object" className="w-12 h-12 rounded object-cover border border-slate-300"/>
                                    <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-slate-700 truncate">{getTranslation('addObject', language)}</p>
                                    </div>
                                    <button 
                                        onClick={() => setObjectImage(null)}
                                        className="p-1 text-slate-500 hover:text-red-600"
                                        aria-label={getTranslation('clearObject', language)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => objectInputRef.current?.click()}
                                    className="w-full px-3 py-3 border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 font-medium rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors text-sm"
                                    disabled={currentScene?.isLoading}
                                >
                                    + {getTranslation('addObject', language)}
                                </button>
                            )}
                        </div>

                        <div className="h-px bg-slate-200"></div>

                        {/* Lighting Controls */}
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-2">{getTranslation('day', language)} / {getTranslation('night', language)}</label>
                            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                                <button
                                    onClick={() => setMode('day')}
                                    className={`px-3 py-2 rounded-md text-sm font-semibold transition-all flex-1 ${mode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    disabled={currentScene?.isLoading}
                                >
                                    {getTranslation('day', language)}
                                </button>
                                <button
                                    onClick={() => setMode('night')}
                                        className={`px-3 py-2 rounded-md text-sm font-semibold transition-all flex-1 ${mode === 'night' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        disabled={currentScene?.isLoading}
                                >
                                    {getTranslation('night', language)}
                                </button>
                            </div>
                        </div>

                            <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-bold text-slate-800">{getTranslation('colorTemperature', language)}</label>
                                <span className="text-sm font-semibold text-indigo-600">{temperature}K</span>
                            </div>
                            <input
                                type="range"
                                min="2700"
                                max="7500"
                                step="100"
                                value={temperature}
                                onChange={(e) => setTemperature(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                disabled={currentScene?.isLoading}
                            />
                        </div>

                        <div className="h-px bg-slate-200"></div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2">
                            <button
                                onClick={handleApplyEdit}
                                disabled={currentScene?.isLoading}
                                className="w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md"
                            >
                                {getTranslation('applyEdit', language)}
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => canvasRef.current?.clearCanvas()}
                                    disabled={currentScene?.isLoading}
                                    className="px-3 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 text-sm"
                                >
                                    {getTranslation('clearMask', language)}
                                </button>
                                <button
                                    onClick={handleRestore}
                                    disabled={!isRestorable || currentScene?.isLoading}
                                    className="px-3 py-2 bg-slate-500 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 text-sm"
                                >
                                    {getTranslation('restoreOriginal', language)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step4SceneEditing;