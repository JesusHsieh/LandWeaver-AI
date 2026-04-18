/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'zh';

type Translations = {
    [key: string]: {
        en: string;
        zh: string;
    };
};

// FIX: Removed the `: Translations` type annotation to allow TypeScript to infer a
// more specific type for the object keys.
const translations = {
    // App.tsx
    appTitle: { en: 'Landscape Architect Wizard', zh: '景觀建築魔法師' },
    appSubtitle: { en: 'Transform Site Plans into Photorealistic Landscapes and Professional Presentations', zh: '從基地平面圖到照片級景觀渲染與專業簡報' },
    previousStep: { en: 'Previous Step', zh: '上一步' },
    nextStep: { en: 'Next Step', zh: '下一步' },
    restart: { en: 'Start Over', zh: '重新開始' },
    
    // Stepper.tsx
    stepUpload: { en: 'Upload', zh: '上傳' },
    stepRendering: { en: 'Site Plan', zh: '基地配置' },
    stepGeneration: { en: 'Scenes', zh: '景觀生成' },
    step4SceneEditing: { en: 'Edit Landscape', zh: '編輯景觀' },
    step5Presentation: { en: 'Presentation', zh: '簡報' },

    // LanguageSelector.tsx
    selectLanguage: { en: 'Select Language', zh: '選擇語言' },
    chinese: { en: 'Traditional Chinese', zh: '繁體中文' },
    english: { en: 'English', zh: '英文' },

    // Step1Upload.tsx
    step1Title: { en: 'Step 1: Upload Your Site Plan', zh: '步驟 1：上傳您的基地平面圖' },
    step1Description: { en: 'Upload a clear image of your site plan or CAD drawing. The AI will analyze the landscape layout.', zh: '上傳清晰的基地平面圖或 CAD 圖。AI 將分析景觀佈局以開始設計流程。' },
    uploadPlaceholder: { en: 'Your site plan image will appear here', zh: '您的基地平面圖將會顯示在這裡' },
    uploadButton: { en: 'Select Site Plan', zh: '選擇基地圖' },
    reuploadButton: { en: 'Select a Different Plan', zh: '選擇其他圖檔' },
    analyzingIndicator: { en: 'Analyzing site plan...', zh: '正在分析基地配置...' },

    // Step2Rendering.tsx
    step2Title: { en: 'Step 2: Generate Landscape Site Plan', zh: '步驟 2：生成戶外景觀建築圖' },
    step2Description: { en: 'The AI will convert your plan into a professional color rendered landscape site plan. It interprets outdoor elements like trees, paving, and water features.', zh: 'AI 將把您的平面圖轉換為專業的彩色景觀配置圖。它會自動判讀樹木、鋪面和水景等戶外元素。' },
    originalPlanReference: { en: 'Original Plan Reference', zh: '原始平面圖參考' },
    pleaseUploadFirst: { en: 'Please upload a plan first', zh: '請先上傳平面圖' },
    aiRenderingArea: { en: 'AI Landscape Rendering', zh: 'AI 景觀渲染區' },
    aiGenerating: { en: 'AI is generating...', zh: 'AI 生成中...' },
    initialRenderingPrompt: { en: 'Click the button below to generate your initial landscape site plan.', zh: '點擊下方按鈕以生成您的初始景觀配置圖。' },
    startRenderingButton: { en: 'Start Landscape Rendering', zh: '開始景觀渲染' },
    createDollhouseView: { en: 'Create Isometric View', zh: '生成等角鳥瞰圖' },
    dollhouseGenerationFailed: { en: 'Failed to generate isometric view. Please try again.', zh: '等角鳥瞰圖生成失敗，請重試。' },
    renderingFailed: { en: 'AI rendering failed. Please try again.', zh: 'AI 渲染失敗，請重試。' },
    confirmRenderingTitle: { en: 'Confirm Rendering', zh: '確認渲染圖' },
    confirmRenderingDescription: { en: 'Does this site plan accurately represent your landscape design?', zh: '此配置圖是否準確呈現您的景觀設計？' },
    acceptRendering: { en: 'Looks Good, Continue', zh: '看起來不錯，繼續' },
    regenerateRendering: { en: 'Regenerate', zh: '重新生成' },
    correctionInputLabel: { en: 'Make Corrections: Describe changes (e.g., "Add a swimming pool", "Change paving to stone").', zh: '進行修正：描述更改（例如：「增加游泳池」、「將鋪面改為石材」）。' },
    correctionInputPlaceholder: { en: 'e.g., "add more trees", "change path to gravel"', zh: '例如：「增加更多樹木」、「將路徑改為碎石」' },
    submitCorrection: { en: 'Submit Correction', zh: '提交修正' },
    autoMaterial: { en: 'Enhance Materials', zh: '優化材質細節' },
    restore: { en: 'Undo', zh: '復原' },
    clearMask: { en: 'Clear Selection', zh: '清除選取' },
    downloadImage: { en: 'Download', zh: '下載' },
    enterCorrectionAlert: { en: 'Please enter a correction instruction.', zh: '請輸入修正指令。' },
    correctionFailed: { en: 'Failed to apply correction. Please try again.', zh: '修正失敗，請重試。' },
    autoMaterialFailed: { en: 'Failed to apply materials. Please try again.', zh: '材質優化失敗，請重試。' },
    suggestImprovement: { en: 'AI Suggestion', zh: 'AI 建議' },
    suggestingImprovement: { en: 'Suggesting...', zh: '建議中...' },
    suggestionFailed: { en: 'Failed to get suggestion. Please try again.', zh: '建議失敗，請重試。' },
    numberOfImagesLabel: { en: 'Number of Images to Generate', zh: '生成圖片數量' },
    image: { en: 'Image', zh: '張' },
    images: { en: 'Images', zh: '張' },
    chooseRenderingTitle: { en: 'Choose Your Preferred Rendering', zh: '選擇您偏好的渲染圖' },
    chooseRenderingDescription: { en: 'Select the image you\'d like to continue with.', zh: '選擇您想繼續使用的圖片。' },
    selectThisImage: { en: 'Select This Image', zh: '選擇此圖' },
    selectionConfirmationTitle: { en: 'Confirm Your Choice', zh: '確認您的選擇' },
    confirmSelectionButton: { en: 'Yes, I want this image', zh: '是，我要這張' },
    backToSelectionButton: { en: 'Back to Selection', zh: '返回選擇' },

    // Step3SceneGeneration.tsx
    step3Title: { en: 'Step 3: Generate Landscape Scenes', zh: '步驟 3：生成戶外景觀場景' },
    step3Description: { en: 'Select viewpoints on the site plan to generate photorealistic outdoor perspectives.', zh: '在配置圖上選擇視角，生成照片級的戶外景觀透視圖。' },
    maxViewpointsAlert: { en: 'You can select a maximum of 8 viewpoints.', zh: '您最多可以選擇 8 個視角。' },
    styleInputPlaceholder: { en: 'Enter a style (e.g., Zen Garden, English Cottage)', zh: '輸入風格（例如：日式枯山水、英式庭園）' },
    suggestStyleButton: { en: 'Suggest Style', zh: '建議風格' },
    suggestingStyle: { en: 'Suggesting...', zh: '建議中...' },
    styleSuggestionFailed: { en: 'Failed to suggest a style. Please enter one manually.', zh: '風格建議失敗，請手動輸入。' },
    generateScenes: { en: 'Generate Scenes', zh: '生成場景' },
    generating: { en: 'Generating...', zh: '生成中...' },
    clearViewpoints: { en: 'Clear All', zh: '清除全部' },
    removeLastViewpoint: { en: 'Remove Last', zh: '移除上個視角' },
    allViewpointsCleared: { en: 'All viewpoints have been cleared.', zh: '已清除所有視角。'},
    downloadAllZip: { en: 'Download All (.zip)', zh: '全部下載 (.zip)' },
    viewpoint: { en: 'Viewpoint', zh: '視角' },
    generationFailed: { en: 'Failed', zh: '生成失敗' },
    retry: { en: 'Retry', zh: '重試' },
    enterStyleAlert: { en: 'Please enter a landscape design style.', zh: '請輸入景觀設計風格。' },
    selectViewpointAlert: { en: 'Please select at least one viewpoint on the site plan.', zh: '請在配置圖上至少選擇一個視角。' },
    generateScenesFirst: { en: 'Please generate scenes before downloading.', zh: '請在下載前先生成場景。' },
    downloadFailed: { en: 'Download failed. Please try again.', zh: '下載失敗，請重試。' },
    selectStyle: { en: 'Or select a style below:', zh: '或選擇下方的風格：' },
    loadingStyleIdeas: { en: 'Loading style ideas...', zh: '正在載入風格靈感...' },

    // Step4SceneEditing.tsx
    step4Title: { en: 'Step 4: Edit Landscape Elements', zh: '步驟 4：編輯戶外景觀物件' },
    step4Description: { en: 'Refine your landscape scenes. Select a scene from the left to edit.', zh: '優化您的景觀場景。從左側選擇一個場景進行編輯。' },
    editPromptPlaceholder: { en: 'e.g., "add a cherry blossom tree", "make the grass greener"', zh: '例如：「增加一棵櫻花樹」、「讓草地更翠綠」' },
    applyEdit: { en: 'Apply Changes', zh: '套用變更' },
    restoreOriginal: { en: 'Restore Original', zh: '還原原始圖' },
    updatingScene: { en: 'Updating scene...', zh: '正在更新場景...' },
    downloadEditedScenes: { en: 'Download All (.zip)', zh: '全部下載 (.zip)' },
    addObject: { en: 'Add Landscape Element', zh: '新增景觀物件' },
    clearObject: { en: 'Clear Element', zh: '清除物件' },
    noScenesToEdit: { en: 'No scenes generated yet.', zh: '尚未生成場景。' },
    selectSceneToEdit: { en: 'Select a scene to edit', zh: '選擇一個場景進行編輯' },

    // Step5Presentation.tsx
    step5Title: { en: 'Step 5: Finalize Presentation', zh: '步驟 5：完成設計簡報' },
    step5Description: { en: 'Customize your landscape design presentation. Choose the number of slides and use AI to refine the text.', zh: '自訂您的景觀設計簡報。選擇投影片數量並使用 AI 優化文字內容。' },
    generatingPresentation: { en: 'Generating presentation...', zh: '正在生成簡報...' },
    presentationFailed: { en: 'Failed to generate presentation. Please try again.', zh: '簡報生成失敗，請重試。' },
    downloadPresentation: { en: 'Download Presentation (.zip)', zh: '下載簡報 (.zip)' },
    viewSlideshow: { en: 'View Slideshow', zh: '檢視簡報' },
    editSlide: { en: 'Edit Text & Font', zh: '編輯文字與字型' },
    customizeTheme: { en: '1. Customize Theme', zh: '1. 選擇版型配色' },
    presentationTheme: { en: 'Presentation Theme', zh: '簡報主題' },
    slideCountLabel: { en: 'Target Slide Count', zh: '目標投影片數量' },
    presentationToneLabel: { en: 'Presentation Content Tone', zh: '簡報排列內容風格 (語氣)' },
    slideCountCompact: { en: 'Compact (7 slides)', zh: '精簡 (7 頁)' },
    slideCountStandard: { en: 'Standard (10 slides)', zh: '標準 (10 頁)' },
    slideCountDetailed: { en: 'Detailed (15 slides)', zh: '詳細 (15 頁)' },
    
    // Presentation Tones
    toneProfessional: { en: 'Professional & Corporate', zh: '專業商務' },
    toneCreative: { en: 'Creative & Artistic', zh: '創意藝術' },
    toneAcademic: { en: 'Academic & Analytical', zh: '學術分析' },
    tonePersuasive: { en: 'Persuasive & Sales', zh: '銷售推廣' },
    toneMinimalist: { en: 'Minimalist & Direct', zh: '簡約直白' },
    toneStorytelling: { en: 'Storytelling & Emotional', zh: '故事敘述與感性' },
    toneTechnical: { en: 'Technical & Engineering', zh: '技術工程' },

    // EditSlideModal.tsx
    editSlideTitle: { en: 'Edit Slide Content', zh: '編輯投影片內容' },
    title: { en: 'Title', zh: '標題' },
    description: { en: 'Description', zh: '描述' },
    concept: { en: 'Concept', zh: '設計理念' },
    conclusion: { en: 'Conclusion', zh: '結語' },
    saveChanges: { en: 'Save Changes', zh: '儲存變更' },
    cancel: { en: 'Cancel', zh: '取消' },
    aiRewriteLabel: { en: 'AI Style Generation', zh: 'AI 風格文字生成' },
    rewriteButton: { en: 'Rewrite', zh: '重寫' },
    rewriting: { en: 'Rewriting...', zh: '重寫中...' },
    
    // AI Styles
    styleProfessional: { en: 'Professional', zh: '專業分析' },
    stylePoetic: { en: 'Poetic / Emotional', zh: '詩意感性' },
    styleStorytelling: { en: 'Storytelling', zh: '故事敘述' },
    styleModernLit: { en: 'Modern Literature', zh: '現代文學' },
    styleZen: { en: 'Zen Philosophy', zh: '禪意哲學' },
    styleJournalistic: { en: 'Journalistic', zh: '新聞報導' },
    styleAcademic: { en: 'Academic', zh: '學術研究' },
    styleMinimalist: { en: 'Minimalist', zh: '極簡主義' },
    styleWitty: { en: 'Witty & Engaging', zh: '幽默風趣' },
    styleLuxurious: { en: 'Luxurious & High-end', zh: '奢華高端' },
    styleFriendly: { en: 'Friendly & Casual', zh: '親切隨和' },

    // Font Controls
    fontSettings: { en: 'Font Settings', zh: '字型設定' },
    fontFamily: { en: 'Font Family', zh: '字體' },
    fontSize: { en: 'Font Size', zh: '大小' },
    sizeSmall: { en: 'Small', zh: '小' },
    sizeMedium: { en: 'Medium', zh: '中' },
    sizeLarge: { en: 'Large', zh: '大' },
    sizeXLarge: { en: 'Extra Large', zh: '特大' },

    // Common
    day: { en: 'Day', zh: '白天' },
    night: { en: 'Night', zh: '夜晚' },
    colorTemperature: { en: 'Color Temperature', zh: '色溫' },
    updatingLighting: { en: 'Updating lighting...', zh: '正在更新燈光...' },
    
    // Theme names
    themeModernBlue: { en: 'Modern Blue', zh: '現代藍' },
    themeEarthTones: { en: 'Earth Tones', zh: '大地色' },
    themeMinimalistGray: { en: 'Minimalist Gray', zh: '簡約灰' },
    themeVibrantCreative: { en: 'Vibrant Creative', zh: '活力創意' },
    themeElegantNoir: { en: 'Elegant Noir', zh: '優雅黑' },
    themeSakuraPink: { en: 'Sakura Pink', zh: '櫻花粉' },
    
    // Presentation Sections
    editContent: { en: '2. Edit Content', zh: '2. 編輯文字' },
    editContentDescription: { en: 'Use AI to rewrite text and customize fonts.', zh: '使用 AI 重寫文字並自訂字型。' },
    downloadStep: { en: '3. Download', zh: '3. 儲存簡報' },
    downloadStepDescription: { en: 'Download all slides as high-resolution images.', zh: '將所有投影片下載為高解析度圖片。' },
    generatingSlides: { en: 'Generating slides...', zh: '正在生成投影片...' },

    // AnimatedSlideshow.tsx
    closeSlideshow: { en: 'Close Slideshow', zh: '關閉簡報' },
};

export function getTranslation(key: keyof typeof translations, language: Language): string {
    return translations[key] ? translations[key][language] : key;
}