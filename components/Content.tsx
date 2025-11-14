import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chapter } from '../types';
import { getWordAnalysis, WordAnalysis, ApiKeyError } from '../services/bibleService';
import WordPopup from './WordPopup';
import { OLD_TESTAMENT_BOOKS } from '../constants';

interface ContentProps {
  chapterData: Chapter | null;
  currentVerse: number | null;
  isLoading: boolean;
  error: string | null;
}

const Content: React.FC<ContentProps> = ({ chapterData, currentVerse, isLoading, error }) => {
  const verseRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [popupData, setPopupData] = useState<{ word: string, analysis: WordAnalysis | null, position: { top: number, left: number }, bookName: string } | null>(null);
  const [isPopupLoading, setIsPopupLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentVerse !== null && verseRefs.current[currentVerse]) {
      verseRefs.current[currentVerse]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentVerse]);

  // Close popup when chapter changes
  useEffect(() => {
    setPopupData(null);
  }, [chapterData]);

  const handleWordClick = useCallback(async (event: React.MouseEvent<HTMLSpanElement>, word: string) => {
    if (!chapterData || chapterData.verses.some(v => v.text.includes('[오류]'))) return;
    // Clean the word from punctuation
    const cleanedWord = word.replace(/[.,;:'"?!]/g, '');
    if (!cleanedWord) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const contentRect = contentRef.current?.getBoundingClientRect();

    if(!contentRect) return;

    setPopupData({
      word: cleanedWord,
      analysis: null,
      position: {
        top: rect.bottom - contentRect.top,
        left: rect.left - contentRect.left + rect.width / 2,
      },
      bookName: chapterData.book,
    });
    setIsPopupLoading(true);

    try {
        const analysis = await getWordAnalysis(cleanedWord, chapterData.book);
        setPopupData(prevData => {
            if(prevData && prevData.word === cleanedWord) {
                return { ...prevData, analysis };
            }
            return prevData;
        });
    } catch(error) {
        if (!(error instanceof ApiKeyError)) {
          console.error(`Error fetching word analysis for "${cleanedWord}":`, error);
        }
        setPopupData(null); // Close popup on error
    } finally {
      setIsPopupLoading(false);
    }
  }, [chapterData]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
        <div className="text-center p-8 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-lg mx-auto text-slate-300">
          <h2 className="text-2xl font-bold text-red-400 mb-4">오류가 발생했습니다</h2>
          <p className="mb-6">{error}</p>
          <div className="bg-slate-900/50 border border-slate-600 px-4 py-3 rounded-md text-left text-sm">
            <p className="font-bold mb-2">문제 해결 방법:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>인터넷 연결을 확인해 주세요.</li>
              <li>잠시 후 다시 시도해 주세요.</li>
              <li>문제가 계속되면 서비스에 일시적인 문제가 있을 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
        <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-slate-300 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg text-slate-400">본문을 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500 bg-slate-900">
        왼쪽 메뉴에서 성경과 장을 선택해주세요.
      </div>
    );
  }

  const isOldTestament = OLD_TESTAMENT_BOOKS.some(b => b.name === chapterData.book);

  return (
    <div ref={contentRef} className="flex-1 overflow-y-auto bg-slate-900 p-4 sm:p-6 md:p-10 relative">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-serif font-bold text-slate-200 mb-8 border-b-2 border-slate-700 pb-4">
          {chapterData.book} {chapterData.chapter}장
        </h2>
        <div className="text-2xl leading-relaxed space-y-4 font-serif text-slate-300">
          {chapterData.verses.map((verse, index) => {
            const isCurrent = verse.verse === currentVerse;
            return (
              <p
                key={index}
                ref={(el) => (verseRefs.current[verse.verse] = el)}
                className={`transition-all duration-300 rounded-md p-2 ${
                  isCurrent ? 'bg-yellow-200 text-yellow-900 font-bold' : ''
                }`}
              >
                <span className={`font-semibold pr-2 transition-colors duration-300 ${isCurrent ? 'text-yellow-700' : 'text-slate-400'}`}>{verse.verse}</span>
                {verse.text.split(/(\s+)/).map((word, i) => (
                   word.trim().length > 0 ? (
                      <span key={i} className={`cursor-pointer rounded ${isCurrent ? 'hover:bg-yellow-300/50' : 'hover:bg-slate-800'}`} onClick={(e) => handleWordClick(e, word)}>{word}</span>
                   ) : (
                      <span key={i}>{word}</span>
                   )
                ))}
              </p>
            );
          })}
        </div>
      </div>
      {popupData && (
          <WordPopup 
            word={popupData.word}
            analysis={popupData.analysis}
            isLoading={isPopupLoading}
            position={popupData.position}
            language={isOldTestament ? 'hebrew' : 'greek'}
            onClose={() => setPopupData(null)}
          />
      )}
    </div>
  );
};

export default Content;