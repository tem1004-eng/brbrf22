import { Modality } from "@google/genai";
import { getAiClient } from './geminiClient';
import { ApiKeyError } from './bibleService';

// --- Audio Decoding Helpers ---

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const sampleRate = 24000;
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }, // A Korean voice
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    window.dispatchEvent(new CustomEvent('apikey-error'));
    throw new ApiKeyError("음성 생성에 실패했습니다. 서비스에 문제가 있거나 인터넷 연결을 확인해 주세요.");
  }
};

export const generateOriginalLanguageSpeech = async (text: string, language: 'hebrew' | 'greek'): Promise<string | null> => {
  try {
    const ai = getAiClient();
    // Note: Official Hebrew/Greek voices might not be available. 
    // We are prompting the model to pronounce it, which works reasonably well.
    const prompt = language === 'hebrew' 
      ? `Pronounce the following Hebrew word: ${text}`
      : `Pronounce the following Greek word: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          // FIX: The 'prebuiltVoiceConfig' must be nested inside 'voiceConfig'.
          voiceConfig: {
            // Using a voice known for clear pronunciation.
            prebuiltVoiceConfig: { voiceName: "Zephyr" },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (error) {
    console.error(`Error generating ${language} speech:`, error);
    window.dispatchEvent(new CustomEvent('apikey-error'));
    // The WordPopup handles this error by stopping the loading indicator.
    // Throwing here will also trigger the main page error banner.
    throw new ApiKeyError("발음 음성 생성에 실패했습니다.");
  }
};


export const getAudioBuffer = async (base64: string, audioContext: AudioContext): Promise<AudioBuffer | null> => {
    try {
        const decoded = decode(base64);
        return await decodeAudioData(decoded, audioContext);
    } catch(error) {
        console.error("Error creating audio buffer:", error);
        return null;
    }
};