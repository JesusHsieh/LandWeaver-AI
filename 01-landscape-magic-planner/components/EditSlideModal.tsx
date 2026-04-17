/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Language, getTranslation } from '../lib/i18n';
import { rewriteText } from '../services/geminiService';

export interface SlideData {
    type: 'title' | 'concept' | 'viewpoint' | 'conclusion' | 'additional'; 
    index?: number; // viewpoint index or additional slide index
    slideIndex?: number; // index in the slide array
    content: {
        title?: string;
        description: string;
    };
    fontFamily?: string;
    fontSizeScale?: number;
}

interface EditSlideModalProps {
    isOpen: boolean;
    onClose: () => void;
    slideData: SlideData | null;
    onSave: (updatedData: SlideData) => void;
    language: Language;
}

const fontOptions = [
    { name: 'Roboto (Default)', value: 'Roboto, sans-serif' },
    { name: 'Playfair Display (Serif)', value: '"Playfair Display", serif' },
    { name: 'Lato (Clean)', value: 'Lato, sans-serif' },
    { name: 'Caveat (Handwritten)', value: 'Caveat, cursive' },
    { name: 'Permanent Marker (Bold)', value: '"Permanent Marker", cursive' },
];

const EditSlideModal: React.FC<EditSlideModalProps> = ({ isOpen, onClose, slideData, onSave, language }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fontFamily, setFontFamily] = useState('Roboto, sans-serif');
    const [fontSizeScale, setFontSizeScale] = useState(1);
    const [isRewriting, setIsRewriting] = useState(false);
    const [rewriteStyle, setRewriteStyle] = useState('Professional');

    useEffect(() => {
        if (slideData) {
            setTitle(slideData.content.title || '');
            setDescription(slideData.content.description);
            setFontFamily(slideData.fontFamily || 'Roboto, sans-serif');
            setFontSizeScale(slideData.fontSizeScale || 1);
        }
    }, [slideData]);

    if (!isOpen || !slideData) return null;

    const handleSave = () => {
        onSave({
            ...slideData,
            content: {
                ...slideData.content,
                title: title || undefined,
                description: description,
            },
            fontFamily,
            fontSizeScale
        });
        onClose();
    };
    
    const handleRewrite = async () => {
        if (!description) return;
        setIsRewriting(true);
        try {
            const rewritten = await rewriteText(description, rewriteStyle, language);
            setDescription(rewritten);
        } catch (error) {
            console.error("Rewrite failed", error);
        } finally {
            setIsRewriting(false);
        }
    };
    
    const getLabels = () => {
        switch (slideData.type) {
            case 'title':
                return { titleLabel: '', descriptionLabel: getTranslation('title', language) };
            case 'concept':
                return { titleLabel: getTranslation('title', language), descriptionLabel: getTranslation('concept', language) };
            case 'viewpoint':
                return { titleLabel: getTranslation('title', language), descriptionLabel: getTranslation('description', language) };
            case 'conclusion':
                return { titleLabel: getTranslation('title', language), descriptionLabel: getTranslation('conclusion', language) };
            case 'additional':
                return { titleLabel: getTranslation('title', language), descriptionLabel: getTranslation('description', language) };
            default:
                return { titleLabel: 'Title', descriptionLabel: 'Content' };
        }
    };

    const { titleLabel, descriptionLabel } = getLabels();
    const hasTitle = slideData.type === 'viewpoint' || slideData.type === 'conclusion' || slideData.type === 'additional';

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4 text-slate-800">{getTranslation('editSlideTitle', language)}</h2>
                
                <div className="space-y-4">
                    {/* Font Settings */}
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mb-4">
                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            {getTranslation('fontSettings', language)}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">{getTranslation('fontFamily', language)}</label>
                                <select 
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md bg-white p-2"
                                >
                                    {fontOptions.map(font => (
                                        <option key={font.value} value={font.value}>{font.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">{getTranslation('fontSize', language)}</label>
                                <select 
                                    value={fontSizeScale}
                                    onChange={(e) => setFontSizeScale(parseFloat(e.target.value))}
                                    className="w-full text-sm border-gray-300 rounded-md bg-white p-2"
                                >
                                    <option value={0.8}>{getTranslation('sizeSmall', language)}</option>
                                    <option value={1}>{getTranslation('sizeMedium', language)}</option>
                                    <option value={1.3}>{getTranslation('sizeLarge', language)}</option>
                                    <option value={1.6}>{getTranslation('sizeXLarge', language)}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {hasTitle && (
                         <div>
                            <label htmlFor="slide-title" className="block text-sm font-medium text-slate-700">
                                {titleLabel}
                            </label>
                            <input
                                id="slide-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-slate-900"
                            />
                        </div>
                    )}
                   
                    <div>
                        <label htmlFor="slide-description" className="block text-sm font-medium text-slate-700">
                           {descriptionLabel}
                        </label>
                        <textarea
                            id="slide-description"
                            rows={slideData.type === 'concept' ? 6 : 4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-slate-900"
                        />
                    </div>
                    
                    {/* AI Rewrite Section */}
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                        <label className="block text-xs font-semibold text-indigo-800 mb-2 uppercase tracking-wide">
                            {getTranslation('aiRewriteLabel', language)}
                        </label>
                        <div className="flex flex-col gap-2">
                             <select
                                value={rewriteStyle}
                                onChange={(e) => setRewriteStyle(e.target.value)}
                                className="block w-full px-3 py-2 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                disabled={isRewriting}
                            >
                                <option value="Professional">{getTranslation('styleProfessional', language)}</option>
                                <option value="Creative">{getTranslation('styleStorytelling', language)}</option>
                                <option value="Academic">{getTranslation('styleAcademic', language)}</option>
                                <option value="Minimalist">{getTranslation('styleMinimalist', language)}</option>
                                <option value="Chinese Poetry">{getTranslation('stylePoetic', language)}</option>
                                <option value="Modern Literature">{getTranslation('styleModernLit', language)}</option>
                                <option value="Zen Philosophy">{getTranslation('styleZen', language)}</option>
                                <option value="Journalistic">{getTranslation('styleJournalistic', language)}</option>
                                <option value="Witty">{getTranslation('styleWitty', language)}</option>
                                <option value="Luxurious">{getTranslation('styleLuxurious', language)}</option>
                                <option value="Friendly">{getTranslation('styleFriendly', language)}</option>
                            </select>
                            <button
                                onClick={handleRewrite}
                                disabled={isRewriting || !description}
                                className="w-full px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 whitespace-nowrap"
                            >
                                {isRewriting ? getTranslation('rewriting', language) : getTranslation('rewriteButton', language)}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        {getTranslation('cancel', language)}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        {getTranslation('saveChanges', language)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditSlideModal;