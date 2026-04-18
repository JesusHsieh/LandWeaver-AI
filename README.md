# 🌿 LandWeaver AI

**景觀設計 AI 工具集 · Landscape Design AI Suite**

整合 5 個景觀設計 AI 工具，從平面配置、概念圖生成、空間照片合成、3D 模擬，到 GIS 地理分析與植栽決策，由 Gemini AI 驅動。

---

## 🗂 工具模組

### Phase 1 · 基地分析 Site Analysis

| # | 工具名稱 | 說明 |
|---|---------|------|
| 01 | **景觀地理分析 AI** | 整合 3D 地球儀、日照模擬、微氣候分析與景觀決策引擎，點選基地即時獲取真實氣象、空品、高程、都市計畫分區與植栽建議 |

### Phase 2 · 概念發展 Concept Development

| # | 工具名稱 | 說明 |
|---|---------|------|
| 01 | **景觀配置概念圖 AI** | 繪製基地邊界、路徑與機能泡泡，AI 渲染成 20+ 種風格的景觀配置圖 |
| 02 | **景觀建築平面魔法師** | 上傳基地平面圖，AI 渲染景觀配置、生成多角度場景並輸出專業簡報 |
| 03 | **空間與照片 AI 合成** | 上傳現場照片，在 2D 平面圖上配置景觀元素，AI 精準合成至真實場景 |
| 04 | **平面配置圖 AI 3D 模擬** | 上傳平面圖，標記視點與方向，AI 生成 3D 透視模擬效果圖 |

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製範本並填入你的 API Key：

```bash
cp .env.example .env.local
```

`.env.local` 需填入：

```env
# 必填 — 所有模組皆需要
GEMINI_API_KEY=your_gemini_api_key_here

# Module 05 專用
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here
VITE_CWA_API_KEY=your_cwa_api_key_here
VITE_EPA_API_KEY=your_epa_api_key_here
```

| Key | 申請來源 | 費用 |
|-----|---------|------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | 免費 |
| `VITE_CESIUM_ION_TOKEN` | [Cesium Ion](https://ion.cesium.com/tokens) | 免費 |
| `VITE_CWA_API_KEY` | [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/userLogin) | 免費 |
| `VITE_EPA_API_KEY` | [環境部資料開放平臺](https://data.moenv.gov.tw/) | 免費 |

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器前往 → `http://localhost:3000`

### 4. 建置生產版本

```bash
npm run build
```

---

## 🏗 專案架構

```
LandWeaver-AI/
├── index.html                        # 工具導覽首頁
├── src/
│   ├── shared/
│   │   ├── styles/global.css         # 全域 Tailwind v4 + Design Tokens
│   │   ├── LandWeaverHeader.tsx      # re-export shim
│   │   └── ApiKeyManager.tsx         # Gemini Key 管理 UI
│   ├── app-shell/
│   │   ├── navbar/LandWeaverHeader.tsx  # 共用頂部導覽列
│   │   └── layout/AppLayout.tsx         # 共用頁面框架
│   ├── 01-landscape-magic-planner/   # Module 01
│   ├── 02-landscape-concept-ai/      # Module 02
│   ├── 03-space-photo-composite/     # Module 03
│   ├── 04-3d-layout-simulation/      # Module 04
│   ├── 05-landscape-geo-analysis/    # Module 05
│   │   ├── services/gisService.ts    # 6 個真實 API 整合
│   │   ├── components/
│   │   │   ├── MapControl.tsx        # CesiumJS 3D 地球儀
│   │   │   ├── Sidebar.tsx           # 圖層控制 + 基地資訊
│   │   │   └── RightPanel.tsx        # 即時數據面板 + AI 決策
│   │   └── types.ts
│   └── vite-env.d.ts                 # Vite 環境變數型別宣告
├── vite.config.ts                    # MPA 多頁入口 + NLSC proxy
└── .env.example
```

---

## 🌍 Module 05 — 真實資料來源

景觀地理分析 AI 整合以下 6 個真實 API，所有數值皆非 mock：

| 資料項目 | API 來源 | 說明 |
|---------|---------|------|
| 氣溫、濕度、風速、降雨 | 中央氣象署 CWA | 自動氣象站即時觀測，Haversine 取最近站 |
| PM2.5、AQI | 環境部 EPA | 即時空氣品質測站，取最近站 |
| 年輻射量、月輻射、峰值日照 | EU PVGIS | 歐盟太陽能資料庫，覆蓋全球含台灣 |
| 高程、坡度、坡向、排水係數 | Open-Elevation | DEM 5 點取樣，計算坡度梯度與平面曲率 |
| 縣市鄉鎮行政區 | 國土測繪中心 NLSC | TownVillage API |
| 都市計畫分區 | 國土測繪中心 WFS | via Vite Dev Proxy（解決 CORS） |
| 太陽方位角 / 高度角 | 天文公式 | 無需 API，即時計算 |

### 水文計算說明

- **集水面積 (Catchment Area)**：採用 SCA（Specific Catchment Area）公式，結合 Open-Elevation 5 點取樣計算平面曲率（Laplacian），凹地聚水效果放大、凸稜地發散效果縮小
- **土壤滲透率 (Infiltration Rate)**：採用 SCS 合理方法（Rational Method），三因子推算：排水係數 C × 坡度修正 × 前期降雨修正（Antecedent Moisture）

---

## 🔧 技術棧

| 類別 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript 5.8 |
| 建置工具 | Vite 6（MPA 多頁應用） |
| 樣式系統 | Tailwind CSS v4（@theme Design Tokens） |
| 3D 地球儀 | CesiumJS 1.140 + Resium |
| AI 引擎 | Google Gemini (`@google/genai` v1.30) |
| 動畫 | Framer Motion |
| 圖示 | Lucide React |
| 工具函式 | date-fns、clsx、tailwind-merge |

---

## 📋 版本紀錄

### v1.0 — 初始版本
- 建立 5 個景觀設計工具基礎架構
- 各模組獨立 HTML 入口，CDN Tailwind CSS

### v2.0 — 架構重構
- **Tailwind CSS v4**：CDN → Vite Plugin，統一建置流程
- **Design Tokens**：`src/shared/styles/global.css`，全域 `@theme {}` 色彩與字型變數
- **App Shell**：`src/app-shell/` — 共用 `LandWeaverHeader` + `AppLayout` 元件
- **Vite MPA**：統一 `vite.config.ts` 多頁入口，支援 6 個 HTML entry
- **Module 05 加入**：景觀地理分析 AI 模組建立

### v3.0 — Module 05 真實 API 整合
- 全面替換 mock 資料，接入 6 個真實 API（CWA、EPA、PVGIS、Open-Elevation、NLSC TownVillage、NLSC WFS）
- 新增 Cesium Ion Token 初始化
- 新增 NLSC WFS Vite Dev Proxy（解決 CORS）
- `_sources` 追蹤物件：UI 即時顯示每項數值來源（真實 API / 估算值）
- 水文計算升級：SCA + Plan Curvature、SCS Rational Method
- 修正 MapControl Resium API 用法（`onLayerDidLoad`、`LabelGraphics position`）
- 新增 `src/vite-env.d.ts` 環境變數型別宣告
- 安裝 `@types/react`、`@types/react-dom`，全專案 TypeScript 零錯誤

---

## 📄 授權

Open Source · Powered by [Gemini AI](https://ai.google.dev/) · [Cesium](https://cesium.com/)
