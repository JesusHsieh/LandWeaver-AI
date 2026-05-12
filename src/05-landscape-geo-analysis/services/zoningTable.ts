// ============================================================
// 08I：容積率 / 建蔽率 查表
// 來源：都市計畫法施行細則及各縣市都市計畫通則典型值
// ============================================================

const ZONE_FAR_BCR: Record<string, { far: number; bcr: number }> = {
  '住宅區':   { far: 160, bcr: 45 },
  '住一':     { far:  80, bcr: 30 },
  '住二':     { far: 160, bcr: 45 },
  '住三':     { far: 225, bcr: 50 },
  '住四':     { far: 300, bcr: 55 },
  '住五':     { far: 360, bcr: 60 },
  '住六':     { far: 400, bcr: 65 },
  '商業區':   { far: 560, bcr: 70 },
  '商一':     { far: 360, bcr: 60 },
  '商二':     { far: 560, bcr: 70 },
  '商三':     { far: 630, bcr: 70 },
  '商四':     { far: 800, bcr: 80 },
  '工業區':   { far: 200, bcr: 55 },
  '工一':     { far: 140, bcr: 50 },
  '工二':     { far: 200, bcr: 55 },
  '工三':     { far: 300, bcr: 60 },
  '農業區':   { far:  10, bcr: 10 },
  '公園用地': { far:  15, bcr: 15 },
  '學校用地': { far: 150, bcr: 50 },
  '文教區':   { far: 120, bcr: 40 },
  '保護區':   { far:   5, bcr:  5 },
  '行政區':   { far: 150, bcr: 50 },
  '綠地':     { far:  10, bcr: 10 },
};

export function getZoningRegulation(zone: string): { far: number | null; bcr: number | null; note: string } {
  if (ZONE_FAR_BCR[zone]) return { ...ZONE_FAR_BCR[zone], note: '都市計畫通則（典型值）' };
  for (const [key, val] of Object.entries(ZONE_FAR_BCR)) {
    if (zone.includes(key)) return { ...val, note: '都市計畫通則（典型值）' };
  }
  if (zone.includes('非都市') || zone === '計畫分區' || zone === '查詢失敗') {
    return { far: null, bcr: null, note: '非都市計畫區，依土地使用管制規則' };
  }
  return { far: null, bcr: null, note: '分區資料不足，請洽當地主管機關' };
}
