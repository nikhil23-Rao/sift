import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { analyzeScreen } from '../services/gemini'

export const TutorOverlay = ({ onExit }: { onExit: () => void }) => {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Initializing...')
  const [annotations, setAnnotations] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [streamingText, setStreamingText] = useState('')

  const analyzeAndAnnotate = async () => {
    if (loading) return
    setLoading(true)
    setStatus('Capturing screen...')
    setStreamingText('')
    
    try {
      if (!window.api?.captureScreen) throw new Error("Capture API missing")
      
      const screenshot = await window.api.captureScreen()
      setStatus('AI is analyzing...')
      
      const base64Data = screenshot.split(',')[1]
      const width = window.screen.width
      const height = window.screen.height

      const prompt = `
        You are an expert AI Tutor. Look at this screenshot and help the user by providing logical, step-by-step text annotations directly on their screen to solve the problem or explain the content.
        
        Analyze the problem visible in the image. Identify key elements and text.
        
        IMPORTANT: Your response must be a JSON object with an "annotations" key containing an array of annotation objects.
        The annotations MUST be in the logical order they should be presented to the student (Step 1, then Step 2, etc.).
        
        Placement Rules:
        - DO NOT cover the central problem or question.
        - Distribute annotations across the LEFT and RIGHT margins of the screen.
        - Alternate sides: Step 1 on the left, Step 2 on the right, Step 3 on the left, etc.
        - For LEFT margin: set x between 50 and 100.
        - For RIGHT margin: set x between ${width - 400} and ${width - 350}.
        - Vertical Position: Keep y consistent for all steps, between 150 and 300, to ensure they are always in the upper viewing area.
        - Screen size: ${width}x${height}.

        Required JSON Structure:
        {
          "annotations": [
            {
              "type": "post-it" | "speech-bubble" | "label",
              "x": number,
              "y": number,
              "content": "Step-by-step explanation here...",
              "color": "blue" | "green" | "pink" | "purple" | "white",
              "step_number": number
            }
          ]
        }
      `

      const result = await analyzeScreen(base64Data, prompt)
      
      let fullText = ''
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullText += chunkText
        setStreamingText(fullText)
      }
      
      console.log("AI Tutor Raw Response:", fullText)

      // Clean up markdown if AI wrapped JSON in ```json ... ```
      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      const cleanJson = jsonMatch ? jsonMatch[0] : fullText

      try {
        const data = JSON.parse(cleanJson)
        const items = data.annotations || []
        
        if (items.length > 0) {
          setAnnotations(items)
          setCurrentStep(1)
          setStatus('Guidance Active')
          window.api?.setIgnoreMouse(true)
        } else {
          setStatus('AI generated no guidance')
        }
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError)
        setStatus('AI response malformed')
      }
    } catch (error: any) {
      console.error("Tutor AI Error:", error)
      setStatus(`Error: ${error.message || 'Tutoring failed'}`)
    } finally {
      setLoading(false)
      setStreamingText('')
    }
  }

  useEffect(() => {
    analyzeAndAnnotate()
  }, [])

  const nextStep = () => {
    if (currentStep < annotations.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <div className="h-screen w-screen bg-transparent relative no-drag overflow-hidden flex flex-col items-center">
      {/* HUD Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 pointer-events-auto shrink-0"
           onMouseEnter={() => window.api?.setIgnoreMouse(false)}
           onMouseLeave={() => window.api?.setIgnoreMouse(true)}>
        <div className="flex items-center space-x-3 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3 shadow-2xl">
          <div className="relative flex items-center justify-center">
            {loading ? (
              <div className="w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-white text-[11px] font-black uppercase tracking-[0.2em]">AI Tutor</span>
          <div className="w-[1px] h-3 bg-white/10 mx-2" />
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{status}</span>
          {annotations.length > 0 && (
            <>
              <div className="w-[1px] h-3 bg-white/10 mx-1" />
              <div className="px-3 py-1 bg-blue-500/10 rounded-lg">
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Step {currentStep} / {annotations.length}</span>
              </div>
            </>
          )}
        </div>

        {annotations.length > 0 && (
          <div className="flex items-center bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl">
            <button 
              onClick={prevStep}
              disabled={currentStep <= 1}
              className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl disabled:opacity-20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            
            <button 
              onClick={nextStep}
              disabled={currentStep >= annotations.length}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-30 disabled:scale-100 disabled:bg-zinc-800"
            >
              <span>Next Step</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}

        <button 
          onClick={() => {
            window.api?.setIgnoreMouse(false)
            onExit()
          }}
          className="bg-white text-black font-black uppercase text-[11px] tracking-[0.2em] px-8 py-3.5 rounded-2xl hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all flex items-center space-x-3 shadow-2xl"
        >
          <span>End Session</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Thought Streaming Overlay */}
      <AnimatePresence>
        {loading && streamingText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-10 right-10 z-50 w-80 max-h-40 liquid-glass p-6 rounded-3xl border border-white/10 pointer-events-none overflow-hidden"
          >
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">AI Thought Stream</span>
            </div>
            <div className="text-white/60 text-xs font-mono line-clamp-4">
              {streamingText}
              <motion.span 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-1.5 h-3 bg-blue-500 ml-1"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annotations Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence mode="wait">
          {annotations.length > 0 && annotations[currentStep - 1] && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ 
                position: 'absolute', 
                left: annotations[currentStep - 1].x, 
                top: annotations[currentStep - 1].y 
              }}
              className="z-40"
            >
              {(() => {
                const ann = annotations[currentStep - 1];
                const colors: any = {
                  blue: 'border-blue-500/50 text-blue-50',
                  green: 'border-emerald-500/50 text-emerald-50',
                  pink: 'border-pink-500/50 text-pink-50',
                  purple: 'border-purple-500/50 text-purple-50',
                  white: 'border-white/20 text-white'
                };
                
                return (
                  <>
                    {ann.type === 'post-it' && (
                      <div className={`liquid-glass w-80 p-6 rounded-[2.5rem] border-2 font-sans text-base leading-relaxed  ${colors[ann.color] || colors.white}`}>
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="px-2 py-0.5 bg-white/10 rounded-md">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 text-inherit">Step {currentStep}</span>
                          </div>
                        </div>
                        {ann.content}
                      </div>
                    )}
                    {ann.type === 'speech-bubble' && (
                      <div className={`liquid-glass relative px-6 py-4 rounded-3xl  border-2 max-w-xs text-base font-bold ${colors[ann.color] || colors.blue}`}>
                        {ann.content}
                        <div className="absolute -bottom-2 left-6 w-4 h-4 rotate-45 border-r-2 border-b-2 border-inherit bg-inherit" />
                      </div>
                    )}
                    {ann.type === 'label' && (
                      <div className={`liquid-glass px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border-2  ${colors[ann.color] || colors.white}`}>
                        {ann.content}
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
