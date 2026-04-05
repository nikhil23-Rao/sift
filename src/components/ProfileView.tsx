import React from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { UserData } from '../types'

export const ProfileView = ({ userData }: { userData: UserData }) => (
  <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 no-drag h-full">
    <div className="flex items-center space-x-6">
      <img src={userData.photoURL} alt="" className="w-24 h-24 rounded-[2.5rem] border-4 border-white/10 " />
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
