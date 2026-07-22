import { useState } from 'react'
import hansLogo from '../../assets/hans-logo.png'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <section id="login">
      <div className="login-card">
        <div className="login-side">
          <div className="login-shape shape-1" />
          <div className="login-shape shape-2" />
          <div className="login-shape shape-3" />

          <div className="login-tabs">
            <span className="login-tab login-tab-active">LOGIN</span>
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

            <div className="login-actions">
              <a href="#" className="login-forgot">
                Forgot Password?
              </a>
              <button type="submit" className="login-submit">
                LOGIN
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Login
