import { useState, useEffect } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { UserData } from '../types'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

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

  return { user, userData, setUserData, authLoading }
}
