import React from 'react';

interface PlayerProps {
  onPlay: () => void;
  onStop: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  onNextChapter: () => void;
  isLastChapter: boolean;
}

const PlayIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className || "w-10 h-10"} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>
);

const PauseIcon: React.FC<{className?: string}> = ({className}) => (
     <svg className={className || "w-10 h-10"} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z"></path></svg>
);

const StopIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="10" height="10" rx="1"></rect>
    </svg>
);

const LoadingSpinner: React.FC<{className?: string}> = ({className}) => (
     <svg className={className || "animate-spin h-10 w-10 text-white"} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

const Player: React.FC<PlayerProps> = ({ onPlay, onStop, isPlaying, isLoading, onNextChapter, isLastChapter }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-28 bg-slate-800 border-t border-slate-700 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                <button
                    onClick={onNextChapter}
                    disabled={isLastChapter || isLoading}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-transform transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center shadow-md"
                >
                    다음장
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={onStop} 
                        className="p-4 rounded-md text-slate-300 hover:bg-slate-700 active:bg-slate-600 transition-colors disabled:opacity-50"
                        disabled={isLoading}
                        aria-label="Stop"
                    >
                        <StopIcon className="w-10 h-10" />
                    </button>
                    <button 
                        onClick={onPlay}
                        className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-transform transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 w-20 h-20 flex items-center justify-center shadow-lg disabled:bg-slate-600 disabled:shadow-none"
                        disabled={isLoading}
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isLoading ? <LoadingSpinner /> : (isPlaying ? <PauseIcon /> : <PlayIcon />)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Player;