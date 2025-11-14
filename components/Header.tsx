import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onToggleTracker: () => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleTracker, playbackRate, onPlaybackRateChange }) => {
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const speedOptions = [0.8, 1.0, 1.1, 1.3, 1.5, 1.7];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setIsSpeedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-slate-800 border-b border-slate-700 z-20">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="bg-rose-600 px-4 py-2 rounded-lg shadow-md">
              <h1 className="text-xl font-serif font-bold text-white">은혜로</h1>
          </div>
          
          <div className="flex justify-end items-center space-x-4">
            {/* Speed control button and popover */}
            <div className="relative" ref={speedMenuRef}>
              <button
                onClick={() => setIsSpeedMenuOpen(prev => !prev)}
                className="flex items-center justify-center w-28 px-3 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500"
                aria-haspopup="true"
                aria-expanded={isSpeedMenuOpen}
                aria-label="읽기 속도 조절"
              >
                <span className="text-sm">속도</span>
                <span className="font-mono ml-2 font-semibold">{playbackRate.toFixed(1)}x</span>
              </button>
              {isSpeedMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-700 rounded-md shadow-lg border border-slate-600 p-1 grid grid-cols-3 gap-1 animate-fade-in-up-fast">
                  {speedOptions.map(speed => (
                    <button
                      key={speed}
                      onClick={() => {
                        onPlaybackRateChange(speed);
                        setIsSpeedMenuOpen(false);
                      }}
                      className={`px-2 py-1.5 rounded-md text-center font-mono transition-colors ${
                        playbackRate === speed
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {speed.toFixed(1)}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
                onClick={onToggleTracker}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500"
                aria-label="성경통독표 열기"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
