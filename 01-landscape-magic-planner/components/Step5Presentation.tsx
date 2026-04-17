/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generatePresentationText, PresentationText } from '../services/geminiService';
import { generateSlides, ColorTheme, themes, SlideStyle } from '../lib/presentationUtils';
import { Language, getTranslation } from '../lib/i18n';
import type { GeneratedScene } from './Step3SceneGeneration';
import EditSlideModal, { SlideData } from './EditSlideModal';
import JSZip from 'jszip';
import AnimatedSlideshow from './AnimatedSlideshow';

interface Step5PresentationProps {
    finalPlanImage: string;
    generatedScenes: GeneratedScene[];
    style: string;
    language: Language;
}

const Step5Presentation: React.FC<Step5PresentationProps> = ({ finalPlanImage, generatedScenes, style, language }) => {
    const [presentationText, setPresentationText] = useState<PresentationText | null>(null);
    const [slideImages, setSlideImages] = useState<string[]>([]);
    const [isLoadingText, setIsLoadingText] = useState(true);
    const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<SlideData | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(themes[0]);
    const [showSlideshow, setShowSlideshow] = useState(false);
    
    // User Preferences
    const [targetSlideCount, setTargetSlideCount] = useState<number>(7);
    // Local state for input field to prevent auto-refresh on every keystroke
    const [localSlideCount, setLocalSlideCount] = useState<string>("7");
    
    const [presentationTone, setPresentationTone] = useState<string>('Professional');
    const [slideStyles, setSlideStyles] = useState<{ [key: number]: SlideStyle }>({});

    // Memoize completed scenes
    const completedScenes = useMemo(() => generatedScenes.filter(s => s.url), [generatedScenes]);
    
    // Create combined data structure for slides
    const allSlideData: SlideData[] = useMemo(() => {
        if (!presentationText) return [];
        
        const slides: SlideData[] = [
            { type: 'title' as const, content: { title: style, description: presentationText.presentationTitle } },
            { type: 'concept' as const, content: { title: presentationText.conceptTitle, description: presentationText.mainConcepts.join('\n') } },
            ...completedScenes.map((scene, i) => ({
                type: 'viewpoint' as const,
                index: i,
                content: {
                    title: presentationText.viewpointDetails[i]?.title || `Viewpoint ${i + 1}`,
                    description: presentationText.viewpointDetails[i]?.description || '',
                }
            })),
            ...(presentationText.additionalSlides || []).map((slide, i) => ({
                type: 'additional' as const,
                index: i,
                content: {
                    title: slide.title,
                    description: slide.content,
                }
            })),
            { type: 'conclusion' as const, content: { title: presentationText.conclusionTitle, description: presentationText.conclusion } }
        ];

        // Attach style info if available
        return slides.map((slide, index) => ({
            ...slide,
            slideIndex: index,
            fontFamily: slideStyles[index]?.fontFamily,
            fontSizeScale: slideStyles[index]?.fontSizeScale
        }));
    }, [presentationText, style, completedScenes, slideStyles]);


    // Generate or regenerate all slides
    const regenerateAllSlides = useCallback(async () => {
        if (!presentationText) return;
        setIsGeneratingSlides(true);
        try {
            const images = await generateSlides(presentationText, completedScenes, finalPlanImage, style, language, selectedTheme, slideStyles);
            setSlideImages(images);
        } catch (err) {
            console.error("Error generating slides:", err);
            setError(getTranslation('generatingSlides', language));
        } finally {
            setIsGeneratingSlides(false);
        }
    }, [presentationText, completedScenes, finalPlanImage, style, language, selectedTheme, slideStyles]);


    // Fetch presentation text when content params change
    useEffect(() => {
        const fetchPresentation = async () => {
            setIsLoadingText(true);
            setError(null);
            try {
                const text = await generatePresentationText(
                    finalPlanImage, 
                    completedScenes, 
                    style, 
                    language, 
                    targetSlideCount, 
                    presentationTone
                );
                setPresentationText(text);
                // Reset slide styles when regenerating text content structure
                setSlideStyles({});
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : getTranslation('presentationFailed', language));
            } finally {
                setIsLoadingText(false);
            }
        };
        fetchPresentation();
    }, [finalPlanImage, completedScenes, style, language, targetSlideCount, presentationTone]);

    // Regenerate images when text, theme, or styles change
    useEffect(() => {
        if (presentationText) {
            regenerateAllSlides();
        }
    }, [presentationText, selectedTheme, regenerateAllSlides]);

    const handleEdit = (slideIndex: number) => {
        const data = allSlideData[slideIndex];
        if (data) {
            setEditingSlide(data);
            setIsModalOpen(true);
        }
    };

    const handleSave = async (updatedData: SlideData) => {
        if (!presentationText || updatedData.slideIndex === undefined) return;

        const slideIndex = updatedData.slideIndex;
        const originalSlideData = allSlideData[slideIndex];
        let newText = { ...presentationText };
        let needsRegen = false;

        // Save style changes
        if (updatedData.fontFamily || updatedData.fontSizeScale) {
            setSlideStyles(prev => ({
                ...prev,
                [slideIndex]: {
                    fontFamily: updatedData.fontFamily || 'sans-serif',
                    fontSizeScale: updatedData.fontSizeScale || 1
                }
            }));
            // Style change will trigger useEffect -> regenerateAllSlides
        }

        // Save content changes
        switch(originalSlideData.type) {
            case 'title':
                newText.presentationTitle = updatedData.content.description;
                needsRegen = true;
                break;
            case 'concept':
                newText.conceptTitle = updatedData.content.title || '';
                newText.mainConcepts = updatedData.content.description.split('\n');
                needsRegen = true;
                break;
            case 'viewpoint':
                const viewpointIndex = originalSlideData.index;
                if (viewpointIndex !== undefined) {
                    newText.viewpointDetails[viewpointIndex] = {
                        title: updatedData.content.title || '',
                        description: updatedData.content.description,
                    };
                    needsRegen = true;
                }
                break;
            case 'additional':
                const additionalIndex = originalSlideData.index;
                 if (additionalIndex !== undefined && newText.additionalSlides) {
                    newText.additionalSlides[additionalIndex] = {
                        title: updatedData.content.title || '',
                        content: updatedData.content.description,
                    };
                    needsRegen = true;
                }
                break;
            case 'conclusion':
                 newText.conclusionTitle = updatedData.content.title || '';
                 newText.conclusion = updatedData.content.description;
                 needsRegen = true;
                 break;
        }

        if (needsRegen) {
            setPresentationText(newText);
        }
    };
    
    const handleDownload = async () => {
        if (slideImages.length === 0) return;

        const zip = new JSZip();
        
        const promises = slideImages.map(async (dataUrl, index) => {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            zip.file(`slide_${index + 1}.png`, blob);
        });

        await Promise.all(promises);
        
        const zipBlob = await zip.generateAsync({type: 'blob'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `landscape_presentation_${style.replace(/\s+/g, '_')}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const handleSlideCountBlur = () => {
        const val = parseInt(localSlideCount, 10);
        if (!isNaN(val) && val > 0 && val !== targetSlideCount) {
             setTargetSlideCount(val);
        } else {
             // Reset if invalid or same
             setLocalSlideCount(String(targetSlideCount));
        }
    };

    const handleSlideCountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSlideCountBlur();
            (e.target as HTMLInputElement).blur();
        }
    };

    const renderLoading = (messageKey: 'generatingPresentation' | 'generatingSlides') => (
        <div className="flex flex-col items-center justify-center h-64">
            <div className="loader border-4 border-indigo-200 border-t-indigo-600 rounded-full w-12 h-12 animate-spin mb-4" />
            <p className="font-semibold text-slate-600">{getTranslation(messageKey, language)}</p>
        </div>
    );

    const renderError = () => (
         <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-bold text-red-800">{getTranslation('presentationFailed', language)}</h3>
            <p className="text-red-700 mt-2">{error}</p>
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto space-y-10">
            <div>
                <h2 className="text-3xl font-bold mb-2 text-center text-slate-900">
                    {getTranslation('step5Title', language)}
                </h2>
                <p className="text-center text-slate-500 mb-8 max-w-2xl mx-auto">
                    {getTranslation('step5Description', language)}
                </p>
            </div>

            {/* Step 1: Customize */}
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-6">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">{getTranslation('customizeTheme', language)}</h3>
                    
                    {/* Structure and Tone Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                 {getTranslation('slideCountLabel', language)}
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <input
                                    type="number"
                                    min="3"
                                    max="50"
                                    value={localSlideCount}
                                    onChange={(e) => setLocalSlideCount(e.target.value)}
                                    onBlur={handleSlideCountBlur}
                                    onKeyDown={handleSlideCountKeyDown}
                                    className="block w-full px-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white"
                                    disabled={isLoadingText || isGeneratingSlides}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm bg-white pl-1">
                                        {getTranslation('images', language)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-2">
                                 {getTranslation('presentationToneLabel', language)}
                            </label>
                             <select
                                value={presentationTone}
                                onChange={(e) => setPresentationTone(e.target.value)}
                                className="block w-full px-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white"
                                disabled={isLoadingText || isGeneratingSlides}
                            >
                                <option value="Professional">{getTranslation('toneProfessional', language)}</option>
                                <option value="Creative">{getTranslation('toneCreative', language)}</option>
                                <option value="Academic">{getTranslation('toneAcademic', language)}</option>
                                <option value="Persuasive">{getTranslation('tonePersuasive', language)}</option>
                                <option value="Minimalist">{getTranslation('toneMinimalist', language)}</option>
                                <option value="Storytelling">{getTranslation('toneStorytelling', language)}</option>
                                <option value="Technical">{getTranslation('toneTechnical', language)}</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {themes.map(theme => (
                            <button 
                                key={theme.nameKey}
                                onClick={() => setSelectedTheme(theme)}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 ${selectedTheme.nameKey === theme.nameKey ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-300 hover:border-indigo-400'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                                    <span className="font-semibold" style={{ color: theme.colors.primaryText }}>{getTranslation(theme.nameKey, language)}</span>
                                </div>
                                <div className="flex gap-1 mt-3">
                                    <div className="w-1/4 h-3 rounded" style={{ backgroundColor: theme.colors.primaryText }}></div>
                                    <div className="w-1/4 h-3 rounded" style={{ backgroundColor: theme.colors.secondaryText }}></div>
                                    <div className="w-1/4 h-3 rounded" style={{ backgroundColor: theme.colors.accent }}></div>
                                    <div className="w-1/4 h-3 rounded" style={{ backgroundColor: theme.colors.background }}></div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step 2: Edit */}
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{getTranslation('editContent', language)}</h3>
                <p className="text-slate-600 mb-6">{getTranslation('editContentDescription', language)}</p>

                {isLoadingText && renderLoading('generatingPresentation')}
                {error && !isLoadingText && renderError()}
                {isGeneratingSlides && renderLoading('generatingSlides')}
                
                {!isLoadingText && !error && !isGeneratingSlides && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {slideImages.map((src, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md relative group border border-slate-200">
                                <img src={src} alt={`Slide ${index + 1}`} className="w-full h-auto rounded-t-lg" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEdit(index)}
                                        className="px-4 py-2 bg-white text-slate-800 font-semibold rounded-md hover:bg-slate-200 transition-colors flex items-center gap-2"
                                        aria-label={`${getTranslation('editSlide', language)} for slide ${index + 1}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                        {getTranslation('editSlide', language)}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Step 3: Download */}
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{getTranslation('downloadStep', language)}</h3>
                <p className="text-slate-600 mb-6">{getTranslation('downloadStepDescription', language)}</p>
                <div className="text-center flex flex-wrap justify-center gap-4">
                    <button 
                        onClick={() => setShowSlideshow(true)}
                        disabled={slideImages.length === 0 || isGeneratingSlides}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {getTranslation('viewSlideshow', language)}
                    </button>
                    <button 
                        onClick={handleDownload}
                        disabled={slideImages.length === 0 || isGeneratingSlides}
                        className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {getTranslation('downloadPresentation', language)}
                    </button>
                </div>
            </div>

            <EditSlideModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                slideData={editingSlide}
                onSave={handleSave}
                language={language}
            />

            <AnimatedSlideshow 
                isOpen={showSlideshow}
                slides={slideImages}
                onClose={() => setShowSlideshow(false)}
                language={language}
            />
        </div>
    );
};

export default Step5Presentation;