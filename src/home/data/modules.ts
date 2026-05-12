export interface ModuleEntry {
  phase: 1 | 2 | 3;
  number: string;
  title: string;
  titleEn: string;
  description: string;
  href: string;
  icon: string;
  accentColor: string;
  tags: string[];
  activeLabel: string;
  variant: 'featured' | 'standard';
  status: 'active' | 'beta' | 'coming-soon';
}

export const MODULES: ModuleEntry[] = [
  {
    phase: 1,
    number: '05',
    title: '景觀地理分析 AI',
    titleEn: 'Landscape Geo Analysis',
    description:
      '整合 3D 地球儀、日照模擬、微氣候分析與景觀決策引擎。點選基地即時獲取真實氣象、空品、高程、都市計畫分區與植栽建議。',
    href: 'src/05-landscape-geo-analysis/index.html',
    icon: 'north_east',
    accentColor: '#BCFD49',
    tags: ['CWA 氣象', 'EPA 空品', 'PVGIS 日照', 'NLSC 地籍'],
    activeLabel: 'MODULE_01 · ACTIVE',
    variant: 'featured',
    status: 'active',
  },
  {
    phase: 2,
    number: '01',
    title: '景觀配置概念圖 AI',
    titleEn: 'Landscape Concept AI',
    description:
      '繪製基地邊界、路徑與機能泡泡，AI 渲染成 20+ 種風格的景觀配置圖。',
    href: 'src/01-landscape-concept-ai/index.html',
    icon: 'architecture',
    accentColor: '#BCFD49',
    tags: [],
    activeLabel: '',
    variant: 'standard',
    status: 'active',
  },
  {
    phase: 2,
    number: '02',
    title: '景觀建築平面魔法師',
    titleEn: 'Landscape Magic Planner',
    description:
      '上傳基地平面圖，AI 渲染景觀配置、生成多角度場景並輸出專業簡報。',
    href: 'src/02-landscape-magic-planner/index.html',
    icon: 'magic_button',
    accentColor: '#00F0FF',
    tags: [],
    activeLabel: '',
    variant: 'standard',
    status: 'active',
  },
  {
    phase: 2,
    number: '03',
    title: '空間與照片 AI 合成',
    titleEn: 'Space Photo Composite',
    description:
      '上傳現場照片，在 2D 平面圖上配置景觀元素，AI 精準合成至真實場景中。',
    href: 'src/03-space-photo-composite/index.html',
    icon: 'photo_camera',
    accentColor: '#BCFD49',
    tags: [],
    activeLabel: '',
    variant: 'standard',
    status: 'active',
  },
  {
    phase: 2,
    number: '04',
    title: '平面配置圖 AI 3D 模擬',
    titleEn: '3D Layout Simulation',
    description:
      '上傳平面圖，標記視點與方向，AI 生成 3D 透視模擬效果圖，支援 20+ 種渲染風格。',
    href: 'src/04-3d-layout-simulation/index.html',
    icon: 'view_in_ar',
    accentColor: '#00F0FF',
    tags: [],
    activeLabel: '',
    variant: 'standard',
    status: 'active',
  },
  {
    phase: 3,
    number: '06',
    title: '綠化法規計算機',
    titleEn: 'Taipei Greenery Calc',
    description:
      '台北市 / 新北市綠化自治法規全覆蓋。輸入基地面積，自動計算第 5、7、8、9、12 條法定綠化量、喬木棵數與查核清單。',
    href: 'src/06-taipei-greenery-calc/index.html',
    icon: 'north_east',
    accentColor: '#2e6767',
    tags: ['台北市綠化自治條例', '新北市綠化自治條例', '法定喬木計算'],
    activeLabel: 'MODULE_06 · ACTIVE',
    variant: 'featured',
    status: 'active',
  },
];

export const PHASES: { id: number; label: string; subtitle: string }[] = [
  { id: 1, label: 'PHASE 01', subtitle: 'SITE ANALYSIS' },
  { id: 2, label: 'PHASE 02', subtitle: 'CONCEPT DEVELOPMENT' },
  { id: 3, label: 'PHASE 03', subtitle: 'REGULATION & COMPLIANCE' },
];
