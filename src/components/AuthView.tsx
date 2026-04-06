import React, { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'
import { Icons } from './Icons'

export const AuthView = () => {
  const [loading, setLoading] = useState(false)
  const handleSignIn = async () => {
    setLoading(true)
    try { 
      const result = await signInWithPopup(auth, googleProvider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential?.accessToken

      if (token) {
        const userRef = doc(db, 'users', result.user.uid)
        const docSnap = await getDoc(userRef)
        
        if (docSnap.exists()) {
          await updateDoc(userRef, {
            googleDriveAccessToken: token,
            googleDriveConnected: true
          })
        } else {
          // New user creation handled by App.tsx handleOnboardingComplete usually,
          // but we can pre-set the token here if we want.
          // App.tsx handles the actual "onboarded" flow.
        }
      }
    } 
    catch (e) { console.error("Sign-in error:", e) } 
    finally { setLoading(false) }
  }
  return (
    <div className="flex items-center justify-center h-full w-full p-8">
      <div className="relative w-full max-sm liquid-glass rounded-[2.5rem] p-10 flex flex-col items-center text-center drag ">
        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-8 shadow-[0_0_30px_rgba(59,130,246,0.5)]"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
        <h1 className="text-white text-3xl font-bold mb-2 tracking-tight">Sift HUD</h1>
        <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium">Please sign in to continue.</p>
        <button onClick={handleSignIn} disabled={loading} className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all hover:scale-[1.02] active:scale-[0.98]  disabled:opacity-50 no-drag"><Icons.Google /><span>{loading ? 'Connecting...' : 'Sign in with Google'}</span></button>
      </div>
    </div>
  )
}
