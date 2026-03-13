import { GoogleGenAI } from "@google/genai";
import { db } from "../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  private async getCachedResponse(message: string): Promise<string | null> {
    if (!db) return null;
    try {
      const normalizedMessage = message.trim().toLowerCase();
      const cacheDocRef = doc(db, 'cached_responses', normalizedMessage);
      const cacheDoc = await getDoc(cacheDocRef);
      if (cacheDoc.exists()) {
        return cacheDoc.data().answer;
      }
    } catch (error) {
      console.error("Error checking cache:", error);
    }
    return null;
  }

  private async setCachedResponse(message: string, answer: string): Promise<void> {
    if (!db) return;
    try {
      const normalizedMessage = message.trim().toLowerCase();
      const cacheDocRef = doc(db, 'cached_responses', normalizedMessage);
      await setDoc(cacheDocRef, { question: normalizedMessage, answer });
    } catch (error) {
      console.error("Error setting cache:", error);
    }
  }

  private async getKnowledgeBaseContext(query: string): Promise<string> {
    try {
      const response = await fetch(`/api/kb?q=${encodeURIComponent(query)}`);
      if (!response.ok) return "";
      const data = await response.json();
      return data.context || "";
    } catch (error) {
      console.error("Error fetching KB context:", error);
      return "";
    }
  }

  async generateTitle(firstMessage: string): Promise<string> {
    const isGreeting = /^(hi|hello|hey|namaste|greetings)[\s\p{P}]*$/iu.test(firstMessage.trim());
    if (isGreeting) {
      return "Welcome to AyurAi";
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a concise, 2-4 word title for an Ayurvedic consultation starting with this message: "${firstMessage}". Return ONLY the title, no quotes, no extra text.`,
      });
      return response.text?.trim() || firstMessage.slice(0, 30) + "...";
    } catch (error) {
      console.error("Error generating title:", error);
      return firstMessage.slice(0, 30) + "...";
    }
  }

  async *chatStream(
    message: string, 
    history: { role: "user" | "model"; content: string }[], 
    mode: 'education' | 'clinical' = 'clinical',
    signal?: AbortSignal
  ) {
    const isGreeting = /^(hi|hello|hey|namaste|greetings)[\s\p{P}]*$/iu.test(message.trim());
    if (history.length === 0 && isGreeting) {
      const greetingResponse = `Namaste. Welcome To AyurAi By AyurLifeCare. 🙏\n\nHere are a few key features of our platform:\n\n*   **Personalized Ayurvedic Consultations:** Get tailored advice based on your unique mind-body constitution (Dosha).\n*   **Symptom Analysis:** Understand the root cause of your imbalances from an Ayurvedic perspective.\n*   **Diet & Lifestyle Recommendations:** Discover the right foods, herbs, and daily routines for optimal health.\n*   **Educational Mode:** Learn about ancient Ayurvedic philosophy, history, and principles.\n*   **Secure & Private:** Your health data is kept confidential and secure.\n\nHow can I assist you on your wellness journey today?`;
      
      const words = greetingResponse.split(' ');
      for (const word of words) {
        if (signal?.aborted) break;
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      return;
    }

    // Check cache
    const cachedAnswer = await this.getCachedResponse(message);
    if (cachedAnswer) {
      yield cachedAnswer;
      return;
    }

    const kbContext = await this.getKnowledgeBaseContext(message);
    
    const baseInstruction = mode === 'education'
      ? `You are AyurAi (Education Mode), a scholarly expert in Ayurveda. Your goal is to teach Ayurvedic concepts, history, philosophy, and principles. 
         Do not provide clinical or medical advice. Explain concepts clearly, step-by-step, and use formatting to make it easy to read.`
      : `You are AyurAi (Clinical Vaidya Mode), a world-class expert in Ayurveda. Your goal is to conduct a thorough Ayurvedic consultation.
         HISTORY TAKING RULES:
         1. Do NOT give immediate recommendations for new complaints. First, act as a doctor and ask the patient for their details to take a proper history (Age, Gender, Chief Complaints, Digestion/Appetite, Sleep patterns, Stress levels, and relevant medical history).
         2. Ask 1-2 questions at a time to keep the conversation natural, like a real Vaidya (doctor).
         3. Once you have enough information to determine their Dosha imbalance (Vikriti), provide a structured analysis.
         4. Finally, provide personalized Diet, Lifestyle, and Herbal recommendations.
         5. Always emphasize that this is informational and they should consult a real-world professional for serious conditions.`;

    const fullSystemInstruction = `${baseInstruction}\n\n${kbContext}\nMaintain a calm, wise, and compassionate tone.`;

    const chat = this.ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: fullSystemInstruction,
      },
      history: history.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))
    });

    const result = await chat.sendMessageStream({
      message: message
    });

    let fullResponse = '';
    for await (const chunk of result) {
      if (signal?.aborted) {
        break;
      }
      fullResponse += chunk.text;
      yield chunk.text;
      // Small delay for slow motion / line-by-line typing effect
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    // Set cache if not aborted
    if (!signal?.aborted && fullResponse) {
      await this.setCachedResponse(message, fullResponse);
    }
  }
}

export const gemini = new GeminiService();
