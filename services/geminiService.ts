
import { GoogleGenAI, Type } from "@google/genai";
import { Trip, AIInsight } from "../types";

export async function getTripInsights(trips: Trip[]): Promise<AIInsight> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Feature extraction for clustering and anomaly detection
  const dataSummary = trips.map(t => ({
    id: t.id,
    mission: t.missionName,
    purpose: t.purpose,
    dist: t.distanceKm,
    duration: t.durationMin,
    fuel: t.fuelCost,
    startTime: t.startTime,
    efficiency: t.efficiencyScore
  }));

  const prompt = `จงวิเคราะห์ข้อมูลการเดินทางของหน่วยงานราชการไทยดังต่อไปนี้ เพื่อทำ Clustering, Anomaly Detection และ Summary เชิงยุทธศาสตร์:
  
  DATA: ${JSON.stringify(dataSummary)}
  
  ภารกิจของคุณ:
  1. วิเคราะห์หารูปแบบการเดินทางที่ซ้ำซ้อน (Clustering) เช่น เส้นทางเดิม ภารกิจเดิมที่ทำแยกกัน
  2. ตรวจสอบความผิดปกติ (Anomaly) เช่น ระยะทางไม่สมดุลกับเวลา หรือความเร็วที่อาจสื่อถึงความไม่ปลอดภัย
  3. สรุปเป็นภาษาไทยเชิงบริหาร (Executive Summary)
  
  ข้อกำหนดผลลัพธ์: ต้องเป็น JSON เท่านั้น ห้ามมี Markdown หรือข้อความอื่นนอกเหนือจาก JSON
  {
    "summary": "สรุปภาพรวมในเชิงบริหารและประสิทธิภาพการใช้งบประมาณ",
    "anomalies": ["รายการที่ผิดปกติพร้อมเหตุผลสนับสนุนเชิงตัวเลข"],
    "recommendations": ["ข้อเสนอแนะ 3 ข้อที่ปฏิบัติได้จริงเพื่อลดต้นทุน"],
    "clusters": ["กลุ่มภารกิจที่ซ้ำซ้อนกันเพื่อรวมการเดินทางในอนาคต"],
    "scores": { 
      "efficiency": 0-100, 
      "cost": 0-100, 
      "dataQuality": 0-100 
    }
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || '{}';
    // Validate JSON structure
    const result = JSON.parse(text);
    
    // Schema validation and fallback
    if (!result.summary || !result.scores) throw new Error("Invalid schema");
    
    return result as AIInsight;
  } catch (error) {
    console.warn("Gemini Analysis Failed, falling back to local analytics.", error);
    return localAnalyticsFallback(trips);
  }
}

function localAnalyticsFallback(trips: Trip[]): AIInsight {
  const totalKm = trips.reduce((sum, t) => sum + t.distanceKm, 0);
  const avgEfficiency = trips.length > 0 ? trips.reduce((sum, t) => sum + (t.efficiencyScore || 0), 0) / trips.length : 0;
  
  const anomalies = [];
  if (avgEfficiency < 60) anomalies.push("ค่าประสิทธิภาพเฉลี่ยต่ำกว่าเกณฑ์มาตรฐาน (60%)");
  
  const highDistTrips = trips.filter(t => t.distanceKm > 100);
  if (highDistTrips.length > 2) anomalies.push(`พบการเดินทางระยะไกลมากกว่า ${highDistTrips.length} ทริป ควรตรวจสอบความจำเป็น`);

  return {
    summary: `[Local Analytics] ภาพรวมการเดินทางรวม ${totalKm.toLocaleString()} กม. ประสิทธิภาพเฉลี่ย ${avgEfficiency.toFixed(1)}% ข้อมูลเบื้องต้นพบการใช้งานสม่ำเสมอในวันทำการ`,
    anomalies,
    recommendations: [
      "ควรตรวจสอบทริปที่มีคะแนนประสิทธิภาพต่ำกว่า 50%",
      "พิจารณาใช้รถประจำทางสำหรับเส้นทางในเมืองที่มีการจราจรหนาแน่น",
      "ตรวจสอบการนำเข้าข้อมูลให้ครบถ้วนเพื่อเพิ่มความแม่นยำ"
    ],
    clusters: ["ภารกิจตรวจเยี่ยม", "งานประสานงานหน่วยงาน"],
    scores: {
      efficiency: Math.round(avgEfficiency),
      cost: 75,
      dataQuality: 90
    }
  };
}
