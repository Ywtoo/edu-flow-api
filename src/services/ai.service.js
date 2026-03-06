import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateQuiz = async (lessonContent) => {
    const model = genAI.getModel("gemini-2.5-flash-lite");

    const prompt = `
        Você é um professor criando um quiz de múltipla escolha. 
        Com base no conteúdo abaixo, crie 3 perguntas.
        Retorne APENAS um JSON no formato:
        [
            {
                "question": "pergunta?",
                "options": ["a", "b", "c", "d"],
                "answer": "a"
            }
        ]
        Conteúdo: ${lessonContent}
    `;

    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.text);

    const cleanJson = response.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
};