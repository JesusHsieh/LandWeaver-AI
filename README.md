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

# Module 05 專用（選填，有則使用真實資料，無則估算）
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here   # Google Earth 3D / Cesium 地形
VITE_CWA_API_KEY=your_cwa_api_key_here             # 中央氣象署（備用，Open-Meteo 優先）
VITE_EPA_API_KEY=your_epa_api_key_here             # 環境部 PM2.5 / AQI
VITE_TDX_CLIENT_ID=your_tdx_client_id             # 交通部 TDX（捷運列車動態）
VITE_TDX_CLIENT_SECRET=your_tdx_client_secret
```

| Key | 申請來源 | 費用 | 必填 |
|-----|---------|------|------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | 免費 | ✅ |
| `VITE_CESIUM_ION_TOKEN` | [Cesium Ion](https://ion.cesium.com/tokens) | 免費 | 選填 |
| `VITE_CWA_API_KEY` | [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/userLogin) | 免費 | 選填 |
| `VITE_EPA_API_KEY` | [環境部資料開放平臺](https://data.moenv.gov.tw/) | 免費 | 選填 |
| `VITE_TDX_CLIENT_ID/SECRET` | [TDX 運輸資料流通服務](https://tdx.transportdata.tw/) | 免費 | 選填 |

> **免 Key 也能用**：Open-Meteo（氣象）、PVGIS-ERA5（日照）、Open-Elevation（地形）、NLSC（都市計畫）均為公開 API，無需任何 Key。

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
├── index.html                            # 工具導覽首頁
├── src/
│   ├── shared/
│   │   ├── styles/global.css             # 全域 Tailwind v4 + Design Tokens
│   │   ├── LandWeaverHeader.tsx          # re-export shim
│   │   └── ApiKeyManager.tsx             # API Key 管理 UI
│   ├── app-shell/
│   │   ├── navbar/LandWeaverHeader.tsx   # 共用頂部導覽列
│   │   └── layout/AppLayout.tsx          # 共用頁面框架
│   ├── 01-landscape-magic-planner/       # Module 01
│   ├── 02-landscape-concept-ai/          # Module 02
│   ├── 03-space-photo-composite/         # Module 03
│   ├── 04-3d-layout-simulation/          # Module 04
│   └── 05-landscape-geo-analysis/        # Module 05
│       ├── App.tsx                        # 狀態管理、API 協調
│       ├── types.ts                       # 型別定義 + INITIAL_SETTINGS
│       ├── services/
│       │   ├── gisService.ts             # 7 個真實 API + 景觀決策引擎
│       │   ├── tdxService.ts             # TDX 交通資料（捷運/高鐵/台鐵）
│       │   └── exportService.ts          # PDF / MD / TXT 報告匯出
│       ├── components/
│       │   ├── MapControl.tsx            # CesiumJS 3D 地球儀 + WMS 圖層
│       │   ├── Sidebar.tsx               # 圖層控制 + 分析工具切換
│       │   ├── RightPanel.tsx            # 即時數據面板 + AI 決策輸出
│       │   └── TransportCesiumLayer.tsx  # 交通動態圖層（捷運/高鐵動畫）
│       └── data/
│           └── transportData.ts          # 台灣六大捷運 + 高鐵 + 台鐵路線資料
├── vite.config.ts                        # MPA 多頁入口 + 10 路 API Proxy
└── .env.example
```

---

## 🌍 Module 05 — 真實資料來源

景觀地理分析 AI 整合以下真實 API，所有數值皆非 mock：

| 資料項目 | API 來源 | Key | 說明 |
|---------|---------|-----|------|
| 氣溫、濕度、風速、降雨 | **Open-Meteo** | 不需要 | 全球 1km 格點即時氣象，主要來源 |
| 氣溫、濕度、風速、降雨 | 中央氣象署 CWA | 需要 | Open-Meteo 失敗時備用，最近觀測站 |
| PM2.5、AQI | 環境部 EPA | 需要 | 即時空氣品質測站，Haversine 最近站 |
| 年輻射量、月輻射、峰值日照 | **EU PVGIS-ERA5** | 不需要 | 歐盟太陽能資料庫，ERA5 全球覆蓋含台灣 |
| 高程、坡度、坡向、排水係數 | **Open-Elevation** | 不需要 | DEM 5 點取樣，計算坡度梯度與平面曲率 |
| 縣市鄉鎮行政區 | 國土測繪中心 NLSC | 不需要 | TownVillagePointQuery REST API |
| 都市計畫分區 | 國土測繪中心 WMS | 不需要 | GetMap 3×3px 像素取樣 → RGB 比對 LUIMAP 色碼 |
| 捷運 / 高鐵 / 台鐵路線 | 內建靜態資料 | 不需要 | 六大捷運系統 + 高鐵 + 台鐵路線幾何 |
| 捷運列車動態 | TDX 交通部 | 需要 | LiveBoard 即時班次，無 Key 則停用 |
| 太陽方位角 / 高度角 | 天文公式 | 不需要 | 即時計算，無需外部 API |

### 景觀決策引擎說明

**微氣候分區（7 類）**

以 PVGIS 年均峰值日照時數（location-specific，不受時刻影響）為主判斷依據：

| 分區 | 觸發條件 | 典型地點 |
|------|---------|---------|
| 高熱曝曬區 | peakSunHours ≥ 4.5 h/d | 西南平原、恆春半島 |
| 陰影區 | peakSunHours < 3.2 h/d，高濕 | 北部山區、基隆 |
| 乾陰區 | peakSunHours < 3.2 h/d，低雨高風 | 背風山谷 |
| 強風區 | windSpeed > 5 m/s | 沿海、山脊 |
| 都市熱島區 | temp > 28°C 且 elevation < 200m | 台北盆地、高雄市區 |
| 潮濕積水區 | rainfall > 10mm 或 drainageCoeff < 0.28 | 西部平原低窪 |
| 半日照區 | 以上條件均不符 | 台灣多數溫帶地區 |

**土壤滲透 / 水文**

- `drainageCoeff`：由 Open-Elevation 坡度推算（Rational Method C 值）
- `waterloggingRisk`：坡度 × 濕度（humidity > 80% 即使少雨仍判高風險）
- `pondingDepth`：rainfall × 5 + humidityIndex × 25（台北高濕 vs 高雄乾燥明顯差異）
- `catchmentArea`：SCA 公式（D∞ 近似），結合 Plan Curvature（Laplacian）

---

## 🚌 交通流動圖層

| 路線 | 來源 | 動態列車 |
|------|------|---------|
| 台北捷運（MRT） | 內建 + TDX LiveBoard | ✅ |
| 高雄捷運（KRTC） | 內建 + TDX LiveBoard | ✅ |
| 桃園捷運（Taoyuan） | 內建 + TDX LiveBoard | ✅ |
| 台中捷運（TMRT） | 內建 + TDX LiveBoard | ✅ |
| 台灣高鐵（THSR） | 內建（時刻表模擬） | ✅ |
| 台灣鐵路（TRA） | 內建（時刻表模擬） | ✅ |
| YouBike 站點 | Overpass API | — |

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
- **Vite MPA**：統一 `vite.config.ts` 多頁入口
- **Module 05 加入**：景觀地理分析 AI 模組建立

### v3.0 — Module 05 真實 API 整合
- 全面替換 mock 資料，接入 6 個真實 API
- 新增 NLSC WFS / WMS Vite Dev Proxy（解決 CORS）
- `_sources` 追蹤物件：UI 即時顯示每項數值來源（真實 API / 估算值）
- 水文計算：SCA + Plan Curvature、SCS Rational Method

### v4.0 — 決策引擎重構 + 交通圖層
- **氣象主源換為 Open-Meteo**：全球 1km 格點，免 Key，位置真實差異化
- **PVGIS 改用 ERA5**：確保台灣全境穩定覆蓋
- **都市計畫分區**：WFS（404）→ WMS GetMap 3×3px 像素取樣，RGB 比對 LUIMAP 色碼
- **WMS 圖層縮放修正**：加入 `maximumLevel`，縮放超過限制改放大現有 tile，不再消失
- **決策引擎重構**：Zoning 主判斷改用 peakSunHours（年均），移除夜間 shadowCoverage 誤判
- **waterloggingRisk / pondingDepth** 納入濕度，台北高濕 vs 高雄乾燥產生真實差異
- **時間軸優化**：拖動時間只重算太陽方位（本地），不重打 API
- **7 種分區各有專屬設計建議**，保底建議防止空引號顯示
- **日照分析**隨「日照與陰影模擬」開關連動顯示
- **月份輻射長條圖**：梯度色彩 + hover tooltip + 最低 8% 可見高度
- **交通流動圖層**：台北/高雄/桃園/台中捷運 + 高鐵 + 台鐵路線與動態列車
- **節氣標籤動態化**：底部依當前月份顯示春分/夏至/秋分/冬至

---

## 📄 授權

Open Source · Powered by [Gemini AI](https://ai.google.dev/) · [Cesium](https://cesium.com/)
