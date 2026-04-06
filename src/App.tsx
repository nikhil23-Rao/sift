import React, { useState, useEffect, useRef } from 'react'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { motion, AnimatePresence } from 'framer-motion'

import { Icons } from './components/Icons'
import { AuthView } from './components/AuthView'
import { OnboardingView } from './components/OnboardingView'
import { DefaultView } from './components/DefaultView'
import { ProfileView } from './components/ProfileView'
import { ProblemAssistantView } from './components/ProblemAssistantView'
import { TutorOverlay } from './components/TutorOverlay'
import SearchMode from './components/SearchMode'

import { useAuth } from './hooks/useAuth'
import { ActiveMode, UserData } from './types'

const App = () => {
  const { user, userData, setUserData, authLoading } = useAuth()
  const [activeMode, setActiveMode] = useState<ActiveMode>('default')
  const [searchValue, setSearchValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = [
    { id: '@drive', label: 'Google Drive', icon: '📁', color: 'from-blue-600/20' },
    { id: '@create', label: 'Create Doc', icon: '📝', color: 'from-green-600/20' },
    { id: '@delete', label: 'Delete File', icon: '🗑️', color: 'from-red-600/20' },
    { id: '@reddit', label: 'Reddit', icon: '🌐', color: 'from-orange-500/20' },
    { id: '@youtube', label: 'YouTube', icon: '📺', color: 'from-red-500/20' },
    { id: '@khanacademy', label: 'Khan Academy', icon: '🎓', color: 'from-green-500/20' },
    { id: '@web', label: 'Web Search', icon: '🔍', color: 'from-blue-500/20' },
    { id: '@deepsearch', label: 'Deep Search', icon: '🧠', color: 'from-purple-500/20' },
  ]

  const quickActions = [
    { id: '/solve', label: 'Problem Solver', mode: 'problem-assistant', icon: <Icons.Problem /> },
    { id: '/tutor', label: 'AI Tutor', mode: 'tutor', icon: <Icons.Tutor /> },
    { id: '/board', label: 'Whiteboard', mode: 'drawing', icon: <Icons.Board /> },
    { id: '/sketch', label: 'Napkin Sketch', mode: 'napkin-sketch', icon: <Icons.Pencil /> },
    { id: '/profile', label: 'User Profile', mode: 'profile', icon: <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20"><img src={user?.photoURL || ''} className="w-full h-full object-cover" /></div> },
  ]

  const activeCommand = commands.find(c => searchValue.toLowerCase().includes(c.id))
  const isResearchMode = !!activeCommand

  const [showQuickActions, setShowQuickActions] = useState(false)
  const [selectedActionIndex, setSelectedActionIndex] = useState(0)

  useEffect(() => {
    if (searchValue.endsWith('@')) {
      setShowCommands(true)
      setShowQuickActions(false)
      setSelectedCommandIndex(0)
    } else if (!searchValue.includes('@')) {
      setShowCommands(false)
    }

    if (searchValue.endsWith('/')) {
      setShowQuickActions(true)
      setShowCommands(false)
      setSelectedActionIndex(0)
    } else if (!searchValue.includes('/')) {
      setShowQuickActions(false)
    }
  }, [searchValue])

  const handleCommandSelect = (cmd: string) => {
    const lastAtIdx = searchValue.lastIndexOf('@')
    const newValue = searchValue.slice(0, lastAtIdx) + cmd + ' '
    setSearchValue(newValue)
    setShowCommands(false)
    inputRef.current?.focus()
  }

  const handleActionSelect = (mode: string) => {
    setActiveMode(mode as ActiveMode)
    setSearchValue('')
    setShowQuickActions(false)
  }

  useEffect(() => {
    if (searchValue === '' && activeMode === 'search') {
      setActiveMode('default')
    }
  }, [searchValue, activeMode])

  useEffect(() => {
    if (userData?.onboarded && activeMode !== 'profile') inputRef.current?.focus()
  }, [userData, activeMode])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedCommandIndex(prev => (prev + 1) % commands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedCommandIndex(prev => (prev - 1 + commands.length) % commands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleCommandSelect(commands[selectedCommandIndex].id)
      } else if (e.key === 'Escape') {
        setShowCommands(false)
      }
      return
    }

    if (showQuickActions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedActionIndex(prev => (prev + 1) % quickActions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedActionIndex(prev => (prev - 1 + quickActions.length) % quickActions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleActionSelect(quickActions[selectedActionIndex].mode)
      } else if (e.key === 'Escape') {
        setShowQuickActions(false)
      }
      return
    }

    if (e.key === 'Enter' && searchValue.trim()) {
      setSearchQuery(searchValue)
      setActiveMode('search')
    }
  }

  useEffect(() => {
    if (!userData?.onboarded) return
    
    const isCollapsed = activeMode === 'default' && searchValue === ''
    
    if (activeMode === 'napkin-sketch' || activeMode === 'tutor') {
      const width = window.screen.width
      const height = window.screen.height
      window.api?.resizeWindow(width, height)
    } else if (isCollapsed) {
      window.api?.resizeWindow(850, 110)
    } else {
      const baseHeight = 110 + 16; 
      let contentHeight = 480;
      let windowWidth = 850;

      if (activeMode === 'drawing') { contentHeight = 650; windowWidth = 900; }
      else if (activeMode === 'profile') contentHeight = 550;
      else if (activeMode === 'problem-assistant' || activeMode === 'search') contentHeight = 600;
      
      window.api?.resizeWindow(windowWidth, baseHeight + contentHeight)
    }
  }, [activeMode, userData, searchValue])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setActiveMode('problem-assistant')
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    
    if (window.api?.onTriggerProblemAssistant) {
      window.api.onTriggerProblemAssistant(() => {
        setActiveMode('problem-assistant')
      })
    }

    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const handleOnboardingComplete = async (data: any) => {
    if (!user) return
    const newUserData: UserData = {
      uid: user.uid, email: user.email || '', displayName: data.displayName || 'User',
      photoURL: user.photoURL || '', onboarded: true, status: data.status,
      school: data.school || 'N/A', gradYear: data.gradYear || 'N/A', agreedToTerms: data.agreedToTerms
    }
    await setDoc(doc(db, 'users', user.uid), newUserData)
    setUserData(newUserData)
    setActiveMode('default')
  }

  if (authLoading) return <div className="h-screen w-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
  if (!user) return <AuthView />
  if (!userData?.onboarded) return <OnboardingView user={user} onComplete={handleOnboardingComplete} />

  const modes: { id: ActiveMode; icon: React.ReactNode; label: string }[] = [
    { id: 'default', icon: <Icons.Default />, label: 'Home' },
    { id: 'drawing', icon: <Icons.Board />, label: 'Board' },
    { id: 'napkin-sketch', icon: <Icons.Pencil />, label: 'Sketch' },
    { id: 'tutor', icon: <Icons.Tutor />, label: 'Tutor' },
    { id: 'problem-assistant', icon: <Icons.Problem />, label: 'Solve' },
    { id: 'profile', icon: <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20"><img src={user.photoURL || ''} className="w-full h-full object-cover" /></div>, label: 'User' },
  ]

  const isCollapsed = activeMode === 'default' && searchValue === ''

  if (activeMode === 'napkin-sketch') {
    return (
      <div 
        className="h-screen w-screen bg-transparent relative no-drag overflow-hidden flex flex-col items-center napkin-mode"
        onMouseEnter={() => window.api?.setIgnoreMouse(false)}
        onMouseLeave={() => window.api?.setIgnoreMouse(true)}
      >
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-4 pointer-events-auto">
          <div className="flex items-center space-x-3 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3 shadow-2xl">
            <div className="relative flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute opacity-75" />
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full relative" />
            </div>
            <span className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Napkin Sketch</span>
            <div className="w-[1px] h-3 bg-white/10 mx-2" />
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Overlay Active</span>
          </div>

          <button 
            onClick={() => {
              window.api?.setIgnoreMouse(false)
              setActiveMode('default')
            }}
            onMouseEnter={() => window.api?.setIgnoreMouse(false)}
            className="bg-white text-black font-black uppercase text-[11px] tracking-[0.2em] px-8 py-3.5 rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-3 group shadow-2xl"
          >
            <span>Exit Sketch</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </div>

        <div className="absolute inset-0 z-0">
          <Tldraw 
            persistenceKey="napkin-sketch" 
            inferDarkMode 
            hideUi={false}
          />
        </div>
      </div>
    )
  }

  if (activeMode === 'tutor') {
    return <TutorOverlay onExit={() => setActiveMode('default')} />
  }

  return (
    <div className="h-screen w-screen bg-transparent p-4 flex flex-col items-center selection:bg-blue-500/30 overflow-hidden">
      {/* Persistent Compact Header */}
      <motion.div 
        layout
        initial={false}
        animate={{ 
          height: 64,
          width: '100%',
          borderRadius: '1.5rem',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative liquid-glass overflow-hidden drag flex flex-col shadow-2xl z-50 shrink-0"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="relative flex h-full items-center px-6 transition-all">
          <div className="relative flex-1 flex items-center">
            <input 
              ref={inputRef} 
              type="text" 
              className="w-full bg-transparent text-white focus:outline-none placeholder-gray/20 no-drag text-sm font-medium transition-all"
              style={{color: isResearchMode ? '#60a5fa' : '#90949C', fontWeight: '400'}} 
              placeholder="Sift through anything..." 
              value={searchValue} 
              onChange={e => setSearchValue(e.target.value)} 
              onKeyDown={handleSearch}
              autoFocus 
            />
            <div className="flex items-center space-x-2 ml-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 font-mono">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 font-mono">K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center ml-6 pl-6 border-l border-white/10 space-x-1 no-drag">
            {modes.filter(m => m.id !== 'default' && m.id !== 'profile').map(m => (
              <button 
                key={m.id} 
                onClick={() => setActiveMode(m.id)}
                className={`flex items-center rounded-lg transition-all group py-1.5 ${
                  activeMode === m.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 px-3' : 'text-white/40 hover:text-white hover:bg-white/10 px-2'
                } ${searchValue.length > 20 ? 'space-x-0' : 'space-x-2'}`}
              >
                <span className="scale-90 shrink-0">{m.icon}</span>
                <AnimatePresence>
                  {searchValue.length <= 20 && (
                    <motion.span 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap overflow-hidden"
                    >
                      {m.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
            <div className="w-[1px] h-4 bg-white/10 mx-2 shrink-0" />
            <button 
              onClick={() => setActiveMode(activeMode === 'profile' ? 'default' : 'profile')} 
              className={`w-7 h-7 rounded-lg overflow-hidden border transition-colors no-drag shrink-0 ${
                activeMode === 'profile' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <img src={user.photoURL || ''} className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[84px] left-8 right-8 z-[100] bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl no-drag"
          >
            <div className="p-2 space-y-1 max-h-[320px] overflow-y-auto custom-scrollbar">
              <p className="px-4 py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] sticky top-0 bg-zinc-900/95 backdrop-blur-3xl z-10">Research Sources</p>
              {commands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => handleCommandSelect(cmd.id)}
                  onMouseEnter={() => setSelectedCommandIndex(index)}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all group text-left ${
                    selectedCommandIndex === index ? 'bg-white/10 ring-1 ring-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className={`text-xl transition-transform ${selectedCommandIndex === index ? 'scale-110' : ''}`}>{cmd.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold transition-colors ${selectedCommandIndex === index ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{cmd.label}</p>
                    <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">{cmd.id}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${cmd.color} transition-all ${selectedCommandIndex === index ? 'scale-125 shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'to-transparent'}`} />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[84px] left-8 right-8 z-[100] bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl no-drag"
          >
            <div className="p-2 space-y-1 max-h-[320px] overflow-y-auto custom-scrollbar">
              <p className="px-4 py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] sticky top-0 bg-zinc-900/95 backdrop-blur-3xl z-10">Quick Actions</p>
              {quickActions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => handleActionSelect(action.mode)}
                  onMouseEnter={() => setSelectedActionIndex(index)}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all group text-left ${
                    selectedActionIndex === index ? 'bg-blue-500/10 ring-1 ring-blue-500/20' : 'hover:bg-white/5'
                  }`}
                >
                  <span className={`text-xl transition-transform ${selectedActionIndex === index ? 'scale-110' : ''}`}>{action.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold transition-colors ${selectedActionIndex === index ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{action.label}</p>
                    <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">{action.id}</p>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full bg-blue-500 transition-all ${selectedActionIndex === index ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Separate Content Panel */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="relative w-full flex-1 liquid-glass rounded-[2rem] overflow-hidden mt-4 shadow-2xl flex flex-col no-drag"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            {(activeMode === 'profile' || activeMode === 'problem-assistant') && (
              <div className="relative flex items-center px-8 py-6 border-b border-white/[0.05]">
                <button onClick={() => setActiveMode('default')} className="mr-4 p-2 hover:bg-white/10 rounded-xl text-white/40 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-white text-sm font-black uppercase tracking-widest">{activeMode === 'profile' ? 'Profile Settings' : 'Problem Assistant'}</h2>
                {activeMode === 'problem-assistant' && (
                  <div className="ml-auto flex items-center space-x-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Live Screen</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeMode === 'default' && <DefaultView onSelectMode={setActiveMode} />}
              {activeMode === 'search' && <SearchMode query={searchQuery} school={userData?.school} googleDriveAccessToken={userData?.googleDriveAccessToken} />}
              {activeMode === 'drawing' && <div className="h-full"><Tldraw persistenceKey="ghost-hud-canvas" inferDarkMode /></div>}
              {activeMode === 'profile' && <ProfileView userData={userData} />}
              {activeMode === 'problem-assistant' && <ProblemAssistantView />}
            </div>

            {activeMode !== 'problem-assistant' && activeMode !== 'drawing' && (
              <div className="px-8 py-4 flex justify-between items-center bg-white/[0.02] border-t border-white/[0.05]">
                <div className="flex items-center space-x-3 group">
                  <div className="relative">
                    <img src={user.photoURL || ''} alt="" className="w-7 h-7 rounded-xl border border-white/10 transition-transform" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-zinc-900" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{userData.displayName}</p>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-tighter mt-1">{userData.school}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.2em]">Sift Engine v1.0</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
