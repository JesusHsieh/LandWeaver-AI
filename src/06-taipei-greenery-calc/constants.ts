// ── Types ──────────────────────────────────────────────────────────────────
export type BuildingClass = '1' | '2' | '3' | '4' | '5';

// ── 第4條 各類建築基地標準 ─────────────────────────────────────────────────
export const STANDARDS: Record<BuildingClass, { name: string; cover: number; volume: number; carbon: number }> = {
  '1': { name: '第一類', cover: 90, volume: 2.0, carbon: 0.99 },
  '2': { name: '第二類', cover: 80, volume: 1.9, carbon: 0.83 },
  '3': { name: '第三類', cover: 70, volume: 1.8, carbon: 0.83 },
  '4': { name: '第四類', cover: 60, volume: 1.6, carbon: 0.66 },
  '5': { name: '第五類', cover: 50, volume: 1.4, carbon: 0.66 },
};

/** 第10條第1項第1款 喬木綠覆面積（m²/株） */
export const TREE_AREA = { large: 25, medium: 16, small: 9, palm: 9 } as const;

/** 第5條第3項 降溫係數 */
export const COOL = { highShade: 3.0, lowShade: 2.0, shrub: 1.2, other: 1.0 } as const;

/** 植物固碳當量 Gi（kgCO₂e/(m²·yr)）— 建築基地綠化設計技術規範 表1 */
export const CARBON = {
  ecoLayer:   2.00,  // 生態複層（大小喬木+灌木+花草密植混種，喬木間距≤3.5m）
  largeBroad: 1.50,  // 闊葉大喬木（成樹高度≥10m，對應高遮蔭喬木）
  smallTree:  1.00,  // 闊葉小喬木、針葉喬木、疏葉喬木（對應低遮蔭喬木）
  palm:       0.66,  // 棕櫚類
  shrub:      0.50,  // 灌木（每㎡栽植2株以上）
  vine:       0.40,  // 多年生蔓藤
  grass:      0.30,  // 草花花圃、野草地、水生植物、草坪
  thinGreen:  0.30,  // 薄層綠化、壁掛式綠化
} as const;
