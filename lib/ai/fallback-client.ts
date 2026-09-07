import { GoogleGenerativeAI } from '@google/generative-ai';

// Konfigurasi API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DAHL_API_KEY = process.env.DAHL_API_KEY || '';
const DAHL_BASE_URL = process.env.DAHL_BASE_URL || 'https://api.dahl.tg/v1'; // Sesuaikan dengan base url Dahl
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest'
];

interface FallbackResponse {
  success: boolean;
  content?: string;
  provider?: string;
  model?: string;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

/**
 * Memanggil API yang kompatibel dengan format OpenAI (seperti Dahl atau Grok)
 */
async function callOpenAICompatible(
  apiKey: string, 
  baseUrl: string, 
  modelName: string, 
  systemPrompt: string, 
  userPrompt: string, 
  responseFormat: 'text' | 'json',
  history?: ChatMessage[]
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  
  const messages: any[] = [{ role: 'system', content: systemPrompt }];
  
  if (history && history.length > 0) {
    history.forEach(msg => {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
      });
    });
  }
  
  messages.push({ role: 'user', content: userPrompt });

  const payload: any = {
    model: modelName,
    messages: messages,
    temperature: 0.7,
  };

  // Beberapa provider mungkin tidak mendukung response_format type json_object secara langsung
  // Jadi kita sertakan juga di dalam system prompt
  if (responseFormat === 'json') {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (data.choices && data.choices.length > 0) {
    return data.choices[0].message.content;
  }
  
  throw new Error('Respons tidak valid dari API OpenAI-compatible');
}

/**
 * Core AI Router yang menangani Fallback: Gemini -> Dahl -> Groq
 */
export async function generateContentWithFallback(
  systemPrompt: string,
  userPrompt: string,
  responseFormat: 'text' | 'json' = 'text',
  history?: ChatMessage[]
): Promise<FallbackResponse> {
  
  let lastError = '';

  // 1. Coba Google Gemini (Prioritas Utama)
  if (GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    for (const currentModel of GEMINI_MODELS) {
      try {
        console.log(`[AI ROUTER] Mencoba Gemini API (${currentModel})...`);
        const model = genAI.getGenerativeModel({ 
          model: currentModel,
          systemInstruction: systemPrompt,
          generationConfig: {
            responseMimeType: responseFormat === 'json' ? "application/json" : "text/plain",
          }
        });

        let aiContent = "";
        
        if (history && history.length > 0) {
          const geminiHistory = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: msg.content }]
          }));
          const chat = model.startChat({ history: geminiHistory });
          const result = await chat.sendMessage(userPrompt);
          aiContent = result.response.text();
        } else {
          const result = await model.generateContent(userPrompt);
          aiContent = result.response.text();
        }
        
        if (aiContent) {
          console.log(`[AI ROUTER] ✅ Sukses dengan Gemini (${currentModel})`);
          return { success: true, content: aiContent, provider: 'Google Gemini', model: currentModel };
        }
      } catch (err: any) {
        console.warn(`[AI ROUTER] ⚠️ Gemini Error (${currentModel}):`, err.message);
        lastError = err.message;
        
        // Lanjut ke model gemini berikutnya jika server overloaded/not found
        if (err.message.includes('503') || err.message.includes('429') || err.message.includes('not found')) {
          continue;
        }
        break; // Jika error lain (seperti API key invalid), keluar dari loop Gemini
      }
    }
  }

  // 2. Coba Dahl (Prioritas Kedua / Fallback 1)
  if (DAHL_API_KEY) {
    try {
      console.log(`[AI ROUTER] 🔄 Mengalihkan ke Dahl API...`);
      // Kita asumsikan Dahl mendukung model gpt-4o-mini (bisa diganti sesuai dashboard Dahl)
      const dahlModel = 'gpt-4o-mini'; 
      
      const aiContent = await callOpenAICompatible(
        DAHL_API_KEY, 
        DAHL_BASE_URL, 
        dahlModel, 
        systemPrompt, 
        userPrompt, 
        responseFormat,
        history
      );
      
      console.log(`[AI ROUTER] ✅ Sukses dengan Dahl API (${dahlModel})`);
      return { success: true, content: aiContent, provider: 'Dahl', model: dahlModel };
    } catch (err: any) {
      console.error(`[AI ROUTER] ❌ Dahl Error:`, err.message);
      lastError = err.message;
    }
  } else {
    console.log(`[AI ROUTER] ⏭️ Lewati Dahl (DAHL_API_KEY tidak dikonfigurasi)`);
  }

  // 3. Coba Groq (Prioritas Ketiga / Fallback 2)
  if (GROQ_API_KEY) {
    try {
      console.log(`[AI ROUTER] 🔄 Mengalihkan ke Groq API...`);
      const groqModel = 'llama-3.1-8b-instant'; // Model Groq yang sangat cepat
      
      const aiContent = await callOpenAICompatible(
        GROQ_API_KEY, 
        GROQ_BASE_URL, 
        groqModel, 
        systemPrompt, 
        userPrompt, 
        responseFormat,
        history
      );
      
      console.log(`[AI ROUTER] ✅ Sukses dengan Groq API (${groqModel})`);
      return { success: true, content: aiContent, provider: 'Groq', model: groqModel };
    } catch (err: any) {
      console.error(`[AI ROUTER] ❌ Groq Error:`, err.message);
      lastError = err.message;
    }
  } else {
    console.log(`[AI ROUTER] ⏭️ Lewati Groq (GROQ_API_KEY tidak dikonfigurasi)`);
  }

  // Jika semua gagal
  console.error(`[AI ROUTER] 💥 Semua penyedia AI gagal. Error terakhir: ${lastError}`);
  return { 
    success: false, 
    error: `Layanan AI sedang gangguan (Fallback exhausted). Error terakhir: ${lastError}` 
  };
}
