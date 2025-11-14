import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WordAnalysis, ApiKeyError } from '../services/bibleService';
import { generateOriginalLanguageSpeech, getAudioBuffer } from '../services/geminiService';

interface WordPopupProps {
    word: string;
    analysis: WordAnalysis | null;
    isLoading: boolean;
    position: { top: number; left: number };
    language: 'hebrew' | 'greek';
    onClose: () => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <svg className="animate-spin h-8 w-8 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const SpeakerIcon: React.FC<{isSpeaking: boolean}> = ({ isSpeaking }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isSpeaking ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);


const WordPopup: React.FC<WordPopupProps> = ({ word, analysis, isLoading, position, language, onClose }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
            }
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    

    const handlePlayPronunciation = useCallback(async () => {
        if (!analysis?.originalWord || isSpeaking || !audioContextRef.current) return;
        setIsSpeaking(true);
        try {
            const base64Audio = await generateOriginalLanguageSpeech(analysis.originalWord, language);
            if (base64Audio && audioContextRef.current) {
                const audioBuffer = await getAudioBuffer(base64Audio, audioContextRef.current);
                if (audioBuffer) {
                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(audioContextRef.current.destination);
                    source.onended = () => setIsSpeaking(false);
                    source.start();
                } else {
                     setIsSpeaking(false);
                }
            } else {
                setIsSpeaking(false);
            }
        } catch (error) {
            if (!(error instanceof ApiKeyError)) {
              console.error("Error generating pronunciation audio:", error);
            }
            setIsSpeaking(false);
        }
    }, [analysis, isSpeaking, language]);

    const popupStyle: React.CSSProperties = {
        position: 'absolute',
        top: `${position.top + 10}px`, // Add some offset
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 50,
    };

    return (
        <div ref={popupRef} style={popupStyle} className="w-96 max-w-md bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-4 animate-fade-in-up">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-slate-200">{word}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {isLoading ? (
                <LoadingSpinner />
            ) : analysis ? (
                <div className="space-y-4 text-sm text-slate-300 max-h-96 overflow-y-auto pr-2">
                    <div className="p-3 bg-slate-700/50 rounded-md">
                        <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-xs mb-1">
                            {language === 'hebrew' ? '히브리어' : '헬라어'}
                        </h4>
                        <div className="flex items-center justify-between">
                             <div className="flex items-center">
                                <p className={`text-xl font-serif ${language === 'hebrew' ? 'rtl' : 'ltr'}`}>{analysis.originalWord}</p>
                                <p className="text-slate-400 ml-3">({analysis.pronunciation})</p>
                             </div>
                            <button onClick={handlePlayPronunciation} disabled={isSpeaking} className="p-2 rounded-full hover:bg-slate-600 transition-colors">
                                <SpeakerIcon isSpeaking={isSpeaking} />
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-xs mb-1">스트롱 코드 분석</h4>
                        <p className="text-base leading-relaxed whitespace-pre-wrap">{analysis.strongsAnalysis}</p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-xs mb-2">주요 관련 구절</h4>
                        <ul className="space-y-2">
                            {analysis.exampleVerses.map((verse, index) => (
                                <li key={index} className="border-l-2 border-slate-600 pl-3">
                                    <p className="font-semibold text-slate-200">{verse.reference}</p>
                                    <p className="text-slate-400">{verse.text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <p className="text-center text-slate-500">단어 정보를 불러오는 데 실패했습니다.</p>
            )}
        </div>
    );
};

export default WordPopup;
