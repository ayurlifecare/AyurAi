import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { db } from "../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export class GeminiService {
  private ai: GoogleGenAI;
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || "" });

    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      this.openai = new OpenAI({ apiKey: openAiKey, dangerouslyAllowBrowser: true });
    }
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

  async generateTitle(firstMessage: string, language: string = 'English'): Promise<string> {
    const isGreeting = /^(hi|hello|hey|namaste|greetings)[\s\p{P}]*$/iu.test(firstMessage.trim());
    if (isGreeting) {
      return language === 'English' ? "Welcome to AyurAi" : "स्वागत है";
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a concise, 2-4 word title in ${language} for an Ayurvedic consultation starting with this message: "${firstMessage}". Return ONLY the title, no quotes, no extra text.`,
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
    language: string = 'English',
    signal?: AbortSignal
  ) {
    const isGreeting = /^(hi|hello|hey|namaste|greetings)[\s\p{P}]*$/iu.test(message.trim());
    if (history.length === 0 && isGreeting) {
      const greetingResponse = language === 'English' 
        ? `Namaste. Welcome To AyurAi By AyurLifeCare. 🙏\n\nHere are a few key features of our platform:\n\n*   **Personalized Ayurvedic Consultations:** Get tailored advice based on your unique mind-body constitution (Dosha).\n*   **Symptom Analysis:** Understand the root cause of your imbalances from an Ayurvedic perspective.\n*   **Diet & Lifestyle Recommendations:** Discover the right foods, herbs, and daily routines for optimal health.\n*   **Educational Mode:** Learn about ancient Ayurvedic philosophy, history, and principles.\n*   **Secure & Private:** Your health data is kept confidential and secure.\n\nHow can I assist you on your wellness journey today?`
        : `नमस्ते। AyurLifeCare द्वारा AyurAi में आपका स्वागत है। 🙏\n\nयहाँ हमारे प्लेटफॉर्म की कुछ प्रमुख विशेषताएं दी गई हैं:\n\n*   **व्यक्तिगत आयुर्वेदिक परामर्श:** अपनी अनूठी मन-शरीर प्रकृति (दोष) के आधार पर अनुकूलित सलाह प्राप्त करें।\n*   **लक्षण विश्लेषण:** आयुर्वेदिक दृष्टिकोण से अपने असंतुलन के मूल कारण को समझें।\n*   **आहार और जीवनशैली सिफारिशें:** इष्टतम स्वास्थ्य के लिए सही खाद्य पदार्थ, जड़ी-बूटियाँ और दैनिक दिनचर्या खोजें।\n*   **शैक्षिक मोड:** प्राचीन आयुर्वेदिक दर्शन, इतिहास और सिद्धांतों के बारे में जानें।\n*   **सुरक्षित और निजी:** आपका स्वास्थ्य डेटा गोपनीय और सुरक्षित रखा जाता है।\n\nआज मैं आपकी कल्याण यात्रा में आपकी कैसे सहायता कर सकता हूँ?`;
      
      const words = greetingResponse.split(' ');
      for (const word of words) {
        if (signal?.aborted) break;
        yield word + ' ';
      }
      return;
    }

    // Check cache with language key
    const cacheKey = `${language}:${message}`;
    const cachedAnswer = await this.getCachedResponse(cacheKey);
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

    const languageInstruction = `CRITICAL: You MUST provide the entire response in ${language}. 
       However, if you include any Ayurvedic Shlokas or verses, they MUST be in their original Sanskrit (written in Devanagari script if applicable), followed by the translation in ${language}. 
       All other explanations, questions, and advice MUST be in ${language}.`;

    const fullSystemInstruction = `${baseInstruction}\n\n${languageInstruction}\n\n${kbContext}\nMaintain a calm, wise, and compassionate tone.`;

    const models = ["gemini-3-flash-preview", "gemini-3.1-pro-preview"];
    let lastError = null;

    for (const modelName of models) {
      try {
        const chat = this.ai.chats.create({
          model: modelName,
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
          const text = chunk.text || '';
          if (text) {
            fullResponse += text;
            yield text;
          }
        }
        
        // Set cache if not aborted
        if (!signal?.aborted && fullResponse) {
          await this.setCachedResponse(message, fullResponse);
        }
        
        return; // Success, exit the loop
      } catch (error) {
        console.error(`Error with model ${modelName}:`, error);
        lastError = error;
        // Continue to next model if this one failed
      }
    }

    // If we get here, all Gemini models failed
    if (this.openai) {
      try {
        console.log("Falling back to OpenAI...");
        const stream = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: fullSystemInstruction },
            ...history.map(m => ({ 
              role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user", 
              content: m.content 
            })),
            { role: "user", content: message }
          ],
          stream: true,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          if (signal?.aborted) {
            break;
          }
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            yield content;
          }
        }
        
        // Set cache if not aborted
        if (!signal?.aborted && fullResponse) {
          await this.setCachedResponse(message, fullResponse);
        }
        
        return; // Success, exit
      } catch (openaiError) {
        console.error("OpenAI fallback error:", openaiError);
        lastError = openaiError;
      }
    }

    if (lastError) {
      throw lastError;
    }
  }
}

export const gemini = new GeminiService();
