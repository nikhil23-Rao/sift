import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { analyzeScreen } from '../services/gemini'

export const ProblemAssistantView = () => {
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [followUp, setFollowUp] = useState('')
  const [chat, setChat] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const captureAndAnalyze = async () => {
    setLoading(true)
    setIsStreaming(true)
    setMessages([{ role: 'assistant', content: '' }])
    
    try {
      if (!window.api?.captureScreen) {
        throw new Error("Screen capture API not found. Please restart the app.")
      }
      const screenshot = await window.api.captureScreen()
      const base64Data = screenshot.split(',')[1]

      const prompt = "You are a helpful problem-solving assistant. Look at this screen and help the user with any problems, questions, or tasks visible. Provide clear, concise, and accurate solutions using proper markdown formatting."
      
      const result = await analyzeScreen(base64Data, prompt)
      
      let fullText = ''
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullText += chunkText
        setMessages([{ role: 'assistant', content: fullText }])
      }
      
      // We need to re-initialize the chat with the history
      // Note: The service should probably handle chat state better, 
      // but keeping it similar to original for now.
      const model = (await import('../services/gemini')).getGeminiModel()
      const newChat = model.startChat({
        history: [
          { role: "user", parts: [{ text: "Help me with my screen." }] },
          { role: "model", parts: [{ text: fullText }] },
        ],
      })
      setChat(newChat)
      
      window.api.resizeWindow(700, 600)
    } catch (error: any) {
      console.error("AI Error:", error)
      setMessages([{ role: 'assistant', content: `Error: ${error.message || 'I couldn\'t analyze the screen'}.` }])
    } finally {
      setLoading(false)
      setIsStreaming(false)
    }
  }

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!followUp.trim() || !chat || loading) return
    
    const userMessage = followUp
    setFollowUp('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: '' }])
    setLoading(true)
    setIsStreaming(true)
    
    try {
      const result = await chat.sendMessageStream(userMessage)
      let fullText = ''
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullText += chunkText
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: fullText }
          return updated
        })
      }
    } catch (error: any) {
      console.error("Follow-up error:", error)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: "Sorry, I encountered an error processing your request." }
        return updated
      })
    } finally {
      setLoading(false)
      setIsStreaming(false)
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
        
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const showCursor = isLast && isStreaming;

          return (msg.content !== '' || (loading && i === messages.length - 1)) ? (
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
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed inline" {...props} />,
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
                    {showCursor && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-1.5 h-4 bg-blue-400 ml-1 translate-y-0.5"
                      />
                    )}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ) : null
        })}
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
