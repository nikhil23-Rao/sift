import React, { useState, useEffect, useRef } from 'react'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from './firebase'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// --- Types ---
type ActiveMode = 'default' | 'text-sync' | 'video-summary' | 'drawing' | 'recording' | 'profile' | 'problem-assistant'
type StudentStatus = 'college' | 'highschool' | 'none'

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  onboarded: boolean;
  status: StudentStatus;
  school: string;
  gradYear: string;
  agreedToTerms: boolean;
}

const US_COLLEGES = [
  "Harvard University", "Stanford University", "MIT", "UC Berkeley", "Yale University",
  "Princeton University", "Columbia University", "UPenn", "Cornell University", "UCLA",
  "University of Michigan", "NYU", "Duke University", "Carnegie Mellon", "Georgia Tech",
  "UT Austin", "University of Washington", "USC", "University of Chicago", "Northwestern University"
]

// --- Icons ---
const Icons = {
  DragHandle: () => (
    <svg className="w-4 h-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
  ),
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
  ),
  Problem: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  Google: () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
  )
}

// --- Auth Component ---
const AuthView = () => {
  const [loading, setLoading] = useState(false)
  const handleSignIn = async () => {
    setLoading(true)
    try { await signInWithPopup(auth, googleProvider) } 
    catch (e) { console.error("Sign-in error:", e) } 
    finally { setLoading(false) }
  }
  return (
    <div className="flex items-center justify-center h-full w-full p-8">
      <div className="relative w-full max-sm liquid-glass rounded-[2.5rem] p-10 flex flex-col items-center text-center drag shadow-2xl">
        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-8 shadow-[0_0_30px_rgba(59,130,246,0.5)]"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
        <h1 className="text-white text-3xl font-bold mb-2 tracking-tight">Sift HUD</h1>
        <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium">Please sign in to continue.</p>
        <button onClick={handleSignIn} disabled={loading} className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 no-drag"><Icons.Google /><span>{loading ? 'Connecting...' : 'Sign in with Google'}</span></button>
      </div>
    </div>
  )
}

// --- Onboarding Component ---
const OnboardingView = ({ user, onComplete }: { user: User, onComplete: (data: any) => Promise<void> }) => {
  const [step, setStep] = useState(1)
  const [isFinishing, setIsFinishing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    status: 'college' as StudentStatus,
    school: '',
    gradYear: '2026',
    agreedToTerms: false
  })
  const [suggestions, setSuggestions] = useState<string[]>([])

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  const handleSchoolChange = (val: string) => {
    setFormData({ ...formData, school: val })
    if (val.length > 1 && formData.status === 'college') {
      const filtered = US_COLLEGES.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 5)
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }

  const handleFinish = async () => {
    if (isFinishing) return
    setIsFinishing(true)
    try { await onComplete(formData) } 
    catch (e: any) { alert(`Error: ${e.message}`) } 
    finally { setIsFinishing(false) }
  }

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
  }

  return (
    <div className="flex items-center justify-center h-full w-full p-8">
      <div className="relative w-full max-w-md liquid-glass rounded-[2.5rem] p-10 flex flex-col drag min-h-[480px] shadow-2xl">
        <div className="flex space-x-2 mb-8 no-drag">
          {[1, 2, 3].map(i => ( <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`} /> ))}
        </div>

        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <AnimatePresence mode="wait" custom={step}>
            {step === 1 && (
              <motion.div key="step1" custom={1} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6 no-drag text-center">
                <h2 className="text-white text-2xl font-bold tracking-tight">Confirm Profile</h2>
                <div className="flex flex-col items-center space-y-4">
                  <img src={user.photoURL || ''} alt="" className="w-24 h-24 rounded-[2rem] border-2 border-white/10 shadow-2xl" />
                  <div className="w-full text-left space-y-1.5">
                    <label className="text-white/20 text-[10px] font-black uppercase tracking-widest ml-1">Full Name</label>
                    <input type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" custom={1} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-5 no-drag">
                <div className="text-center"><h2 className="text-white text-2xl font-bold tracking-tight">Your Status</h2></div>
                <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
                  {(['college', 'highschool', 'none'] as const).map(s => (
                    <button key={s} onClick={() => setFormData({...formData, status: s})} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === s ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}>
                      {s === 'none' ? 'Not Student' : s}
                    </button>
                  ))}
                </div>
                {formData.status !== 'none' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-white/20 text-[10px] font-black uppercase tracking-widest ml-1">{formData.status === 'college' ? 'College Name' : 'High School Name'}</label>
                      <input type="text" value={formData.school} onChange={e => handleSchoolChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Search school..." />
                      {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                          {suggestions.map(s => (
                            <button key={s} onClick={() => { setFormData({...formData, school: s}); setSuggestions([]); }} className="w-full px-5 py-3 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors">{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-white/20 text-[10px] font-black uppercase tracking-widest ml-1">Graduation Year</label>
                      <select value={formData.gradYear} onChange={e => setFormData({...formData, gradYear: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors">
                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y} className="bg-zinc-900">{y}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" custom={1} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6 no-drag text-center">
                <h2 className="text-white text-2xl font-bold tracking-tight">Final Step</h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-[11px] text-white/30 text-left leading-relaxed font-medium">By clicking finish, you agree to the Sift HUD terms.</div>
                <label className="flex items-center space-x-3 cursor-pointer group p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <input type="checkbox" checked={formData.agreedToTerms} onChange={e => setFormData({...formData, agreedToTerms: e.target.checked})} className="w-6 h-6 rounded-lg bg-white/5 border-2 border-white/10 checked:bg-blue-500 checked:border-blue-500 appearance-none transition-all cursor-pointer" />
                  <span className="text-white/60 text-sm font-semibold group-hover:text-white transition-colors">I accept the terms</span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex space-x-4 mt-8 no-drag">
          {step > 1 && <button onClick={prevStep} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all uppercase text-[10px] tracking-widest border border-white/5">Back</button>}
          <button disabled={(step === 3 && !formData.agreedToTerms) || isFinishing} onClick={() => step === 3 ? handleFinish() : nextStep()} className="flex-[2] bg-white text-black font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-30">
            {isFinishing ? 'Saving...' : step === 3 ? 'Finish Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- HUD Views ---
const DefaultView = ({ onSelectMode }: { onSelectMode: (mode: ActiveMode) => void }) => (
  <div className="space-y-2 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="px-4 py-2 text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Quick Commands</div>
    {[
      { key: 'A', label: 'Problem Assistant', desc: 'Solve anything on your screen', mode: 'problem-assistant' as ActiveMode },
      { key: 'S', label: 'Summarize Video', desc: 'Generate AI notes from URL', mode: 'video-summary' as ActiveMode },
      { key: 'D', label: 'Napkin Sketch', desc: 'Digitize hand-drawn diagrams', mode: 'drawing' as ActiveMode },
      { key: 'R', label: 'Record Lecture', desc: 'Live transcript & slides', mode: 'recording' as ActiveMode },
    ].map((item) => (
      <div 
        key={item.key} 
        onClick={() => onSelectMode(item.mode)}
        className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] rounded-xl cursor-pointer group transition-all no-drag border border-transparent hover:border-white/5"
      >
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 font-bold uppercase text-[10px] group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
            {item.key}
          </div>
          <div>
            <p className="text-white/90 font-medium text-sm">{item.label}</p>
            <p className="text-white/30 text-[11px]">{item.desc}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <kbd className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded border border-white/10">⌘</kbd>
          {item.key === 'A' && <kbd className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded border border-white/10">⇧</kbd>}
          <kbd className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded border border-white/10">{item.key}</kbd>
        </div>
      </div>
    ))}
  </div>
)

const ProfileView = ({ userData }: { userData: UserData }) => (
  <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 no-drag h-full">
    <div className="flex items-center space-x-6">
      <img src={userData.photoURL} alt="" className="w-24 h-24 rounded-[2.5rem] border-4 border-white/10 shadow-2xl" />
      <div className="space-y-1">
        <h2 className="text-white text-3xl font-bold tracking-tight">{userData.displayName}</h2>
        <p className="text-white/40 font-medium">{userData.email}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-1">
        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Institution</p>
        <p className="text-white font-semibold text-lg">{userData.school || 'N/A'}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-1">
        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Graduation</p>
        <p className="text-white font-semibold text-lg">{userData.gradYear || 'N/A'}</p>
      </div>
    </div>
    <button onClick={() => signOut(auth)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl border border-red-500/20 transition-all uppercase text-xs tracking-widest">Sign Out</button>
  </div>
)

const ProblemAssistantView = () => {
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [followUp, setFollowUp] = useState('')
  const [chat, setChat] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const captureAndAnalyze = async () => {
    setLoading(true)
    try {
      if (!window.api?.captureScreen) {
        throw new Error("Screen capture API not found. Please restart the app.")
      }
      const screenshot = await window.api.captureScreen()
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

      const base64Data = screenshot.split(',')[1]

      const result = await model.generateContent([
        "You are a helpful problem-solving assistant. Look at this screen and help the user with any problems, questions, or tasks visible. Provide clear, concise, and accurate solutions using proper markdown formatting.",
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/png"
          }
        }
      ])
      
      const text = result.response.text()
      setMessages([{ role: 'assistant', content: text }])
      
      const newChat = model.startChat({
        history: [
          { role: "user", parts: [{ text: "Help me with my screen." }] },
          { role: "model", parts: [{ text }] },
        ],
      })
      setChat(newChat)
      
      window.api.resizeWindow(700, 600)
    } catch (error: any) {
      console.error("AI Error:", error)
      setMessages([{ role: 'assistant', content: `Error: ${error.message || 'I couldn\'t analyze the screen'}.` }])
    } finally {
      setLoading(false)
    }
  }

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!followUp.trim() || !chat || loading) return
    
    const userMessage = followUp
    setFollowUp('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)
    
    try {
      const result = await chat.sendMessage(userMessage)
      const assistantMessage = result.response.text()
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
    } catch (error: any) {
      console.error("Follow-up error:", error)
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    captureAndAnalyze()
  }, [])

  return (
    <div className="flex flex-col h-full p-4 space-y-4 no-drag max-h-[500px]">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar flex flex-col"
      >
        {messages.length === 0 && loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse py-12">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Scanning Screen...</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full mb-2`}
          >
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white/10 text-white/90 rounded-tl-none border border-white/5'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="text-white/90 space-y-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0 text-blue-400" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-md font-bold mb-1 mt-3 first:mt-0 text-blue-300" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                      code: ({node, inline, className, children, ...props}: any) => {
                        return inline ? (
                          <code className="bg-white/10 px-1 py-0.5 rounded text-blue-300 font-mono text-[12px]" {...props}>{children}</code>
                        ) : (
                          <pre className="bg-black/40 p-3 rounded-xl overflow-x-auto my-2 border border-white/5 font-mono text-[12px] text-blue-200">
                            <code {...props}>{children}</code>
                          </pre>
                        )
                      },
                      blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-blue-500/50 pl-3 italic text-white/60 my-2" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-blue-400" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </motion.div>
        ))}

        {loading && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start w-full"
          >
            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleFollowUp} className="relative flex items-center mt-auto">
        <input 
          type="text" 
          value={followUp}
          onChange={e => setFollowUp(e.target.value)}
          placeholder="Ask a follow-up..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors pr-12"
        />
        <button 
          type="submit"
          disabled={loading || !followUp.trim() || !chat}
          className="absolute right-1.5 p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:bg-white/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </form>
    </div>
  )
}


const App = () => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<ActiveMode>('default')
  const [searchValue, setSearchValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const docSnap = await getDoc(doc(db, 'users', u.uid))
          if (docSnap.exists()) setUserData(docSnap.data() as UserData)
        } catch (e) { console.error("Fetch Error:", e) }
      } else { setUserData(null) }
      setAuthLoading(false)
    })
  }, [])

  useEffect(() => {
    if (userData?.onboarded && activeMode !== 'profile') inputRef.current?.focus()
  }, [userData, activeMode])

  useEffect(() => {
    if (!userData?.onboarded) return
    if (activeMode === 'drawing') window.api?.resizeWindow(900, 650)
    else if (activeMode === 'profile') window.api?.resizeWindow(700, 550)
    else if (activeMode === 'problem-assistant') window.api?.resizeWindow(700, 480)
    else window.api?.resizeWindow(700, 480)
  }, [activeMode, userData])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setActiveMode('problem-assistant')
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    
    // Listen for IPC trigger
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
    { id: 'text-sync', icon: <Icons.TextSync />, label: 'Sync' },
    { id: 'video-summary', icon: <Icons.Video />, label: 'Video' },
    { id: 'drawing', icon: <Icons.Drawing />, label: 'Draw' },
    { id: 'problem-assistant', icon: <Icons.Problem />, label: 'Solve' },
    { id: 'recording', icon: <Icons.Recording />, label: 'Rec' },
  ]

  return (
    <div className="h-screen w-screen bg-transparent p-4 flex flex-col items-center selection:bg-blue-500/30">
      <div className="relative w-full flex-1 liquid-glass rounded-[2.5rem] overflow-hidden drag flex flex-col mb-4 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
        
        {/* Header - Now fully draggable background */}
        {activeMode !== 'drawing' && activeMode !== 'profile' && activeMode !== 'problem-assistant' && (
          <div className="relative flex items-center px-8 py-7 border-b border-white/[0.08]">
            <div className="mr-4 text-white/10"><Icons.DragHandle /></div>
            <input ref={inputRef} type="text" className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none placeholder-white/10 no-drag" placeholder="Search..." value={searchValue} onChange={e => setSearchValue(e.target.value)} autoFocus />
          </div>
        )}

        {(activeMode === 'profile' || activeMode === 'problem-assistant') && (
          <div className="relative flex items-center px-8 py-6 border-b border-white/[0.08]">
            <div className="mr-4 text-white/10"><Icons.DragHandle /></div>
            <button onClick={() => setActiveMode('default')} className="mr-4 p-2 hover:bg-white/10 rounded-xl text-white/40 transition-colors no-drag">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-white text-lg font-black uppercase tracking-widest">{activeMode === 'profile' ? 'Profile' : 'Problem Assistant'}</h2>
            {activeMode === 'problem-assistant' && (
              <div className="ml-auto flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Live Screen Active</span>
              </div>
            )}
          </div>
        )}

        {/* Drawing Header handle */}
        {activeMode === 'drawing' && (
          <div className="absolute top-6 left-8 z-50 text-white/10"><Icons.DragHandle /></div>
        )}

        <div className="flex-1 overflow-y-auto no-drag">
          {activeMode === 'default' && <DefaultView onSelectMode={setActiveMode} />}
          {activeMode === 'drawing' && <div className="h-full no-drag"><Tldraw persistenceKey="ghost-hud-canvas" inferDarkMode /></div>}
          {activeMode === 'profile' && <ProfileView userData={userData} />}
          {activeMode === 'problem-assistant' && <ProblemAssistantView />}
        </div>

        {/* Draggable Footer Background */}
        {activeMode !== 'problem-assistant' && (
          <div className="px-8 py-4 flex justify-between items-center bg-white/[0.01] border-t border-white/[0.05]">
            <button onClick={() => setActiveMode('profile')} className="flex items-center space-x-3 no-drag group">
              <div className="relative">
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-widest leading-none">{userData.displayName}</p>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter mt-1">{userData.school}</p>
              </div>
            </button>
            <div className="text-white/5"><Icons.DragHandle /></div>
          </div>
        )}
      </div>

      <div className="flex items-center p-1.5 bg-zinc-900/60 backdrop-blur-2xl rounded-2xl border border-white/10 space-x-1 no-drag shadow-2xl">
        {modes.map(m => (
          <button key={m.id} onClick={() => setActiveMode(m.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${activeMode === m.id ? 'bg-white/10 text-white shadow-inner' : 'text-white/40 hover:text-white/70'}`}>
            <span className={activeMode === m.id ? 'text-blue-400 scale-110' : ''}>{m.icon}</span>
            {activeMode === m.id && <span className="text-[11px] font-bold uppercase tracking-widest">{m.label}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export default App
