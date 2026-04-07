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
    // Switch back to main UI as soon as queue is empty, 
    // unless we are still in the initial "analyzing" phase (no events yet)
    if (eventQueue.length === 0 && isVisible && scannerStatus === 'idle') {
      onQueueEmpty();
    }
  }, [eventQueue.length, isVisible, onQueueEmpty, scannerStatus]);

  const handleAccept = async () => {
    if (eventQueue.length === 0) return;
    setIsSyncing(true);
    // Brief delay for professional feedback
    await new Promise(resolve => setTimeout(resolve, 400));
    setEventQueue(prev => prev.slice(1));
    setIsSyncing(false);
  };

  const handleDismiss = async () => {
    if (eventQueue.length === 0) return;
    // Add brief delay for consistency with accept action
    await new Promise(resolve => setTimeout(resolve, 200));
    setEventQueue(prev => prev.slice(1));
  };

  const handleDismissAll = () => {
    setEventQueue([]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || isSyncing) return;
      if (eventQueue.length === 0 && scannerStatus !== 'analyzing') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleDismissAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, eventQueue, isSyncing, scannerStatus]);

  if (eventQueue.length === 0 && scannerStatus === 'idle') return null;

  const currentEvent = eventQueue[0];

  return (
    <div className="h-full w-full flex flex-col items-center justify-start pt-8 bg-transparent overflow-hidden no-drag pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentEvent?.id || 'analyzing'}
          initial={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          className="w-[340px] liquid-glass rounded-[2rem] border border-white/10 shadow-2xl pointer-events-auto overflow-hidden flex flex-col"
        >
          {/* Status Header */}
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${scannerStatus === 'analyzing' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sift Intelligence</span>
            </div>
            {eventQueue.length > 1 && (
              <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-0.5 rounded-full">
                +{eventQueue.length - 1} More
              </span>
            )}
          </div>

          {/* Main Content Area */}
          <div className="p-6 min-h-[140px] flex flex-col justify-center">
            {scannerStatus === 'analyzing' && eventQueue.length === 0 ? (
              <div className="space-y-2 animate-in fade-in duration-500">
                <p className="text-white text-lg font-bold leading-tight">Deadline noticed...</p>
                <p className="text-white/20 text-xs font-medium uppercase tracking-widest animate-pulse">Extracting event details</p>
              </div>
            ) : currentEvent ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-white text-xl font-bold leading-tight tracking-tight">{currentEvent.title}</p>
                  <div className="flex items-center space-x-3 text-white/40 font-bold text-[11px] uppercase tracking-widest">
                    <span>{currentEvent.date}</span>
                    {currentEvent.time && (
                      <>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <span>{currentEvent.time}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Controls Footer */}
          <div className="px-4 py-4 bg-white/[0.03] border-t border-white/[0.05] flex items-center space-x-2">
            <button 
              onClick={handleDismiss}
              disabled={isSyncing || (scannerStatus === 'analyzing' && eventQueue.length === 0)}
              className="flex-1 py-3 rounded-xl hover:bg-white/5 transition-all text-white/20 hover:text-white group disabled:opacity-0"
            >
              <div className="flex flex-col items-center">
                <kbd className="text-[9px] font-mono opacity-40 group-hover:opacity-100 mb-0.5 transition-opacity">ESC</kbd>
                <span className="text-[8px] font-black uppercase tracking-widest">Ignore</span>
              </div>
            </button>

            <button 
              onClick={handleAccept}
              disabled={isSyncing || (scannerStatus === 'analyzing' && eventQueue.length === 0)}
              className={`flex-[2] py-3 rounded-xl transition-all flex flex-col items-center group relative overflow-hidden ${
                isSyncing ? 'bg-blue-600' : 'bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white'
              } disabled:opacity-0`}
            >
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin my-auto" />
              ) : (
                <>
                  <div className="flex items-center space-x-1 mb-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <kbd className="text-[9px] font-mono">⌘</kbd>
                    <kbd className="text-[9px] font-mono">↵</kbd>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Add to Calendar</span>
                </>
              )}
              {isSyncing && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="absolute bottom-0 left-0 h-0.5 bg-white/40"
                />
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};