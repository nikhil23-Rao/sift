import { useState, useEffect, useRef } from 'react'

const App = () => {
  const [searchValue, setSearchValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    window.api?.onMainProcessMessage((msg) => {
      console.log('Main process says:', msg)
    })
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      window.api?.hideWindow()
    }
  }

  return (
    <div 
      className="h-screen w-screen bg-transparent p-2 font-sans selection:bg-blue-500/30 overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* HUD Container: Liquid Glass Effect, fill window area to be the 'move' handle */}
      <div className="relative h-full w-full liquid-glass rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 drag flex flex-col">
        
        {/* Shine Layer (Purely Visual) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />

        {/* Search Header */}
        <div className="relative flex items-center px-6 py-5 border-b border-white/[0.08]">
          <div className="flex-shrink-0 mr-4 text-zinc-400 drop-shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-white text-xl font-medium focus:outline-none placeholder-white/20 no-drag drop-shadow-md"
            placeholder="Search anything..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            autoFocus
          />
          <div className="flex items-center space-x-2 no-drag ml-4">
            <span className="text-[10px] font-bold text-white/40 px-2 py-1 rounded-md bg-white/5 border border-white/10 uppercase tracking-widest backdrop-blur-sm">Esc</span>
          </div>
        </div>

        {/* Results Area */}
        <div className="relative flex-1 overflow-y-auto p-3 no-drag">
          <div className="px-4 py-2 text-[11px] font-bold text-white/30 uppercase tracking-widest">Quick Actions</div>
          
          {/* Active Result with Glass Highlight */}
          <div className="flex items-center justify-between px-4 py-4 bg-white/[0.03] border border-white/10 rounded-xl group cursor-pointer transition-all hover:bg-white/5 hover:border-white/20 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/80 to-blue-600/80 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-base drop-shadow-sm">Sift Intelligence</p>
                <p className="text-white/40 text-xs">AI-powered deep search across all nodes</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-white/10 text-white/60 text-[11px] rounded-lg border border-white/10 font-sans shadow-inner">⏎</kbd>
            </div>
          </div>

          {/* Secondary Results */}
          <div className="flex items-center justify-between px-4 py-4 hover:bg-white/[0.04] rounded-xl group cursor-pointer transition-all mt-1.5 border border-transparent hover:border-white/5">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 group-hover:text-white/80 transition-all group-hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-white/70 font-medium text-base group-hover:text-white transition-colors">Workspace Insights</p>
                <p className="text-white/30 text-xs">Analyze current project context</p>
              </div>
            </div>
            <div className="hidden group-hover:flex items-center space-x-1 animate-in fade-in slide-in-from-right-2">
               <span className="text-[10px] text-white/40 font-bold mr-2 uppercase tracking-tighter">Quick Command</span>
               <kbd className="px-2 py-1 bg-white/10 text-white/60 text-[10px] rounded-lg border border-white/10">⌘</kbd>
               <kbd className="px-2 py-1 bg-white/10 text-white/60 text-[10px] rounded-lg border border-white/10">K</kbd>
            </div>
          </div>
        </div>

        {/* Footer: Translucent integrated bar */}
        <div className="relative bg-white/[0.02] px-6 py-4 flex justify-between items-center border-t border-white/[0.08]">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[11px] text-white/30 font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.6)]"></span>
              <span>Sift Active</span>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-black text-white/20">
            <div className="flex items-center space-x-1.5">
               <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5">⌘</kbd>
               <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5">⌥</kbd>
               <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5">SPACE</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
