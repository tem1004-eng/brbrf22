import { GoogleGenAI } from "@google/genai";

/**
 * Initializes and returns a new instance of the GoogleGenAI client.
 * The API key is hardcoded as requested.
 */
export const getAiClient = (): GoogleGenAI => {
    // Per the user's request, the API key is hardcoded here.
    const apiKey = "AIzaSyCOPUIlujRAv2Q44SqFl8zvctxuGwmOUEQ";

    if (!apiKey) {
        // This check is unlikely to fail with a hardcoded key but kept as a safeguard.
        throw new Error("API 키가 설정되지 않았습니다.");
    }

    return new GoogleGenAI({ apiKey });
};
