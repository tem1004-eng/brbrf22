import React, { useMemo } from 'react';
import { OLD_TESTAMENT_BOOKS, NEW_TESTAMENT_BOOKS } from '../constants';
import { Book } from '../types';

interface ReadingTrackerProps {
  onClose: () => void;
  readStatus: Record<string, boolean[]>;
  toggleReadStatus: (book: string, chapter: number, totalChapters: number) => void;
}

const ALL_BOOKS = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];
const TOTAL_CHAPTERS = ALL_BOOKS.reduce((sum, book) => sum + book.chapters, 0);

const BookProgress: React.FC<{
    book: Book;
    readStatus: boolean[] | undefined;
    onToggle: (chapter: number) => void;
}> = ({ book, readStatus, onToggle }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const readCount = readStatus?.filter(Boolean).length || 0;
    const isCompleted = readCount === book.chapters;

    return (
        <div className="border-b border-slate-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left p-3 flex justify-between items-center hover:bg-slate-800 transition-colors"
            >
                <div className="flex items-center">
                    <span className={`font-semibold ${isCompleted ? 'text-blue-400' : 'text-slate-200'}`}>{book.name}</span>
                    <span className="text-sm text-slate-400 ml-3">{readCount} / {book.chapters}</span>
                </div>
                 <svg className={`w-5 h-5 transform transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                 <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 p-3 bg-slate-900/50">
                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => (
                        <button
                            key={chapter}
                            onClick={() => onToggle(chapter)}
                            className={`p-2 rounded-md text-center text-sm transition-all duration-200 border ${
                                readStatus?.[chapter - 1] 
                                ? 'bg-blue-600 text-white font-bold border-blue-600' 
                                : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'
                            }`}
                        >
                            {chapter}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

const ReadingTracker: React.FC<ReadingTrackerProps> = ({ onClose, readStatus, toggleReadStatus }) => {
    
    const totalReadCount = useMemo(() => {
        // Fix: Explicitly typing the `reduce` parameters prevents a TypeScript error
        // where the accumulator `total` was inferred as `unknown`.
        return Object.values(readStatus).reduce((total: number, chapters: boolean[]) => {
            return total + chapters.filter(Boolean).length;
        }, 0);
    }, [readStatus]);

    const progressPercentage = TOTAL_CHAPTERS > 0 ? (totalReadCount / TOTAL_CHAPTERS) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" onClick={onClose}>
      <div 
        className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
          <h2 className="text-2xl font-bold text-slate-200">성경 통독표</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-4 space-y-2 border-b border-slate-700">
            <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                <span>진행률</span>
                <span>{totalReadCount} / {TOTAL_CHAPTERS} 장</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <section>
                    <h3 className="text-xl font-semibold p-3 bg-slate-800 text-slate-200 sticky top-0">구약 ({OLD_TESTAMENT_BOOKS.length}권)</h3>
                    <div>
                        {OLD_TESTAMENT_BOOKS.map(book => (
                            <BookProgress 
                                key={book.name} 
                                book={book} 
                                readStatus={readStatus[book.name]}
                                onToggle={(chapter) => toggleReadStatus(book.name, chapter, book.chapters)}
                            />
                        ))}
                    </div>
                </section>
                 <section>
                    <h3 className="text-xl font-semibold p-3 bg-slate-800 text-slate-200 sticky top-0">신약 ({NEW_TESTAMENT_BOOKS.length}권)</h3>
                    <div>
                        {NEW_TESTAMENT_BOOKS.map(book => (
                            <BookProgress 
                                key={book.name} 
                                book={book} 
                                readStatus={readStatus[book.name]}
                                onToggle={(chapter) => toggleReadStatus(book.name, chapter, book.chapters)}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingTracker;