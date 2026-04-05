import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY is missing in .env")
}

const genAI = new GoogleGenerativeAI(API_KEY || '')

export const getGeminiModel = (modelName: string = "gemini-2.5-pro") => {
  return genAI.getGenerativeModel({ model: modelName })
}

export const analyzeScreen = async (screenshotBase64: string, prompt: string) => {
  const model = getGeminiModel()
  const result = await model.generateContentStream([
    prompt,
    {
      inlineData: {
        data: screenshotBase64,
        mimeType: "image/png"
      }
    }
  ])
  return result
}

export const startGeminiChat = (history: any[]) => {
  const model = getGeminiModel()
  return model.startChat({ history })
}
