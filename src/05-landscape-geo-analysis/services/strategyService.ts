import { GoogleGenAI } from '@google/genai';
import { MicroClimateData, LandscapeDesignData } from '../types';
import { getConfiguredGeminiApiKey } from '../../shared/apiKeyService';

export interface StrategyResult {
  diagnosis: string[];      // 場址診斷：識別出的主要問題
  conclusion: string;       // 綜合結論：一段評估摘要
  recommendations: string[]; // 行動建議：具體可執行項目
}

function buildPrompt(micro: MicroClimateData, land: LandscapeDesignData): string {
  const far = land.zoningRegulation.far;
  const bcr = land.zoningRegulation.bcr;
  const reg = far !== null
    ? `容積率 ${far}%、建蔽率 ${bcr}%`
    : '非都市計畫區';

  return `你是資深景觀建築師，請根據以下真實場址數據，以繁體中文提供專業的場址診斷、綜合結論與行動建議。

【場址數據】
分區：${land.landUseZone} ／ 法規：${reg}
高程 ${micro.elevation.toFixed(0)} m ／ 坡度 ${micro.slopePct.toFixed(1)}% ／ 坡向 ${micro.aspectDir}
微氣候：${land.zoning.category}（強度 ${(land.zoning.intensity * 10).toFixed(1)}/10）
溫度 ${micro.temp.toFixed(1)}°C ／ 濕度 ${micro.humidity.toFixed(0)}% ／ 風速 ${micro.windSpeed.toFixed(1)} m/s
日照峰值 ${micro.peakSunHours.toFixed(1)} h/d ／ 年輻射 ${micro.annualIrradiance} kWh/m² ／ PM2.5 ${micro.pm25.toFixed(0)} µg/m³
積水風險 ${land.soil.waterloggingRisk} ／ 地表溫度 ${land.urbanStress.surfaceTemp.toFixed(1)}°C ／ 集水面積 ${land.hydrology.catchmentArea.toFixed(0)} m²
${land.urbanStress.canyonEffect ? '存在街谷風效應 ／ ' : ''}${land.urbanStress.downdraftRisk ? '高壓下衝風切風險' : ''}

請以 JSON 格式回應，嚴格遵循以下結構（禁止 markdown，每項 1-2 句精簡繁體中文）：
{
  "diagnosis": [
    "診斷問題1（描述場址最主要的挑戰或限制）",
    "診斷問題2",
    "診斷問題3"
  ],
  "conclusion": "一段 2-3 句的綜合結論，說明此場址的整體設計潛力與核心挑戰",
  "recommendations": [
    "建議1（具體可執行的景觀或空間設計行動）",
    "建議2",
    "建議3",
    "建議4"
  ]
}`;
}

export async function fetchLandscapeStrategy(
  micro: MicroClimateData,
  land: LandscapeDesignData,
): Promise<StrategyResult> {
  const apiKey = getConfiguredGeminiApiKey();

  if (!apiKey) throw new Error('請先在右下角 🔑 設定 AI API Key');

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: buildPrompt(micro, land),
    config: { temperature: 0.5, maxOutputTokens: 1024 },
  });

  const text = response.text ?? '';
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) throw new Error('AI 回應格式錯誤，請重試');

  return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as StrategyResult;
}
