# 🌿 LandWeaver AI

**景觀設計 AI 工具集 · Landscape Design AI Suite**

整合 6 個景觀設計 AI 工具，從平面配置、概念圖生成、空間照片合成、3D 模擬，到 GIS 地理分析、植栽決策與法規計算。

🔗 **Live Demo：[land-weaver-ai.vercel.app](https://land-weaver-ai.vercel.app)**

> **⚠️ 線上版為 DEMO 展示**：Module 05 的數值全部來自外部資料來源或標準公式；某項查詢失敗時顯示「無資料」，不以估算值代替。

---

## 🗂 工具模組

| # | 階段 | 工具名稱 | 說明 |
|---|------|---------|------|
| 01 | Phase 1 · 概念發展 | **景觀配置概念圖 AI** | 繪製基地邊界、路徑與機能泡泡，AI 渲染成 20+ 種風格的景觀配置圖 |
| 02 | Phase 1 · 概念發展 | **景觀建築平面魔法師** | 上傳基地平面圖，AI 渲染景觀配置、生成多角度場景並輸出專業簡報 |
| 03 | Phase 1 · 概念發展 | **空間與照片 AI 合成** | 上傳現場照片，在 2D 平面圖上配置景觀元素，AI 精準合成至真實場景 |
| 04 | Phase 1 · 概念發展 | **平面配置圖 AI 3D 模擬** | 上傳平面圖，標記視點與方向，AI 生成 3D 透視模擬效果圖 |
| 05 | Phase 2 · 基地分析 | **景觀地理分析 AI** | 整合 3D 地球儀、日照模擬、微氣候分析與景觀決策引擎，點選基地即時獲取真實氣象、空品、高程、都市計畫分區與植栽建議，並產生場址規則檢核表（可一鍵複製給 AI 分析；本模組不呼叫 AI、不需 Gemini Key） |
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
# Module 01–04（AI 生圖 / 渲染）需要；Module 05、06 不需要
GEMINI_API_KEY=your_gemini_api_key_here

# Module 05 專用（選填；未填時改用免 Key 來源，查不到則顯示「無資料」）
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here   # Google Earth 3D / Cesium 地形
VITE_CWA_API_KEY=your_cwa_api_key_here             # 中央氣象署（備用，Open-Meteo 優先）
VITE_EPA_API_KEY=your_epa_api_key_here             # 環境部 PM2.5 / AQI
VITE_TDX_CLIENT_ID=your_tdx_client_id             # 交通部 TDX（捷運列車動態；高鐵/台鐵免 Key 也能看）
VITE_TDX_CLIENT_SECRET=your_tdx_client_secret
VITE_API_PROXY_BASE_URL=                           # Optional: static hosts can point to Vercel proxy
```

| Key | 申請來源 | 費用 | 必填 |
|-----|---------|------|------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | 免費額度很少，用完需開通付費（與 Google AI Pro 訂閱無關） | Module 01–04 必填 |
| `VITE_CESIUM_ION_TOKEN` | [Cesium Ion](https://ion.cesium.com/tokens) | 免費 | 選填 |
| `VITE_CWA_API_KEY` | [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/userLogin) | 免費 | 選填 |
| `VITE_EPA_API_KEY` | [環境部資料開放平臺](https://data.moenv.gov.tw/) | 免費 | 選填 |
| `VITE_TDX_CLIENT_ID/SECRET` | [TDX 運輸資料流通服務](https://tdx.transportdata.tw/) | 免費 | 選填 |
| `VITE_API_PROXY_BASE_URL` | Vercel proxy origin | 免費 | 靜態部署選填 |

> **免 Key 也能用**：Open-Meteo（氣象 / 地形）、PVGIS-ERA5（日照）、NLSC（都市計畫）、Esri（暗色 / 亮色底圖、地形備援）均為公開 API，無需任何 Key。Module 05 不填任何 Key 也能完整運作；PM2.5 未填環境部 Key 時改用 Open-Meteo CAMS 模式值（標示為模式值，不提供台灣 AQI）。

> **⚠️ 待處理 — Cesium Ion Token**：目前未設定 `VITE_CESIUM_ION_TOKEN`，Google Earth 3D / OSM 3D 建築 / 地形 用的是 Cesium 內建的評估用 token。它隨 Cesium 版本更換，約半年就會失效（1.140 的已於 2026-11 失效，暫以升級至 1.147 恢復）。失效時地形自動改用 Esri、OSM 3D 改用 Overpass 建物，但 **Google 3D 會停用**。
> 長期解法：在 [ion.cesium.com](https://ion.cesium.com/tokens) 申請免費 token → 設為 Vercel 環境變數 `VITE_CESIUM_ION_TOKEN` 後重新部署（建議在 Ion 限制只允許自己的網域）。

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
│   │   │   ├── gisService.ts             # API facade（氣象/太陽/高程/NLSC/災害潛勢）
│   │   │   ├── clients/                  # API client 拆分（weather/solar/elevation/nlsc/hazard/search）
│   │   │   ├── hazards.ts                # 災害潛勢結果的共用標示（面板、規則、報告）
│   │   │   ├── recommendEngine.ts        # 景觀建議 / 植栽推薦邏輯
│   │   │   ├── solarCalc.ts              # 太陽位置純計算
│   │   │   ├── siteRules.ts              # 場址規則檢核（本機判讀，不呼叫 AI）
│   │   │   ├── tdxService.ts             # TDX 交通資料
│   │   │   └── exportService.ts          # PDF / MD / TXT 報告匯出
│   │   ├── hooks/                        # 14 個功能 hook（地圖互動/圖層/地形/圖層排序/OSM 建物備援）
│   │   ├── transport/                    # 交通圖層拆分（rail route / train / YouBike）
│   │   ├── layers/                       # Cesium 圖層元件（基礎/法規/分析/道路POI）
│   │   ├── components/
│   │   │   ├── MapControl.tsx            # CesiumJS 3D 地球儀（組裝層）
│   │   │   ├── Sidebar/                  # 圖層控制側欄（blocks / ui 拆分）
│   │   │   ├── RightPanel.tsx            # 即時數據面板 + 場址規則檢核（複製給 AI）
│   │   │   └── TransportCesiumLayer.tsx  # 交通動態圖層（facade）
│   │   ├── utils/                        # fetchOverpass（hedging）/ withTimeout / fetchJson / geo / ionStatus / terrainSource / coordParse
│   │   └── data/                         # transportData.ts 高鐵站點 + routes/*.json 路線與站點快照（OSM）
│   └── 06-taipei-greenery-calc/          # Module 06 · 綠化法規計算機
│       ├── App.tsx                       # 主介面、城市切換（台北市 / 新北市）
│       ├── types.ts                      # 共用型別 + grouped prop 介面
│       ├── calculators/
│       │   ├── taipeiGreeneryCalculator.ts    # 台北市純計算函式（無 React）
│       │   └── newTaipeiGreeneryCalculator.ts # 新北市純計算函式（無 React）
│       ├── hooks/                        # state hooks（useGreeneryCalc / useNewTaipeiCalc）
│       ├── sections/                     # 各法條輸入與輸出區塊
│       └── components/                  # 共用 UI 元件
├── api/proxy.ts                         # Vercel Edge Function — 17 路 API CORS Proxy（vercel.json 以 ?__route=&__path= 轉入）
├── vercel.json                          # Vercel 部署設定（build + rewrites）
├── vite.config.ts                       # MPA 多頁入口 + 12 路 API Proxy（含 WMS 快取）
└── .env.example
```

---

## 🌍 Module 05 — 真實資料來源

景觀地理分析 AI 整合以下真實 API，所有數值皆非 mock：

| 資料項目 | API 來源 | Key | 說明 |
|---------|---------|-----|------|
| 氣溫、濕度、風速、降雨、地表溫度 | **Open-Meteo** | 不需要 | 格點即時氣象，主要來源；地表溫度為 0 cm 模式值 |
| 氣溫、濕度、風速、降雨 | 中央氣象署 CWA | 需要 | Open-Meteo 失敗時備用，最近觀測站 |
| PM2.5、AQI | 環境部 EPA | 需要 | 即時空氣品質測站，Haversine 最近站 |
| PM2.5（備援） | **Open-Meteo Air Quality（CAMS）** | 不需要 | 未填環境部 Key 時使用，屬模式值，不提供台灣 AQI |
| 斜面年日射量、月分布、峰值日照、最佳傾角 | **EU PVGIS-ERA5** | 不需要 | 最佳傾角斜面日射量 H(i)（不是 1 kWp 發電量） |
| 高程、坡度、坡向、地表曲率 | **Open-Elevation** | 不需要 | DEM 5 點取樣（間距約 111 m），中央差分計算坡度、下坡方向與平面曲率 |
| 縣市鄉鎮行政區、地段 | 國土測繪中心 NLSC | 不需要 | TownVillagePointQuery REST API |
| 地址 / 地標搜尋 | **OSM Nominatim** | 不需要 | 側欄「Locate · 基地定位」按 Enter 才查（每秒最多 1 次）；門牌號、路名、行政區、名稱不符的結果直接剔除；OSM 門牌不完整，查不到門牌時改列同名道路並標示 |
| 座標輸入 | 本機換算 | 不需要 | WGS84 十進位 / 度分秒、TWD97 二度分帶（中央經線 121° 本島、119° 澎金馬） |
| 地號查詢 | 國土測繪圖資服務雲（外部連結） | — | 官方地號定位 API 需申請（民間為付費訂閱），改連到官方地圖查詢後貼回座標 |
| 都市計畫分區 | 國土測繪中心 WMS | 不需要 | GetMap 9×9 px 取樣 → RGB 比對 LUIMAP 色碼；容積率、建蔽率依各都市計畫書，不提供推估值 |
| 淹水潛勢 | 經濟部水利署 GIC WMS | 不需要 | 點選基地以 GetFeatureInfo 讀 6 / 12 / 24 小時共 10 種降雨情境的模擬淹水深度；08E 疊圖為 24 小時 500 mm 情境 |
| 初級土壤液化潛勢 2021 | 地質調查及礦業管理中心 CGS WMS | 不需要 | 官方圖層不支援 GetFeatureInfo，點選基地取 9×9 px 讀色碼（紅 = 高、黃 = 中、綠 = 低）；08B 疊圖 |
| 岩屑崩滑潛勢 2013 | 地質調查及礦業管理中心 CGS WMS | 不需要 | 同上，判斷是否位於潛勢區；08C 疊圖 |
| 活動斷層 / 山崩與地滑地質敏感區 | 地質調查及礦業管理中心 CGS WMS | 不需要 | 08D / 08F 疊圖；官方圖只有外框且不支援點位查詢，無法點位判定 |
| 水庫 / 水體 | OSM（Overpass） | 不需要 | 08G 點標記，非法定飲用水保護區範圍 |
| 歷史古蹟點位 | OSM（Overpass） | 不需要 | 08H 點標記，非文資局法定清冊 |
| 捷運 / 高鐵 / 台鐵路線與站點 | OSM 快照（`data/routes/*.json`） | 不需要 | 北捷（含環狀線、輕軌）/ 桃捷 / 中捷 / 高捷 + 高鐵 + 台鐵，含全部站點與站名；以 `node scripts/fetch-transport-routes.mjs` 更新（讀 OSM API，不經 Overpass） |
| 捷運列車動態 | TDX 交通部 | 需要 | LiveBoard 即時班次，無 Key 則停用 |
| 高鐵 / 台鐵列車位置 | TDX 交通部 | 選填 | 未填 Key 時以匿名方式查詢（每日次數有限，台鐵誤點每 10 分鐘更新）；填 Key 後誤點每分鐘更新 |
| 太陽方位角 / 高度角 | 天文公式 | 不需要 | 即時計算，無需外部 API |
| 底圖 OSM / 暗色 / 亮色 | OpenStreetMap / **Esri Canvas** | 不需要 | 暗色、亮色改用 Esri（CARTO 已改為需 Key），含地名標註；最高縮放 level 16 |
| 3D 地形 | Cesium World Terrain → **Esri World Elevation 3D** | Ion（選填） | Ion token 無效時自動改用 Esri 地形 |
| 3D 建物 | Cesium OSM Buildings → **Overpass 建物輪廓** | Ion（選填） | Ion 無效時改以 OSM `height` / `building:levels` 擠出畫面中心 600 m 內建物 |
| Google Earth 3D | Cesium Ion（Google Photorealistic 3D Tiles） | Ion（必要） | 無有效 token 時停用，側欄會顯示提示 |
| 場址規則檢核 | 本機規則 | 不需要 | 坡度、積水、地表溫度、風、日照、PM2.5 等逐項對照判準；可一鍵複製 Markdown 表格貼給任一 AI 分析 |

### 景觀決策引擎說明

**微氣候分區（7 類，規則分類）**

以 PVGIS 峰值日照時數（最佳傾角斜面，location-specific，不受時刻影響）為主判斷依據；面板與報告會列出觸發的條件。日照、氣象或高程任一查詢失敗時不分類，顯示「無資料」。

| 分區 | 觸發條件 | 典型地點 |
|------|---------|---------|
| 高熱曝曬區 | peakSunHours ≥ 4.5 h/d | 西南平原、恆春半島 |
| 陰影區 | peakSunHours < 3.2 h/d | 北部山區、基隆 |
| 乾陰區 | peakSunHours < 3.2 h/d，雨量 < 5 mm 且風速 > 3 m/s | 背風山谷 |
| 強風區 | windSpeed > 5 m/s | 沿海、山脊 |
| 高溫低地區 | temp > 28°C 且 elevation < 200 m | 台北盆地、高雄市區（夏季） |
| 潮濕積水區 | rainfall > 10 mm 或坡度 < 4% | 西部平原低窪 |
| 半日照區 | 以上條件均不符 | — |

**地表排水 / 逕流**

- 沒有土壤資料，因此**不推估入滲率**；地表排水只依 DEM 坡度分級：坡度 > 20% 快、> 5% 中、其餘慢
- 積水風險：排水快 → 低；排水慢且當下雨量 > 3 mm 或濕度 > 80% → 高；其餘 → 中
- 地表逕流方向 = DEM 下坡方向（坡度 < 1% 視為平坦，不標方向）
- 太陽：目前高度角 / 方位角，以及夏至、春秋分、冬至的正午高度角與晝長（天文公式）

**場址規則檢核（17 項）**

點選基地並開啟「場址規則檢核」後，右側面板逐項列出結果（觸發 → 參考 → 未觸發 → 未判讀）。按「複製檢核表」會複製 Markdown（座標、分區、當下氣象、資料來源 + 完整表格），可直接貼給任一 AI 分析。

| 類別 | 項目 | 判準 |
|------|------|------|
| 地形 | 坡度 | ≥15% 中 · ≥30% 高 |
| 地形 | 地表曲率 | 凹地（> 0，聚水）觸發 |
| 地形 | 海拔 | ≥500 m |
| 水文 | 積水風險 | 中 / 高 |
| 災害 | 淹水潛勢（水利署，24 小時 500 mm 情境） | 0.3–0.5 m 低 · 0.5–1.0 m 中 · ≥1.0 m 高；備註最嚴重情境 |
| 災害 | 土壤液化潛勢（地調中心 2021 初級） | 中潛勢 中 · 高潛勢 高 |
| 災害 | 岩屑崩滑潛勢（地調中心 2013） | 位於潛勢區 |
| 災害 | 地質敏感區（活動斷層、山崩與地滑） | 官方圖無法點位查詢，固定列「未判讀」並提示開啟 08D、08F 目視 |
| 熱環境 | 地表溫度（Open-Meteo 0 cm 模式值） | >35°C 中 · >40°C 高 |
| 風環境 | 平均風速 / 強風坡地 / 低風速平坦低地 | ≥5 m/s · 風速 >5 m/s 且坡度 >10% · 風速 <3 m/s、海拔 <80 m、坡度 <5% |
| 日照 | 日照峰值 | <3.2 h/d 低 · <2.5 h/d 中 |
| 空氣 | PM2.5 | >35 µg/m³ 中 · >54 µg/m³ 高；無 EPA 即時資料則「未判讀」 |
| 參考 | 微氣候分區 / 太陽能潛力 / 土地使用分區 | 僅列出，不判定 |

查詢失敗的項目列為「未判讀」，不以估算值判定。

### Module 05 已知限制與待辦

**資料未進入檢核表 / 報告**
- [ ] 活動斷層、山崩與地滑地質敏感區（08D、08F）無法點位判定：地調中心 WMS 只有外框圖、不支援 GetFeatureInfo，需開圖層目視
- [ ] 飲用水保護區、文資範圍、土石流潛勢溪流尚未接官方點位查詢（08G、08H 只有 OSM 標記）
- [ ] 緩衝區（100–800 m）只畫圈，未統計圈內綠覆、建物密度、行道樹、最近捷運站、生活機能 POI
- [ ] 綠覆只有「OSM 綠地標記」（公園 / 林地 / 草地標籤），沒有衛星植生指數或土地覆蓋圖
- [ ] 沒有土壤資料：不提供入滲率，地表排水只依坡度分級（可評估接 SoilGrids 或農業部土壤圖）
- [ ] 沒有不透水面資料（原「不透水面概略」圖層由推估熱指數畫出，已移除）
- [ ] 容積率、建蔽率不提供（各都市計畫書不同；原本的典型值查表已移除）
- [ ] 08G、08H 只有 OSM 點標記，不是環境部飲用水保護區、文資局法定範圍

**外部服務依賴**
- [ ] 道路分級、生活機能 POI、OSM 綠地標記、建物密度、08G、08H 即時查詢 Overpass 公共鏡像，鏡像故障或過載時載入失敗（可評估改用免 Key 的 OSM 向量圖磚）

**功能缺口**
- [ ] 官方門牌 / 地號定位：國土測繪中心「模糊檢索 API」（門牌、地標）與「地籍 API」（地號定位）需申請，民間為付費訂閱；全國門牌地址定位服務只開放政府與學術單位。目前地址用 OSM（門牌不完整），地號需到圖資服務雲查詢後貼座標
- [ ] 基地範圍（多邊形）繪製與面積量測（目前僅單點分析 + 兩點距離）
- [ ] 分享連結、儲存基地、多基地比較
- [ ] 植栽資料庫僅 12 種（規則篩選，非 AI）
- [ ] 手機版版面（左右面板固定寬度）

**維運**
- [ ] 設定自己的 Cesium Ion token（見上方「待處理」）
- [ ] 自動化測試（規則檢核、分區判定等純函式優先）

---

## 🚌 交通流動圖層

| 路線 | 來源 | 動態列車 |
|------|------|---------|
| 台北捷運（MRT） | 內建 + TDX LiveBoard | ✅ |
| 高雄捷運（KRTC） | 內建 + TDX LiveBoard | ✅ |
| 桃園捷運（Taoyuan） | 內建 + TDX LiveBoard | ✅ |
| 台中捷運（TMRT） | 內建 + TDX LiveBoard | ✅ |
| 台灣高鐵（THSR） | OSM 快照 + TDX 今日時刻表 | ✅ 沿軌道連續移動，免 Key |
| 台灣鐵路（TRA） | OSM 快照 + TDX 時刻表 + 即時誤點 | ✅ 沿軌道連續移動，免 Key（填 Key 後誤點每分鐘更新） |
| YouBike 站點 | data.taipei 即時 | ✅ |

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
- **Vercel Edge Proxy 完整化** (`api/proxy/[...path].ts`)：17 路 API 全數納入（NLSC/CGS/WRA/SWCB/MOENV/NCDR/PVGIS/Open-Elevation/Taipei Tree/CWA/EPA/TDX），含 tile `s-maxage=3600` CDN 快取、OPTIONS preflight、上游 CORS 標頭覆寫

### v9.0 — Module 05 線上修復 + 3D 備援 + 移除 Gemini
- **Vercel Proxy 路由修正**：`api/proxy/[...path].ts` → `api/proxy.ts`，`vercel.json` 改以 `?__route=&__path=` 轉入，修正線上版 proxy 路由失效；Vite dev proxy 補上 CWA / EPA / TDX；新增 `VITE_API_PROXY_BASE_URL` 供靜態部署指向 Vercel proxy
- **Overpass 穩定化**：移除已失效的 kumi 鏡像、改加 mail.ru 鏡像；hedging 改為「失敗立即換下一個鏡像」，08G / 08H 逾時放寬至 30 秒
- **YouBike 修正**：台北市 JSON 改欄位名（`latitude` / `available_rent_bikes`…），新舊格式皆可讀，丟棄無效座標避免 Cesium 停止渲染
- **高捷路線修正**：Overpass 改用 `out geom`（`out geom tags` 不含 relation 成員），略過月台 / 停靠點成員
- **底圖修正**：暗色 / 亮色改用 Esri Canvas（CARTO 已需 Key）並加地名標註；切換主題或重開底圖後，疊加圖層（等高線、地籍、災害…）維持在上層（`useImageryLayerOrder`）；主題切換以 `key` 重建圖層，避開 resium 只生效一次的問題
- **Cesium 1.140 → 1.147**：舊版內建 Ion token 已被撤銷，升級後 Google 3D / OSM 3D / 地形恢復
- **Ion 失效自動備援**（`utils/ionStatus.ts`）：啟動時檢查 token；無效時地形改用 Esri World Elevation 3D、OSM 3D 建物改用 Overpass 輪廓（`useOsmBuildingsFallback`，跟隨畫面中心載入），Google 3D 停用並在側欄提示；⚙ 設定填入新 token 免重新整理即生效
- **分區圖示**：Iconify 圖示 404，改為內嵌 SVG
- **移除 Gemini**：刪除 `strategyService.ts`、🔑 API Key 按鈕與設定欄位；改為本機「場址規則檢核」（`services/siteRules.ts`），13 項逐項判讀，可一鍵複製 Markdown 表格交給任一 AI 分析，Module 05 不再消耗任何 AI 額度

### v9.1 — Module 05 交通區位修復、列車即時位置 + 08E 直連
- **路線改為內建 OSM 快照**：捷運 / 高鐵 / 台鐵 / 桃捷 / 中捷 / 高捷路線不再於執行時查 Overpass（公共鏡像常連不上，路線整個畫不出來）。`scripts/fetch-transport-routes.mjs` 從 OSM API 讀取各路線 relation、簡化（約 2 m）後存為 `data/routes/*.json`（共約 375 KB，開啟圖層時才載入），開啟後 0.1–0.3 秒顯示；台鐵改由各路線 relation 取得，不含糖鐵與工業側線
- **站點補齊並顯示站名**：原本只內建少數站且部分座標錯誤（點不在線上），拉遠時捷運站點會消失、台鐵站點縮到看不見。現在站點也來自 OSM 快照：北捷 141、台鐵 242、桃捷 22、中捷 18、高捷 75 站，白點加路線色外框，拉近後顯示站名（北捷、高捷 12–15 km 內，桃捷、中捷 25 km 內，台鐵 40 km 內）
- **路線載入失敗不再快取空結果**，下次開啟會重試
- **道路分級 / 生活機能 POI**：查詢逾時由 15 / 7 秒放寬至 30 秒（目前可用的鏡像常需 15–25 秒），Overpass 預設逾時同步放寬；未點選分析點時側欄提示
- **高鐵 / 台鐵列車即時位置**：交通區位面板的「列車即時位置」開關。依 TDX 今日時刻表（台鐵當日時刻表未發布時改用定期時刻表依星期篩選）推算每班車現在在哪兩站之間，沿 OSM 軌道（`transport/trackGraph.ts`，車站可換股道、站區缺口自動接合）連續移動，每 250 ms 更新，停站時停在月台；台鐵再套用 TDX 即時誤點，標籤顯示車種、車次、終點與誤點分鐘（橘＝對號列車、藍＝區間）。原本的程式用錯 TDX 端點與回傳格式，高鐵、台鐵列車從未真正顯示；現在未填 Key 也能用
- **08E 淹水潛勢**：水利署防火牆拒絕 Vercel 機房 IP，改由瀏覽器直連 `maps.wra.gov.tw`（有開 CORS），移除 `wra-wms` proxy 路由

### v9.2 — Module 05 移除估算與示意資料
- **查詢失敗不再填估算值**：氣象、空品、日照、高程失敗時原本代入固定數值（25.5°C、PM2.5 20、年輻射 1350、高程 20 m 平地…）並照常判讀；現在欄位為「無資料」，規則檢核列為「未判讀」，系統狀態列出失敗的來源。都市計畫分區查詢失敗原本回報「非都市計畫區」，改為「查詢失敗」
- **移除示意資料**：微氣候分區 9 格（座標亂數）改為只標示基地本身的分類並列出觸發條件；地表逕流箭頭原本方向由座標亂數決定，改用 DEM 下坡方向；「不透水面概略」圖層（由推估熱指數畫圈）移除；道路標籤的「高 / 中 / 低流量」（OSM 沒有車流量）移除
- **移除無資料依據的推估數值**：土壤入滲率、排水係數 C、集水面積、暴雨積水深、熱指數、反照率、推估表面溫度、陰影覆蓋率、夏至 / 冬至遮蔭百分比、分區強度分數、植栽適合度百分比、容積率 / 建蔽率典型值。改以真實資料取代：地表溫度用 Open-Meteo 0 cm 模式值，季節日照改為正午太陽高度角與晝長（天文公式），植栽改列出符合的條件
- **修正錯誤資料**：坡向原本指向上坡（相差 180°），東西向間距未隨緯度修正；PVGIS 原本把 1 kWp 發電量當成年輻射量，最佳傾角欄位讀錯（一律變成緯度）；時間軸的季節標籤改為依太陽黃經計算的二十四節氣
- **PM2.5 免 Key 備援**：未填環境部 Key 時改用 Open-Meteo CAMS 模式值（標示為模式值）
- **名稱與內容一致**：「NDVI」→「OSM 綠地標記」、「AI 植栽建議」→「植栽建議（規則篩選）」、「都市熱島區」→「高溫低地區」、「街谷效應 / 坡地下衝風」→「低風速平坦低地 / 強風坡地」、08G →「水庫 / 水體（OSM）」、08H →「歷史古蹟點位（OSM）」
- **匯出報告**加入場址規則檢核表，資料來源標示改正（原本 Open-Meteo 被標成「台灣年均估算值」、分區一律顯示「查詢失敗」）
- 本機開發的 PVGIS proxy 改用與線上相同的標頭規則（原本被 PVGIS 防火牆擋下）

### v9.3 — Module 05 災害潛勢點位判定
- **點選基地即查官方災害潛勢圖資**，結果列在右側「Hazards · 災害潛勢」、場址規則檢核（新增 4 項，共 17 項）與匯出報告：
  - 淹水潛勢：水利署淹水潛勢圖 GetFeatureInfo，6 / 12 / 24 小時共 10 種降雨情境的模擬淹水深度；規則以 24 小時 500 mm 情境分級
  - 土壤液化潛勢（2021 初級）、岩屑崩滑潛勢（2013）：地調中心 WMS 不支援 GetFeatureInfo，改讀基地像素色碼；顏色不在圖例中時列為查詢失敗，不猜測
  - 活動斷層、山崩與地滑地質敏感區：官方圖只有外框，無法點位判定，照實標示並提示開啟 08D、08F 目視
- **08E 淹水潛勢疊圖修正**：原本的 `114nfp_*` 圖層實際上是河道範圍、不含淹水深度，改為 24 小時 500 mm 情境的模擬淹水深度圖
- 查詢結果與分區一樣做點位快取，只快取全部成功的結果

### v9.4 — Module 05 地址、地標、座標定位
- **側欄新增「Locate · 基地定位」**，定位後與點地圖相同，會立即分析該點：
  - 座標：貼上經緯度（十進位、度分秒、N/E 標記皆可）或 TWD97 二度分帶 X/Y，本機換算後定位；TWD97 可切換中央經線 121°（本島）/ 119°（澎金馬）
  - 地址、地標：OSM Nominatim 搜尋，列出候選並標示「門牌 / 地標 / 道路 / 地區」由使用者選擇。OSM 查不到門牌時會回傳同條路的其他門牌或不相干的地點，這類結果一律剔除；查不到門牌時改列同名道路並註明
  - 地號：官方地號定位 API 需申請，改提供國土測繪圖資服務雲連結，查到後貼座標回來
- 搜尋定位時相機飛到適合高度（門牌、地標約 600 m，道路 1.5 km，行政區依層級）；開啟地形或 Google 3D 時先取地面高程，避免在山區鑽進地形

---

## 📄 授權

Open Source · Built with React, Cesium, and public geospatial APIs
