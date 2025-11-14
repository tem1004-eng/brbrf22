import React, { useState } from 'react';
import { OLD_TESTAMENT_BOOKS, NEW_TESTAMENT_BOOKS } from '../constants';
import { Book } from '../types';

interface SidebarProps {
  onSelectChapter: (book: string, chapter: number) => void;
  selectedBook: string;
  selectedChapter: number;
}

const Accordion: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left font-bold text-lg p-3 text-white bg-rose-600 hover:bg-rose-700 transition-colors duration-200 flex justify-between items-center"
            >
                {title}
                <svg className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && <div className="bg-slate-800">{children}</div>}
        </div>
    );
};

const BookSection: React.FC<{ 
    book: Book;
    onSelectChapter: (book: string, chapter: number) => void;
    currentBook: string;
    currentChapter: number;
}> = ({ book, onSelectChapter, currentBook, currentChapter }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isSelectedBook = book.name === currentBook;

    return (
        <div className="border-b border-slate-700">
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className={`w-full text-left p-3 flex justify-between items-center transition-colors text-slate-300 ${isSelectedBook ? 'bg-blue-900/50 text-white font-semibold' : 'hover:bg-slate-700/50'}`}
            >
                {book.name}
                <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
            </button>
            {isExpanded && (
                <div className="grid grid-cols-3 gap-1 p-3 bg-slate-800/50">
                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => (
                        <button
                            key={chapter}
                            onClick={() => onSelectChapter(book.name, chapter)}
                            className={`p-2 rounded text-center transition-colors text-slate-300 ${isSelectedBook && chapter === currentChapter ? 'bg-blue-600 text-white font-bold' : 'bg-slate-700 hover:bg-blue-800/50'}`}
                        >
                            {chapter}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectChapter, selectedBook, selectedChapter }) => {
  return (
    <aside className="w-40 bg-slate-800 border-r border-slate-700 flex-shrink-0 overflow-y-auto">
        <Accordion title="구약 성경">
            {OLD_TESTAMENT_BOOKS.map((book) => (
                <BookSection key={book.name} book={book} onSelectChapter={onSelectChapter} currentBook={selectedBook} currentChapter={selectedChapter} />
            ))}
        </Accordion>
        <Accordion title="신약 성경">
            {NEW_TESTAMENT_BOOKS.map((book) => (
                <BookSection key={book.name} book={book} onSelectChapter={onSelectChapter} currentBook={selectedBook} currentChapter={selectedChapter} />
            ))}
        </Accordion>
    </aside>
  );
};

export default Sidebar;