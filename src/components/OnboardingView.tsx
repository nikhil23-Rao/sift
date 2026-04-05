import React, { useState } from 'react'
import { User } from 'firebase/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { StudentStatus } from '../types'
import { US_COLLEGES } from '../constants'

export const OnboardingView = ({ user, onComplete }: { user: User, onComplete: (data: any) => Promise<void> }) => {
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
      <div className="relative w-full max-w-md liquid-glass rounded-[2.5rem] p-10 flex flex-col drag min-h-[480px] ">
        <div className="flex space-x-2 mb-8 no-drag">
          {[1, 2, 3].map(i => ( <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-500 ' : 'bg-white/10'}`} /> ))}
        </div>

        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <AnimatePresence mode="wait" custom={step}>
            {step === 1 && (
              <motion.div key="step1" custom={1} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6 no-drag text-center">
                <h2 className="text-white text-2xl font-bold tracking-tight">Confirm Profile</h2>
                <div className="flex flex-col items-center space-y-4">
                  <img src={user.photoURL || ''} alt="" className="w-24 h-24 rounded-[2rem] border-2 border-white/10 " />
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
                    <button key={s} onClick={() => setFormData({...formData, status: s})} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === s ? 'bg-white text-black ' : 'text-white/40 hover:text-white/60'}`}>
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
                        <div className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden  z-50">
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
          <button disabled={(step === 3 && !formData.agreedToTerms) || isFinishing} onClick={() => step === 3 ? handleFinish() : nextStep()} className="flex-[2] bg-white text-black font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase text-[10px] tracking-widest  disabled:opacity-30">
            {isFinishing ? 'Saving...' : step === 3 ? 'Finish Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
