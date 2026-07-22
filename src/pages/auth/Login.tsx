import { useState } from 'react'
import hansLogo from '../../assets/hans-logo.png'
import './Login.css'

const API_BASE_URL = 'http://localhost:5656'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  role: string
}

interface LoginProps {
  onLoginSuccess: (token: string, user: AuthUser) => void
}

function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/web/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.message || 'Login failed. Please try again.')
        return
      }

      onLoginSuccess(json.data.token, json.data.user)
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="login">
      <div className="login-card">
        <div className="login-side">
          <div className="login-shape shape-1" />
          <div className="login-shape shape-2" />
          <div className="login-shape shape-3" />

          <div className="login-tabs">
            <span className="login-tab login-tab-active">ADMIN</span>
          </div>
        </div>

        <div className="login-content">
          <img src={hansLogo} className="login-logo" alt="Hans Biomed" />
          <h1>Login</h1>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <svg className="login-field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z M3.5 6.5 12 13l8.5-6.5"
                />
              </svg>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="login-field">
              <svg className="login-field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  d="M6.5 10.5V8a5.5 5.5 0 0 1 11 0v2.5 M5.5 10.5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
                />
              </svg>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <div className="login-actions">
              <a href="#" className="login-forgot">
                Forgot Password?
              </a>
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Logging in...' : 'LOGIN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Login
