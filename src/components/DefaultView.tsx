import React from 'react'
import { ActiveMode } from '../types'

interface DefaultViewProps {
  onSelectMode: (mode: ActiveMode) => void;
  selectedIndex: number;
  onHoverIndex: (index: number) => void;
}

export const DefaultView = ({ onSelectMode, selectedIndex, onHoverIndex }: DefaultViewProps) => {
  const items = [
    { key: 'A', label: 'Problem Assistant', desc: 'Solve anything on your screen', mode: 'problem-assistant' as ActiveMode },
    { key: 'T', label: 'AI Tutor', desc: 'AI step-by-step screen annotations', mode: 'tutor' as ActiveMode },
    { key: 'W', label: 'Whiteboard', desc: 'Internal canvas for focused notes', mode: 'drawing' as ActiveMode },
    { key: 'D', label: 'Napkin Sketch', desc: 'Draw directly over other apps', mode: 'napkin-sketch' as ActiveMode },
    { key: 'S', label: 'Summarize Video', desc: 'Generate AI notes from URL', mode: 'video-summary' as ActiveMode },
  ];

  return (
    <div className="space-y-2 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="px-4 py-2 text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Quick Commands</div>
      {items.map((item, index) => (
        <div 
          key={item.key} 
          onClick={() => onSelectMode(item.mode)}
          onMouseEnter={() => onHoverIndex(index)}
          className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer group transition-all no-drag border ${
            selectedIndex === index 
              ? 'bg-white/[0.08] border-white/10 ring-1 ring-white/10' 
              : 'hover:bg-white/[0.04] border-transparent hover:border-white/5'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold uppercase text-[10px] transition-all ${
              selectedIndex === index 
                ? 'bg-blue-500/30 text-blue-400 scale-105' 
                : 'bg-white/5 text-white/40 group-hover:bg-blue-500/20 group-hover:text-blue-400'
            }`}>
              {item.key}
            </div>
            <div>
              <p className={`font-medium text-sm transition-colors ${selectedIndex === index ? 'text-white' : 'text-white/90'}`}>{item.label}</p>
              <p className={`text-[11px] transition-colors ${selectedIndex === index ? 'text-white/50' : 'text-white/30'}`}>{item.desc}</p>
            </div>
          </div>
          <div className={`flex items-center space-x-1 transition-opacity ${selectedIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <kbd className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded border border-white/10">⌘</kbd>
            {item.key === 'A' && <kbd className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded border border-white/10">⇧</kbd>}
            <kbd className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded border border-white/10">{item.key}</kbd>
          </div>
        </div>
      ))}
    </div>
  );
}
