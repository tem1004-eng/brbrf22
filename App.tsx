import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Chapter, Verse } from './types';
import { getChapter, ApiKeyError } from './services/bibleService';
import { generateSpeech, getAudioBuffer } from './services/geminiService';
import Sidebar from './components/Sidebar';
import Content from './components/Content';
import Header from './components/Header';
import ReadingTracker from './components/ReadingTracker';
import Player from './components/Player';
import { OLD_TESTAMENT_BOOKS, NEW_TESTAMENT_BOOKS } from './constants';

const ALL_BOOKS = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];

const App: React.FC = () => {
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const [selectedBook, setSelectedBook] = useState<string>('창세기');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [isLoadingText, setIsLoadingText] = useState<boolean>(true);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);

  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [readStatus, setReadStatus] = useState<Record<string, boolean[]>>({});
  
  const [playbackStartIndex, setPlaybackStartIndex] = useState<number>(1);
  const [isReadingMode, setIsReadingMode] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);


  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const verseQueueRef = useRef<Verse[]>([]);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioGenerationControllerRef = useRef<{ isCancelled: boolean }>({ isCancelled: true });
  const autoPlayOnLoadRef = useRef<boolean>(false);

  const handlePlaybackRateChange = useCallback((newRate: number) => {
    setPlaybackRate(newRate);
    if (currentSourceRef.current) {
        currentSourceRef.current.playbackRate.value = newRate;
    }
  }, []);
  
  const handleApiErrorEvent = useCallback((event?: CustomEvent) => {
      const message = event instanceof ApiKeyError ? event.message : "API 키가 유효하지 않거나 요청이 거부되었습니다. 키에 연결된 프로젝트의 결제 계정 설정을 확인 후 다시 시도해주세요.";
      setApiKeyError(message);
  }, []);


  useEffect(() => {
    window.addEventListener('apikey-error', handleApiErrorEvent as EventListener);
    return () => {
        window.removeEventListener('apikey-error', handleApiErrorEvent as EventListener);
    };
  }, [handleApiErrorEvent]);

  const stopAudioPlayback = useCallback(() => {
    audioGenerationControllerRef.current.isCancelled = true;
    if (currentSourceRef.current) {
      currentSourceRef.current.onended = null;
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    audioQueueRef.current = [];
    verseQueueRef.current = [];
    setCurrentVerse(null);
    setIsPlaying(false);
    setIsLoadingAudio(false);
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const fetchChapterData = useCallback(async (book: string, chapter: number) => {
    stopAudioPlayback();
    setIsLoadingText(true);
    setChapterData(null);
    setPlaybackStartIndex(1);
    setApiKeyError(null); // Clear previous errors before a new request
    
    try {
      const data = await getChapter(book, chapter);
      setChapterData(data);
    } catch (error) {
      console.error(`Failed to fetch chapter data for ${book} ${chapter}:`, error);
      if (error instanceof ApiKeyError) {
          setApiKeyError(error.message);
      } else if (error instanceof Error) {
          setApiKeyError(error.message); // Display specific error from getAiClient
      }
      else {
          setApiKeyError("알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSelectedBook(book);
      setSelectedChapter(chapter);
      setIsLoadingText(false);
    }
  }, [stopAudioPlayback]);

  const toggleReadStatus = useCallback((book: string, chapter: number, totalChapters: number) => {
    setReadStatus(prevStatus => {
      const newStatus = { ...prevStatus };
      if (!newStatus[book]) {
        newStatus[book] = Array(totalChapters).fill(false);
      }
      newStatus[book][chapter - 1] = !newStatus[book][chapter - 1];
      
      try {
        localStorage.setItem('bibleReadStatus', JSON.stringify(newStatus));
      } catch (error) {
        console.error("Failed to save read status to localStorage", error);
      }
      return newStatus;
    });
  }, []);
  
  const handleNextChapter = useCallback(() => {
    if (!chapterData) return;

    const currentBookName = chapterData.book;
    const currentChapterNumber = chapterData.chapter;

    const currentBookMeta = ALL_BOOKS.find(b => b.name === currentBookName);
    if (!currentBookMeta) return;

    if (!readStatus[currentBookName] || !readStatus[currentBookName][currentChapterNumber - 1]) {
      toggleReadStatus(currentBookName, currentChapterNumber, currentBookMeta.chapters);
    }

    if (currentChapterNumber < currentBookMeta.chapters) {
        fetchChapterData(currentBookName, currentChapterNumber + 1);
    } else {
        const currentBookIndex = ALL_BOOKS.findIndex(b => b.name === currentBookName);
        if (currentBookIndex < ALL_BOOKS.length - 1) {
            const nextBook = ALL_BOOKS[currentBookIndex + 1];
            fetchChapterData(nextBook.name, 1);
        } else {
            // This is the last chapter of the bible, do nothing.
        }
    }
  }, [chapterData, fetchChapterData, readStatus, toggleReadStatus]);
  
  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length > 0) {
      setIsPlaying(true);
      const audioBuffer = audioQueueRef.current.shift();
      const verse = verseQueueRef.current.shift();

      if (audioBuffer && verse && audioContextRef.current) {
        setCurrentVerse(verse.verse);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = playbackRate;
        source.connect(audioContextRef.current.destination);
        source.onended = playNextInQueue;
        source.start();
        currentSourceRef.current = source;
      } else {
          playNextInQueue();
      }
      return;
    }

    if (!audioGenerationControllerRef.current.isCancelled) {
      setCurrentVerse(null);
      const checkAgain = () => {
          if (audioQueueRef.current.length > 0) {
              playNextInQueue();
          } else if (!audioGenerationControllerRef.current.isCancelled) {
              setTimeout(checkAgain, 200);
          } else {
              playNextInQueue();
          }
      };
      checkAgain();
      return;
    }

    setIsPlaying(false);
    setCurrentVerse(null);
    setPlaybackStartIndex(1);

  }, [playbackRate]);

  useEffect(() => {
    fetchChapterData('창세기', 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem('bibleReadStatus');
      if (savedStatus) {
        setReadStatus(JSON.parse(savedStatus));
      }
    } catch (error) {
      console.error("Failed to load read status from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser", e);
        }
    }
  }, []);

  const handleStop = useCallback(() => {
    if (currentVerse) {
        setPlaybackStartIndex(currentVerse);
    }
    stopAudioPlayback();
    setIsReadingMode(false);
  }, [currentVerse, stopAudioPlayback]);

  const handlePause = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
    }
    setIsPlaying(false);
  }, []);
  
  const handlePlay = useCallback(async () => {
    if (!chapterData || !audioContextRef.current) return;

    if (isPlaying) {
      handlePause();
      return;
    }
    
    setIsReadingMode(true);

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
      setIsPlaying(true);
      return;
    }

    if (!audioGenerationControllerRef.current.isCancelled) {
        setIsLoadingAudio(true);
        return;
    }

    setIsLoadingAudio(true);
    audioGenerationControllerRef.current = { isCancelled: false };
    
    audioQueueRef.current = [];
    verseQueueRef.current = [];
    
    const allVerses = chapterData?.verses || [];
    const startIndex = allVerses.findIndex(v => v.verse === playbackStartIndex);
    const versesToPlay = allVerses.slice(startIndex >= 0 ? startIndex : 0);


    let playbackStarted = false;
    const startPlaybackIfNeeded = () => {
        if (!playbackStarted && audioQueueRef.current.length > 0) {
            playbackStarted = true;
            setIsLoadingAudio(false);
            playNextInQueue();
        }
    };

    (async () => {
        for (const verse of versesToPlay) {
            if (audioGenerationControllerRef.current.isCancelled) break;
            if (!verse.text.trim()) continue;
            try {
                const base64Audio = await generateSpeech(verse.text);
                if (audioGenerationControllerRef.current.isCancelled || !base64Audio || !audioContextRef.current) continue;
                
                const audioBuffer = await getAudioBuffer(base64Audio, audioContextRef.current);
                if (audioGenerationControllerRef.current.isCancelled || !audioBuffer) continue;

                audioQueueRef.current.push(audioBuffer);
                verseQueueRef.current.push(verse);
                startPlaybackIfNeeded();

            } catch (error) {
                if (!(error instanceof ApiKeyError)) {
                    console.error(`Error generating audio for ${chapterData.book} ${chapterData.chapter}:${verse.verse}`, error);
                }
                handleStop();
                break;
            }
        }
        audioGenerationControllerRef.current.isCancelled = true;
        
        if (!playbackStarted) {
            setIsLoadingAudio(false);
            setIsPlaying(false);
        }
    })();

  }, [chapterData, isPlaying, playNextInQueue, handlePause, handleStop, playbackStartIndex]);
  
  useEffect(() => {
    if (autoPlayOnLoadRef.current && chapterData && !isLoadingText) {
        autoPlayOnLoadRef.current = false;
        handlePlay();
    }
  }, [chapterData, isLoadingText, handlePlay]);


  const isLastChapterOfBible = useMemo(() => {
    if (!chapterData) return false;
    const lastBook = ALL_BOOKS[ALL_BOOKS.length - 1];
    return chapterData.book === lastBook.name && chapterData.chapter === lastBook.chapters;
  }, [chapterData]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 font-sans">
      {!isReadingMode && (
        <Header 
          onToggleTracker={() => setIsTrackerOpen(true)}
          playbackRate={playbackRate}
          onPlaybackRateChange={handlePlaybackRateChange}
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        {!isReadingMode && (
          <Sidebar onSelectChapter={fetchChapterData} selectedBook={selectedBook} selectedChapter={selectedChapter} />
        )}
        <main className="flex-1 flex flex-col overflow-hidden pb-28">
          <Content
            chapterData={chapterData}
            currentVerse={currentVerse}
            isLoading={isLoadingText}
            error={apiKeyError}
          />
        </main>
      </div>
      {isTrackerOpen && (
        <ReadingTracker 
            onClose={() => setIsTrackerOpen(false)}
            readStatus={readStatus}
            toggleReadStatus={toggleReadStatus}
        />
      )}
      {chapterData && !isLoadingText && (
         <Player
            onPlay={handlePlay}
            onStop={handleStop}
            isPlaying={isPlaying}
            isLoading={isLoadingAudio}
            onNextChapter={handleNextChapter}
            isLastChapter={isLastChapterOfBible}
        />
      )}
    </div>
  );
};

export default App;
