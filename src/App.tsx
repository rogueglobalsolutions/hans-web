import { useState } from 'react'
import Login, { type AuthUser } from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import './App.css'

const STORAGE_KEY = 'hans_admin_auth'

interface StoredAuth {
  token: string
  user: AuthUser
}

function App() {
  const [auth, setAuth] = useState<StoredAuth | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  })

  const handleLoginSuccess = (token: string, user: AuthUser) => {
    const next = { token, user }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setAuth(next)
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
  }

  if (auth) {
    return <Dashboard user={auth.user} onLogout={handleLogout} />
  }

  return <Login onLoginSuccess={handleLoginSuccess} />
}

export default App
