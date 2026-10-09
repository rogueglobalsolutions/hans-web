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
      <aside className="login-brand">
        <div className="login-logo-plate">
          <img src={hansLogo} className="login-logo" alt="Hans Biomed" />
        </div>
        <div className="login-brand-copy">
          <p className="login-brand-title">Admin</p>
          <p className="login-brand-sub">Orders, products, customers and discounts for Hans Biomed.</p>
        </div>
      </aside>

      <div className="login-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <img src={hansLogo} className="login-logo-compact" alt="Hans Biomed" />
          <h1>Log in</h1>
          <p className="login-lede">Use your Hans Biomed admin account.</p>

          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <div className="login-field-head">
              <label htmlFor="password">Password</label>
              <a href="#" className="login-forgot">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default Login
