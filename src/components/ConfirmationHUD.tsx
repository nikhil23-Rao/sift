import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DetectedEvent } from '../types';

interface ConfirmationHUDProps {
  onQueueEmpty: () => void;
  isVisible: boolean;
  eventQueue: DetectedEvent[];
  setEventQueue: React.Dispatch<React.SetStateAction<DetectedEvent[]>>;
  scannerStatus: 'idle' | 'analyzing';
}

export const ConfirmationHUD: React.FC<ConfirmationHUDProps> = ({ 
  onQueueEmpty, 
  isVisible,
  eventQueue,
  setEventQueue,
  scannerStatus
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Handle queue exhaustion and idle status
    if (eventQueue.length === 0 && scannerStatus === 'idle' && isVisible) {
      onQueueEmpty();
    }
  }, [eventQueue, scannerStatus, onQueueEmpty, isVisible]);

  const handleAccept = async () => {
    if (eventQueue.length === 0) return;
    
    const currentEvent = eventQueue[0];
    console.log(`Accepted Event: ${currentEvent.title}`);
    
    setIsSyncing(true);
    // Mock sync delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setEventQueue(prev => prev.slice(1));
    setIsSyncing(false);
  };

  const handleDismiss = () => {
    if (eventQueue.length === 0) return;
    
    console.log("Dismissed");
    setEventQueue(prev => prev.slice(1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || eventQueue.length === 0 || isSyncing) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, eventQueue, isSyncing]);

  if (eventQueue.length === 0 && scannerStatus === 'idle') return null;

  const currentEvent = eventQueue[0];

  return (
    <div className="h-full w-full flex items-center justify-center p-4 bg-transparent overflow-hidden">
      <AnimatePresence mode="wait">
        {scannerStatus === 'analyzing' && eventQueue.length === 0 ? (
          <motion.div
            key="analyzing-loader"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-4 shadow-2xl flex items-center space-x-4"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute opacity-75" />
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full relative" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold">Deadline noticed</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 animate-pulse">Formatting with AI...</span>
            </div>
          </motion.div>
        ) : currentEvent ? (
          <motion.div
            key={currentEvent.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="relative group overflow-hidden"
          >
            {/* Pill Container */}
            <div className="bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-4 shadow-2xl flex items-center space-x-6 min-w-[400px]">
            
            {/* Action Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-white/5 border border-white/10 text-white/60'}`}>
              {isSyncing ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            {/* Event Details */}
            <div className="flex-1 flex flex-col">
              <span className="text-white text-sm font-bold truncate max-w-[200px]">{currentEvent.title}</span>
              <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                <span>{currentEvent.date}</span>
                {currentEvent.time && (
                  <>
                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                    <span>{currentEvent.time}</span>
                  </>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4 pl-4 border-l border-white/10">
              <div className="flex flex-col items-center space-y-1">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] text-white/40 font-mono">⌘</kbd>
                  <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] text-white/40 font-mono">↵</kbd>
                </div>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Accept</span>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] text-white/40 font-mono">ESC</kbd>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Ignore</span>
              </div>
            </div>

            {/* Queue Badge */}
            {eventQueue.length > 1 && (
              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full border-2 border-zinc-950 shadow-lg">
                +{eventQueue.length - 1}
              </div>
            )}
          </div>

          {/* Liquid background glow */}
          <div className="absolute inset-0 bg-blue-500/5 blur-3xl -z-10 rounded-full transition-opacity opacity-0 group-hover:opacity-100" />
        </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
