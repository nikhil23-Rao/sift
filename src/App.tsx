import React, { useState, useEffect, useRef } from 'react'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

// --- Types ---
type ActiveMode = 'default' | 'text-sync' | 'video-summary' | 'drawing' | 'recording'

// --- Icons (SVG Components) ---
const Icons = {
  Default: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
  ),
  TextSync: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  ),
  Video: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
  ),
  Drawing: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.5 1.5"></path><path d="M7.5 3.5L14 10"></path></svg>
  ),
  Recording: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
  )
}

// --- Sub-Components for Different Views ---

const DefaultView = () => (
  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="px-4 py-2 text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Quick Commands</div>
    {[
      { key: 'S', label: 'Summarize Video', desc: 'Generate AI notes from URL' },
      { key: 'D', label: 'Napkin Sketch', desc: 'Digitize hand-drawn diagrams' },
      { key: 'R', label: 'Record Lecture', desc: 'Live transcript & slides' },
    ].map((item) => (
      <div key={item.key} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] rounded-xl cursor-pointer group transition-all border border-transparent hover:border-white/5 no-drag">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 group-hover:text-white/80 transition-colors uppercase font-bold text-xs italic">
            {item.key}
          </div>
          <div>
            <p className="text-white/90 font-medium text-sm">{item.label}</p>
            <p className="text-white/30 text-[11px]">{item.desc}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <kbd className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded border border-white/10 font-sans">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded border border-white/10 font-sans">{item.key}</kbd>
        </div>
      </div>
    ))}
  </div>
)

const TextSyncView = () => (
  <div className="p-4 space-y-4 animate-in fade-in zoom-in-95 duration-300 no-drag">
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Calendar Event Detected</h3>
          <h2 className="text-white font-semibold text-lg">Product Sync with Design Team</h2>
        </div>
        <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
        </div>
      </div>
      <div className="flex items-center space-x-4 text-white/50 text-sm mb-6">
        <span className="flex items-center"><svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 14:00 - 15:00</span>
        <span className="flex items-center"><svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg> April 4, 2026</span>
      </div>
      <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20 active:scale-[0.98]">
        Sync to Google Calendar
      </button>
    </div>
  </div>
)

const VideoSummaryView = () => (
  <div className="p-5 space-y-5 animate-in fade-in duration-500 no-drag">
    <div className="flex items-center space-x-4">
      <div className="relative w-16 h-10 bg-zinc-800 rounded-md overflow-hidden flex-shrink-0 border border-white/5">
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
         <div className="absolute bottom-1 right-1 bg-black/80 text-[8px] px-1 rounded text-white font-mono">14:02</div>
      </div>
      <div className="flex-1">
        <h3 className="text-white font-medium text-sm line-clamp-1">The Future of Human-AI Interaction — 2026 Summit</h3>
        <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mt-0.5">YouTube Node Active</p>
      </div>
    </div>
    <ul className="space-y-3 pl-4 border-l-2 border-white/5">
      {[
        'Multimodal interfaces are the new default for OS design.',
        'Latency < 50ms is critical for "Ghost UI" feeling.',
        'Local-first inference allows for private workspace scanning.',
      ].map((note, i) => (
        <li key={i} className="text-white/60 text-sm leading-relaxed relative">
          <span className="absolute -left-[21px] top-2 w-1.5 h-1.5 rounded-full bg-white/20" />
          {note}
        </li>
      ))}
    </ul>
  </div>
)

const DrawingView = () => (
  <div className="p-3 h-full animate-in fade-in duration-300 no-drag flex flex-col relative">
    <div className="flex-1 min-h-[250px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900/50">
       <Tldraw 
         autoFocus 
         inferDarkMode
         persistenceKey="ghost-hud-canvas"
       />
    </div>
    <div className="absolute top-6 right-6 z-[1000]">
       <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center space-x-2 shadow-xl">
         <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
         <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Ink Layer Active</span>
       </div>
    </div>
  </div>
)

const RecordingView = () => (
  <div className="p-6 space-y-6 animate-in fade-in duration-700 no-drag">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
        <span className="text-white font-bold text-xs uppercase tracking-widest">Recording Session</span>
      </div>
      <span className="font-mono text-white/40 text-xs">00:14:22</span>
    </div>
    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
      <div className="h-full bg-blue-500 w-[60%] rounded-full animate-pulse" />
    </div>
    <p className="text-white/60 text-sm italic leading-relaxed">
      "...and that's why the 'Liquid Glass' aesthetic is so important for the next generation of HUD interfaces..."
    </p>
  </div>
)

// --- Main App Component ---

const App = () => {
  const [activeMode, setActiveMode] = useState<ActiveMode>('default')
  const [searchValue, setSearchValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Trigger window resize when mode changes
  useEffect(() => {
    if (activeMode === 'drawing') {
      window.api?.resizeWindow(900, 650)
    } else {
      window.api?.resizeWindow(700, 480)
    }
  }, [activeMode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      window.api?.hideWindow()
    }
    if (e.metaKey || e.ctrlKey) {
      if (e.key === '1') setActiveMode('default')
      if (e.key === '2') setActiveMode('text-sync')
      if (e.key === '3') setActiveMode('video-summary')
      if (e.key === '4') setActiveMode('drawing')
      if (e.key === '5') setActiveMode('recording')
    }
  }

  const renderView = () => {
    switch (activeMode) {
      case 'default': return <DefaultView />
      case 'text-sync': return <TextSyncView />
      case 'video-summary': return <VideoSummaryView />
      case 'drawing': return <DrawingView />
      case 'recording': return <RecordingView />
      default: return <DefaultView />
    }
  }

  const modes: { id: ActiveMode; icon: React.ReactNode; label: string }[] = [
    { id: 'default', icon: <Icons.Default />, label: 'Home' },
    { id: 'text-sync', icon: <Icons.TextSync />, label: 'Sync' },
    { id: 'video-summary', icon: <Icons.Video />, label: 'Video' },
    { id: 'drawing', icon: <Icons.Drawing />, label: 'Draw' },
    { id: 'recording', icon: <Icons.Recording />, label: 'Rec' },
  ]

  return (
    <div 
      className="h-screen w-screen bg-transparent p-4 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col items-center"
      onKeyDown={handleKeyDown}
    >
      {/* HUD Container */}
      <div className="relative w-full flex-1 liquid-glass rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in-95 duration-500 drag flex flex-col mb-4">
        
        {/* Shine Layer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />

        {/* Command Bar - Hidden in Drawing Mode */}
        {activeMode !== 'drawing' && (
          <div className="relative flex items-center px-8 py-7 border-b border-white/[0.08] animate-in slide-in-from-top-4 duration-300">
            <div className="flex-shrink-0 mr-5 text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none placeholder-white/10 no-drag drop-shadow-md"
              placeholder={activeMode === 'default' ? "Type a command..." : "Search in node..."}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Results Area */}
        <div className="relative flex-1 overflow-y-auto no-drag">
          {renderView()}
        </div>

        {/* Footer info */}
        <div className="px-8 py-4 flex justify-between items-center bg-white/[0.01] border-t border-white/[0.05]">
          <div className="flex items-center space-x-2 text-[9px] font-black text-white/20 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            <span>OS Engine Ready</span>
          </div>
          <div className="flex items-center space-x-3 text-[9px] font-black text-white/10">
             <span>⌘1-5 SWITCH</span>
             <span className="w-1 h-1 rounded-full bg-white/10"></span>
             <span>ESC HIDE</span>
          </div>
        </div>
      </div>

      {/* Navigation Dock */}
      <div className="relative no-drag animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center p-1.5 bg-zinc-900/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl space-x-1">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 group ${
                activeMode === mode.id 
                ? 'bg-white/10 text-white shadow-inner' 
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {activeMode === mode.id && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-xl blur-md -z-10" />
              )}
              <span className={`${activeMode === mode.id ? 'scale-110 text-blue-400' : 'scale-100'} transition-transform duration-300`}>
                {mode.icon}
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                activeMode === mode.id ? 'max-w-xs opacity-100 ml-2' : 'max-w-0 opacity-0 overflow-hidden'
              }`}>
                {mode.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
