import React, { useState } from 'react'
import { signOut } from 'firebase/auth'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'
import { UserData } from '../types'
import { Icons } from './Icons'

export const ProfileView = ({ userData }: { userData: UserData }) => {
  const [connecting, setConnecting] = useState(false)

  const handleConnectDrive = async () => {
    setConnecting(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential?.accessToken

      if (token) {
        await updateDoc(doc(db, 'users', userData.uid), {
          googleDriveConnected: true,
          googleDriveAccessToken: token
        })
      }
    } catch (e) {
      console.error("Failed to connect Google Drive:", e)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnectDrive = async () => {
    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        googleDriveConnected: false,
        googleDriveAccessToken: null
      })
    } catch (e) {
      console.error("Failed to disconnect Google Drive:", e)
    }
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 no-drag h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center space-x-6">
        <img src={userData.photoURL} alt="" className="w-24 h-24 rounded-[2.5rem] border-4 border-white/10 shadow-2xl" />
        <div className="space-y-1">
          <h2 className="text-white text-3xl font-bold tracking-tight">{userData.displayName}</h2>
          <p className="text-white/40 font-medium">{userData.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-1 hover:bg-white/[0.08] transition-colors">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Institution</p>
          <p className="text-white font-semibold text-lg truncate">{userData.school || 'N/A'}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-1 hover:bg-white/[0.08] transition-colors">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Graduation</p>
          <p className="text-white font-semibold text-lg">{userData.gradYear || 'N/A'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">Third-Party Connections</h3>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-4">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <Icons.GoogleDrive />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Google Drive</p>
                <p className="text-white/40 text-xs font-medium">Search and manage documents</p>
              </div>
            </div>
            {userData.googleDriveConnected ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-xl border border-green-500/20">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Connected</span>
                </div>
                <button
                  onClick={handleDisconnectDrive}
                  className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectDrive}
                disabled={connecting}
                className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => signOut(auth)}
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl border border-red-500/20 transition-all uppercase text-[10px] tracking-[0.2em]"
      >
        Sign Out
      </button>
    </div>
  )
}
