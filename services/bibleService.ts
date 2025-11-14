import { Chapter, Verse } from '../types';
import { Type } from "@google/genai";
import { OLD_TESTAMENT_BOOKS } from '../constants';
import { getAiClient } from './geminiClient';

export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

export interface WordAnalysis {
    originalWord: string;
    pronunciation: string;
    strongsAnalysis: string;
    exampleVerses: {
        reference: string;
        text: string;
    }[];
}

const chapterSchema = {
    type: Type.OBJECT,
    properties: {
        verses: {
            type: Type.ARRAY,
            description: "An array of verse objects for the requested chapter.",
            items: {
                type: Type.OBJECT,
                properties: {
                    verse: {
                        type: Type.INTEGER,
                        description: "The verse number."
                    },
                    text: {
                        type: Type.STRING,
                        description: "The full text of the verse."
                    }
                },
                required: ["verse", "text"]
            }
        }
    },
    required: ["verses"]
};

const wordAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        originalWord: {
            type: Type.STRING,
            description: "The original language (Hebrew or Greek) word."
        },
        pronunciation: {
            type: Type.STRING,
            description: "A simple phonetic pronunciation of the original word in Korean."
        },
        strongsAnalysis: {
            type: Type.STRING,
            description: "A summary of the Strong's Concordance information for the word, including the Strong's number, in Korean."
        },
        exampleVerses: {
            type: Type.ARRAY,
            description: "An array of 5 key Bible verses where this original word is used.",
            items: {
                type: Type.OBJECT,
                properties: {
                    reference: {
                        type: Type.STRING,
                        description: "The Bible reference (e.g., '창세기 1:1')."
                    },
                    text: {
                        type: Type.STRING,
                        description: "The full text of the verse."
                    }
                },
                required: ["reference", "text"]
            }
        }
    },
    required: ["originalWord", "pronunciation", "strongsAnalysis", "exampleVerses"]
}

export const getChapter = async (book: string, chapter: number): Promise<Chapter> => {
    const prompt = `
        Provide all verses for the book "${book}", chapter ${chapter} from the Korean Bible (개역개정 version if possible).
        The response must be a JSON object that strictly follows the provided schema. Do not include any markdown, backticks, or other text outside of the JSON object itself.
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: chapterSchema,
            },
        });

        if (!response.text) {
             console.error("API response is missing text content. Full response:", response);
             throw new Error("API로부터 텍스트 응답을 받지 못했습니다. 안전 설정에 의해 콘텐츠가 차단되었거나, 선택하신 API 키 또는 연결된 결제 계정에 문제가 있을 수 있습니다.");
        }
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        if (parsed.verses && Array.isArray(parsed.verses)) {
             const verses = parsed.verses.map((v: any) => {
                 let verseText = String(v.text || '').trim();
                 if (verseText.startsWith('"') && verseText.endsWith('"')) {
                     verseText = verseText.substring(1, verseText.length - 1);
                 }
                 return {
                    verse: Number(v.verse),
                    text: verseText,
                 };
             });
             return {
                book,
                chapter,
                verses: verses,
            };
        } else {
            console.error("Invalid JSON structure received from API:", parsed);
            throw new ApiKeyError("API로부터 유효하지 않은 형식의 응답을 받았습니다.");
        }

    } catch (error) {
        console.error(`Error fetching chapter data for ${book} ${chapter}:`, error);
        window.dispatchEvent(new CustomEvent('apikey-error'));
        throw new ApiKeyError("성경 본문을 불러오는 중 오류가 발생했습니다. 인터넷 연결을 확인하시거나 잠시 후 다시 시도해 주세요.");
    }
};

export const getWordAnalysis = async (word: string, book: string): Promise<WordAnalysis | null> => {
    const isOldTestament = OLD_TESTAMENT_BOOKS.some(b => b.name === book);
    const originalLanguage = isOldTestament ? "Hebrew" : "Greek";

    const prompt = `
        Analyze the Korean Bible word "${word}" from the book of "${book}".
        1. Find the original ${originalLanguage} word.
        2. Provide its phonetic pronunciation in Korean.
        3. Provide its Strong's Concordance number and a concise analysis of its meaning in Korean.
        4. List 5 most important bible verses that contain this original word.
        
        Provide the response as a JSON object strictly following the schema. Do not include markdown or any other text.
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: wordAnalysisSchema
            }
        });
        
        if (!response.text) {
             console.error("Word analysis API response is missing text content. Full response:", response);
             throw new Error("단어 분석 정보를 받지 못했습니다. 안전 설정 또는 API 키 문제를 확인해주세요.");
        }
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as WordAnalysis;
    } catch (error) {
        console.error(`Error fetching word analysis for "${word}":`, error);
        // The popup will show its own error message when analysis is null.
        // No need to throw or dispatch a global error for this non-critical feature.
        return null;
    }
};