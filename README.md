# 🌿 LandWeaver AI

**景觀設計 AI 工具集 · Landscape Design AI Suite**

整合 6 個景觀設計 AI 工具，從平面配置、概念圖生成、空間照片合成、3D 模擬，到 GIS 地理分析、植栽決策與法規計算。

🔗 **Live Demo：[land-weaver-ai.vercel.app](https://land-weaver-ai.vercel.app)**

> **⚠️ 線上版為 DEMO 展示**：部分即時地理 API（高程、都市計畫分區）可能因雲端 proxy 限制而使用估算值。若要完整體驗所有功能，請下載 GitHub 專案在 localhost 執行。

---

## 🗂 工具模組

| # | 階段 | 工具名稱 | 說明 |
|---|------|---------|------|
| 01 | Phase 1 · 概念發展 | **景觀配置概念圖 AI** | 繪製基地邊界、路徑與機能泡泡，AI 渲染成 20+ 種風格的景觀配置圖 |
| 02 | Phase 1 · 概念發展 | **景觀建築平面魔法師** | 上傳基地平面圖，AI 渲染景觀配置、生成多角度場景並輸出專業簡報 |
| 03 | Phase 1 · 概念發展 | **空間與照片 AI 合成** | 上傳現場照片，在 2D 平面圖上配置景觀元素，AI 精準合成至真實場景 |
| 04 | Phase 1 · 概念發展 | **平面配置圖 AI 3D 模擬** | 上傳平面圖，標記視點與方向，AI 生成 3D 透視模擬效果圖 |
| 05 | Phase 2 · 基地分析 | **景觀地理分析 AI** | 整合 3D 地球儀、日照模擬、微氣候分析與景觀決策引擎，點選基地即時獲取真實氣象、空品、高程、都市計畫分區與植栽建議 |
| 06 | Phase 3 · 法規計算 | **綠化法規計算機** | 支援台北市 / 新北市綠化自治法規計算（第 5、7、8、9、12 條），含即時試算、喬木棵數計算與查核清單 |

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
├── index.html                            # 工具導覽首頁（Vite entry）
├── src/
│   ├── home/                             # 首頁 React 應用
│   │   ├── main.tsx                      # React 入口
│   │   ├── App.tsx                       # 頁面組裝（header / phases / footer）
│   │   ├── home.css                      # 首頁樣式（cyber bg / card hover / 動畫）
│   │   ├── data/modules.ts               # 模組資料集中定義（typed）
│   │   └── components/
│   │       ├── CyberBackground.tsx       # 背景 grid / nebula / SVG contour
│   │       ├── ModuleCard.tsx            # 模組卡片（featured / standard variant）
│   │       └── PhaseSection.tsx          # Phase 標頭 + 卡片排列
│   ├── shared/
│   │   ├── styles/global.css             # 全域 Tailwind v4 + Design Tokens
│   │   ├── apiKeyService.ts              # AI API Key 管理（localStorage → env fallback）
│   │   ├── LandWeaverHeader.tsx          # re-export shim
│   │   └── ApiKeyManager.tsx             # API Key 管理 UI
│   ├── app-shell/
│   │   ├── navbar/LandWeaverHeader.tsx   # 共用頂部導覽列
│   │   └── layout/AppLayout.tsx          # 共用頁面框架
│   ├── 01-landscape-concept-ai/          # Module 01 · 景觀配置概念圖 AI
│   ├── 02-landscape-magic-planner/       # Module 02 · 景觀建築平面魔法師
│   ├── 03-space-photo-composite/         # Module 03 · 空間與照片 AI 合成
│   ├── 04-3d-layout-simulation/          # Module 04 · 平面配置圖 AI 3D 模擬
│   ├── 05-landscape-geo-analysis/        # Module 05 · 景觀地理分析 AI
│   │   ├── App.tsx                       # 狀態管理、API 協調
│   │   ├── types.ts                      # 型別定義 + INITIAL_SETTINGS
│   │   ├── services/
│   │   │   ├── gisService.ts             # API facade（氣象/太陽/高程/NLSC）
│   │   │   ├── clients/                  # API client 拆分（weather/solar/elevation/nlsc）
│   │   │   ├── recommendEngine.ts        # 景觀建議 / 植栽推薦邏輯
│   │   │   ├── zoningTable.ts            # 分區法規查表
│   │   │   ├── solarCalc.ts              # 太陽位置純計算
│   │   │   ├── strategyService.ts        # AI 景觀策略生成
│   │   │   ├── tdxService.ts             # TDX 交通資料
│   │   │   └── exportService.ts          # PDF / MD / TXT 報告匯出
│   │   ├── hooks/                        # 12 個功能 hook（地圖互動/圖層/地形）
│   │   ├── transport/                    # 交通圖層拆分（rail route / train / YouBike）
│   │   ├── layers/                       # Cesium 圖層元件（基礎/法規/分析/道路POI）
│   │   ├── components/
│   │   │   ├── MapControl.tsx            # CesiumJS 3D 地球儀（組裝層）
│   │   │   ├── Sidebar/                  # 圖層控制側欄（blocks / ui 拆分）
│   │   │   ├── RightPanel.tsx            # 即時數據面板 + AI 決策輸出
│   │   │   └── TransportCesiumLayer.tsx  # 交通動態圖層（facade）
│   │   ├── utils/                        # fetchOverpass（hedging）/ withTimeout / fetchJson / geo
│   │   └── data/transportData.ts         # 台灣六大捷運 + 高鐵 + 台鐵路線資料
│   └── 06-taipei-greenery-calc/          # Module 06 · 綠化法規計算機
│       ├── App.tsx                       # 主介面、城市切換（台北市 / 新北市）
│       ├── types.ts                      # 共用型別 + grouped prop 介面
│       ├── calculators/
│       │   ├── taipeiGreeneryCalculator.ts    # 台北市純計算函式（無 React）
│       │   └── newTaipeiGreeneryCalculator.ts # 新北市純計算函式（無 React）
│       ├── hooks/                        # state hooks（useGreeneryCalc / useNewTaipeiCalc）
│       ├── sections/                     # 各法條輸入與輸出區塊
│       └── components/                  # 共用 UI 元件
├── api/proxy/[...path].ts               # Vercel Edge Function — 12 路 API CORS Proxy
├── vercel.json                          # Vercel 部署設定（build + rewrites）
├── vite.config.ts                       # MPA 多頁入口 + 12 路 API Proxy（含 WMS 快取）
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
| 容積率 / 建蔽率法規 | NLSC WFS | 不需要 | 依都市計畫分區代碼對照台灣建築法規查表 |
| 地質敏感 / 液化潛勢 / 活動斷層 | 地質調查及礦業管理中心 CGS WMS | 不需要 | 08B / 08D 疊圖 |
| 土石流潛勢溪流 | 水土保持局 SWCB WMS | 不需要 | 08C 疊圖 |
| 淹水潛勢 | 水利署 WRA WMS | 不需要 | 08E 疊圖（2/10/100 年重現期） |
| 山坡地 / 地質敏感區範圍 | 水土保持局 SWCB WMS | 不需要 | 08F 疊圖 |
| 飲用水保護區 | 環境部 MOENV WMS | 不需要 | 08G 疊圖 |
| 文化資產保護範圍 | 國家災害防救科技中心 NCDR WMS | 不需要 | 08H 疊圖 |
| 捷運 / 高鐵 / 台鐵路線 | 內建靜態資料 | 不需要 | 六大捷運系統 + 高鐵 + 台鐵路線幾何 |
| 捷運列車動態 | TDX 交通部 | 需要 | LiveBoard 即時班次，無 Key 則停用 |
| 太陽方位角 / 高度角 | 天文公式 | 不需要 | 即時計算，無需外部 API |
| AI 場址診斷 + 景觀策略 | AI model | 需要 | 以真實場址數據生成三段式分析報告 |

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
| AI 引擎 | Provider SDK |
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

### v5.0 — AI 景觀策略 + 多危害圖層 + 效能優化
- **AI 景觀策略面板**：點選基地後開啟「景觀策略」開關，自動呼叫模型，以場址真實數據（分區法規、微氣候、水文、空品）生成三段式診斷報告：場址診斷 × 3 / 綜合結論 / 行動建議 × 4
- **API Key 整合修正**：策略面板改由 `ApiKeyManager` 共用 `IMAGE_GEN_KEY`（localStorage），與其他模組 Key 管理一致，無需重複設定
- **重試機制**：策略生成失敗後「重新生成」按鈕可正確觸發新一輪呼叫（useEffect trigger counter）
- **多危害疊圖 08A–08I**（新增 8 個 WMS 代理）：
  | 代碼 | 圖層 | 來源 |
  |------|------|------|
  | 08A | 都市計畫分區色塊 | 國土測繪中心 NLSC WMS |
  | 08B | 地質敏感區（液化潛勢） | 地質調查及礦業管理中心 CGS WMS |
  | 08C | 土石流潛勢溪流 | 水土保持局 SWCB WMS |
  | 08D | 活動斷層緩衝區 | 地質調查及礦業管理中心 CGS WMS |
  | 08E | 淹水潛勢（2年/10年/100年重現） | 水利署 WRA WMS |
  | 08F | 山坡地 / 地質敏感區範圍 | 水土保持局 SWCB WMS |
  | 08G | 飲用水保護區 | 環境部 MOENV WMS |
  | 08H | 文化資產保護範圍 | 國家災害防救科技中心 NCDR WMS |
  | 08I | 都市計畫範圍線 | 國土測繪中心 NLSC WMS |
- **效能優化**：
  - 都市計畫分區與行政區改為**並行預取**（`Promise.allSettled`），點選後快取命中，消除串接等待
  - 08A WMS tile 尺寸 256px → **512px**，同一視野 HTTP 請求數減少 75%
  - Vite proxy 新增 `Cache-Control: public, max-age=3600`，WMS 圖磚瀏覽器快取 1 小時
  - 策略呼叫新增 `useRef` fetch guard，防止 React Strict Mode 雙重觸發造成 API 配額浪費
- **Bug 修復**：
  - 修正 `strategyError` 被 `cancelled` guard 攔截導致錯誤訊息永遠空白
  - 修正平行化重構後 `townResult` / `zoneResult` 變數殘留引用，造成 `ReferenceError` 使 `landscapeData` 始終為 `null`（右側面板「都市計畫分區」與「地段」消失）
  - 修正 `MapControl` 太陽路徑弧線與方位角投影線共用同一 Cesium `Entity`，第二條 `PolylineGraphics` 靜默覆蓋第一條，導致太陽弧線完全不顯示
  - 修正策略 fetch Race Condition：快速切換基地時，前一個基地的 AI 回應會在 state reset 後才 resolve，以舊結果污染新基地的診斷內容；加入 generation counter ref 確保過時的 resolve 被丟棄
  - 新增 Module 05 ⚙ 設定面板的 **AI API Key 輸入欄**：原本設定面板只有 CWA / EPA / TDX 等 Key，使用者若未使用其他模組則無法在 Module 05 內設定 AI 診斷所需的 Key

### v6.0 — Module 06 整合 + 公開上線
- **Module 06 — 綠化法規計算機**：整合 `taipei-greenery-calc` 專案，支援台北市 / 新北市綠化自治法規計算（第 5、7、8、9、12 條），含即時試算、喬木棵數計算與查核清單
- **Vercel 公開部署**：新增 `api/proxy/[...path].ts` Vercel Edge Function，取代開發環境 Vite Proxy，解決 12 個台灣政府 API 的 CORS 問題；`vercel.json` 設定 build + rewrites
- **首頁架構調整**：新增 PHASE 03 · REGULATION & COMPLIANCE 區塊；Footer 更新為 © 2026 LandWeaver AI · Built by C.L Hsieh
- **GitHub 公開**：Repo 設為 Public，加入 Topics 標籤（react / typescript / ai / cesium / taiwan）

### v7.0 — 架構穩定化
- **首頁 React 化**：`index.html`（630 行靜態 HTML）拆分為 `src/home/` React 應用；模組資料集中於 `data/modules.ts`，背景/卡片/phase 各自成元件，動畫與視覺完整保留
- **Module 05 架構重構**：
  - `MapControl.tsx` 1597 行 → 329 行；拆出 `useImageryProviders` / `useCesiumTerrain` / `useMapInteractions`
  - `gisService.ts` 751 行 → 207 行 facade；內部拆為 `clients/`（weather/solar/elevation/nlsc）+ `solarCalc` / `zoningTable` / `recommendEngine`
  - `TransportCesiumLayer.tsx` 626 行 → 413 行；交通邏輯拆入 `transport/` 資料夾
  - 統一 Overpass fetch helper（`utils/fetchOverpass.ts`）；高程剖面加 abort 防競態
  - 地形切換與 building offset 拆為兩個獨立 effect，避免 terrainProvider 無謂重建
- **Module 06 架構重構**：
  - 純計算邏輯抽出至 `calculators/`（零 React 依賴），hook 僅管理 state
  - pass/fail 旗標統一由 calculator 產生，section 不再重算
  - `Article7` / `NtArticle8` 改為 grouped props（`trees` / `ground` / `state` / `results`）
  - `types.ts` 新增 `TaipeiGreeneryInput` / grouped prop 介面，型別覆蓋率顯著提升

### v8.0 — Module 05 功能完整化 + 效能精煉
- **右側資訊面板獨立** (`RightPanel.tsx`)：氣象 / 日照 / 地形 / 土壤 / 水文 / 都市干擾 / 容積率 / AI 植栽 / AI 策略診斷 / 匯出按鈕 / 系統狀態，全數封裝於獨立元件
- **報告匯出** (`exportService.ts`)：純函式架構，支援 `.md` / `.txt` / PDF（瀏覽器列印對話框）三種格式，9 個資料章節含 Markdown 表格
- **AI 景觀策略服務** (`strategyService.ts`)：乾淨提取為獨立模組；使用結構化 JSON prompt，回傳場址診斷 × 3 / 綜合結論 / 行動建議 × 4
- **TDX 交通服務完整化** (`tdxService.ts`)：Token OIDC 快取（60s buffer）、高鐵 / 台鐵時刻表位置線性內插、六大捷運系統 LiveBoard，全型別定義
- **`shared/apiKeyService.ts`**：集中管理 AI API Key（localStorage → env fallback），解除 `strategyService` 對 `imageGenerationService` 的語意不當依賴
- **`fetchOverpass.ts` Hedging 模式**：新增 `hedgeRequests: true` 選項，三個 Overpass 鏡像以 `hedgeDelayMs` 交錯同時發出，第一個回應即解決；`usePoiLayer` 已啟用，POI 載入體感顯著加速
- **`utils/withTimeout.ts` 統一提取**：消除 4 個 API client 的重複 `withTimeout` 實作，共用 `AbortSignal.timeout + AbortSignal.any` polyfill
- **`gisService.ts` In-Flight 去重 + LRU Cache**：同一座標的第二次點擊直接命中 Promise 快取，不重複打 NLSC API；LRU 上限 60 條目，`prefetchZone()` 與氣象請求並行消除串接延遲
- **`nlscClient.ts` 像素加權投票**：LUIMAP 分區偵測改為 9×9px 中心加權 × 顏色距離倒數投票，顯著降低邊界跨區誤判率
- **日期選擇器**：底部工具列新增日期欄位，可模擬任意日期（非僅今日）的太陽高度角與日照路徑，夏至冬至一鍵切換
- **Vercel Edge Proxy 完整化** (`api/proxy/[...path].ts`)：12 路 API 全數納入（NLSC/CGS/WRA/SWCB/MOENV/NCDR/PVGIS/Open-Elevation），含 tile `s-maxage=3600` CDN 快取、OPTIONS preflight、上游 CORS 標頭覆寫

---

## 📄 授權

Open Source · Built with React, Cesium, and public geospatial APIs
