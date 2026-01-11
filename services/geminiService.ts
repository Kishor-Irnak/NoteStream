import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, ChatMessage, NoteItem } from "../types";

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (ai) return ai;
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    throw new Error(
      "API Key not found. Please ensure GEMINI_API_KEY is set in your .env file or environment variables."
    );
  }
  ai = new GoogleGenAI({ apiKey });
  return ai;
};

const modelName = "gemini-1.5-flash";

// Helper to get schema
const getAnalysisSchema = (): Schema => {
  const memoryMapSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      label: {
        type: Type.STRING,
        description: "The central concept or root node.",
      },
      children: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING, description: "Main topic." },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { label: { type: Type.STRING } },
                required: ["label"],
              },
            },
          },
          required: ["label", "children"],
        },
      },
    },
    required: ["label", "children"],
  };

  return {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "A concise executive summary.",
      },
      sources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            relevance: { type: Type.NUMBER },
          },
          required: ["title", "description", "relevance"],
        },
      },
      roadmap: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.STRING },
            description: { type: Type.STRING },
            estimatedTime: { type: Type.STRING },
          },
          required: ["step", "description", "estimatedTime"],
        },
      },
      memoryMap: memoryMapSchema,
      stats: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            complexity: { type: Type.NUMBER },
            importance: { type: Type.NUMBER },
          },
          required: ["topic", "complexity", "importance"],
        },
      },
      suggestedQuestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "3-4 specific questions a user might ask about this document.",
      },
    },
    required: [
      "summary",
      "sources",
      "roadmap",
      "memoryMap",
      "stats",
      "suggestedQuestions",
    ],
  };
};

const processFile = async (
  base64Data: string,
  mimeType: string
): Promise<AnalysisResult> => {
  try {
    const result = await getAI().models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          {
            text: `Analyze this document completely. 
            1. Create a summary. 
            2. Identify sources. 
            3. Create a hierarchical memory map. 
            4. Generate 4 insightful follow-up questions for the user to ask.
            Return JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: getAnalysisSchema(),
      },
    });

    if (result.text) {
      return JSON.parse(result.text) as AnalysisResult;
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

const chatWithDocument = async (
  base64Data: string,
  mimeType: string,
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  try {
    // Construct history for context
    const chatHistory = history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const result = await getAI().models.generateContent({
      model: modelName,
      contents: [
        // System/Context prompt with the file
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            {
              text: "You are a helpful study assistant. Answer the user's questions based strictly on the provided document.",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Understood. I will answer based on the document provided.",
            },
          ],
        },
        ...chatHistory,
        {
          role: "user",
          parts: [{ text: newMessage }],
        },
      ],
    });

    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};

const generateNote = async (
  base64Data: string,
  mimeType: string,
  noteType: string
): Promise<NoteItem> => {
  try {
    let prompt = "";
    switch (noteType) {
      case "FAQ":
        prompt =
          "Generate a list of 5 Frequently Asked Questions and answers based on this document.";
        break;
      case "Briefing Doc":
        prompt =
          "Create a professional Briefing Document summarizing the key points, stakeholders, and conclusions.";
        break;
      case "Timeline":
        prompt =
          "Extract a chronological timeline of events or steps from the document.";
        break;
      case "Study Guide":
        prompt =
          "Create a structured study guide with key terms, definitions, and concepts to memorize.";
        break;
      default:
        prompt = `Generate a ${noteType} based on this document.`;
    }

    const result = await getAI().models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
    });

    return {
      id: Date.now().toString(),
      type: noteType as any,
      title: `${noteType} - Generated`,
      content: result.text || "No content generated.",
      date: new Date(),
    };
  } catch (error) {
    console.error("Note Generation Error:", error);
    throw error;
  }
};

export const GeminiService = {
  processFile,
  chatWithDocument,
  generateNote,
};
