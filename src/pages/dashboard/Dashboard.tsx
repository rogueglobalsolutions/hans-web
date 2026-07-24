import { useState, type ReactElement } from 'react'
import type { AuthUser } from '../auth/Login'
import Products from '../products/Products'
import Collections from '../products/Collections'
import Inventory from '../products/Inventory'
import Customers from '../customers/Customers'
import hansLogo from '../../assets/hans-logo.png'
import './Dashboard.css'

interface DashboardProps {
  user: AuthUser
  token: string
  onLogout: () => void
}

interface NavItem {
  label: string
  icon: ReactElement
  badge?: number
  children?: string[]
}

function IconHome() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10 10 4l7 6M5 9v7h10V9" />
    </svg>
  )
}

function IconOrders() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7 10 3l6 4M4 7v10h12V7M4 7l6 4 6-4" />
    </svg>
  )
}

function IconProducts() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10 10 3h7v7l-7 7-7-7Z" />
      <circle cx="13.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconCustomers() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.87 2.69-6 6-6s6 2.13 6 6" />
    </svg>
  )
}

function IconMarketing() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8h3l7-4v12l-7-4H2Z" />
      <path d="M15.5 7.5a3 3 0 0 1 0 5" />
    </svg>
  )
}

function IconDiscounts() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="1.5" />
      <circle cx="14" cy="14" r="1.5" />
      <path d="M15 5 5 15" />
    </svg>
  )
}

function IconContent() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h6l3 3v11H5Z" />
      <path d="M8 9h4M8 12h4M8 15h2" />
    </svg>
  )
}

function IconMarkets() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <path d="M3 10h14M10 3c2.5 2 2.5 12 0 14M10 3c-2.5 2-2.5 12 0 14" />
    </svg>
  )
}

function IconFinance() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8 10 3l7 5M2 8h16M5 8v7M8.3 8v7M11.7 8v7M15 8v7M2 16h16" />
    </svg>
  )
}

function IconAnalytics() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 11v6M9.5 7v10M14.5 3v14" />
    </svg>
  )
}

function IconStore() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8 4 4h12l1 4M4 8v9h12V8M8 17v-5h4v5" />
    </svg>
  )
}

function IconApps() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="12" y="3" width="5" height="5" rx="1" />
      <rect x="3" y="12" width="5" height="5" rx="1" />
      <rect x="12" y="12" width="5" height="5" rx="1" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="2.6" />
      <path d="M17 10h-2M5 10H3M13.5 3.9l-1 1.7M7.5 14.4l-1 1.7M16.1 13.5l-1.7-1M5.6 7.5l-1.7-1M13.5 16.1l-1-1.7M7.5 5.6l-1-1.7M16.1 6.5l-1.7 1M5.6 12.5l-1.7 1" />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8l4 4 4-4" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3a4 4 0 0 0-4 4v2.5L4.5 13h11L14 9.5V7a4 4 0 0 0-4-4Z" />
      <path d="M8.3 16a1.7 1.7 0 0 0 3.4 0" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: <IconHome /> },
  { label: 'Orders', icon: <IconOrders />, badge: 2, children: ['Drafts', 'Shipping Labels', 'Abandoned Checkouts'] },
  { label: 'Products', icon: <IconProducts />, children: ['Collections', 'Inventory', 'Purchase orders', 'Transfers', 'Gift cards'] },
  { label: 'Customers', icon: <IconCustomers />, children: ['Segments'] },
  { label: 'Marketing', icon: <IconMarketing />, children: ['Automations'] },
  { label: 'Discounts', icon: <IconDiscounts /> },
  { label: 'Content', icon: <IconContent /> },
  { label: 'Markets', icon: <IconMarkets /> },
  { label: 'Finance', icon: <IconFinance /> },
  { label: 'Analytics', icon: <IconAnalytics /> },
]

const SESSIONS_CURRENT = [30, 45, 40, 55, 90, 130, 95, 70, 55, 50, 65, 100, 150, 115, 80, 70, 65, 95, 190, 140, 155, 210, 130, 105]
const SESSIONS_PREVIOUS = [50, 55, 60, 58, 65, 70, 80, 75, 70, 68, 72, 78, 85, 90, 95, 88, 80, 85, 100, 110, 105, 95, 90, 85]

function buildPath(values: number[], width: number, height: number) {
  const max = Math.max(...SESSIONS_CURRENT, ...SESSIONS_PREVIOUS)
  const step = width / (values.length - 1)
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - (v / max) * height).toFixed(1)}`)
    .join(' ')
}

function SessionsChart() {
  const width = 640
  const height = 140

  return (
    <div className="dash-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="dash-chart-svg">
        <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} className="dash-chart-grid" />
        <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} className="dash-chart-grid" />
        <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} className="dash-chart-grid" />
        <path d={buildPath(SESSIONS_PREVIOUS, width, height)} className="dash-chart-line-previous" fill="none" />
        <path d={buildPath(SESSIONS_CURRENT, width, height)} className="dash-chart-line-current" fill="none" />
      </svg>
      <div className="dash-chart-axis">
        <span>Sep 6</span>
        <span>Sep 15</span>
        <span>Sep 24</span>
        <span>Oct 3</span>
      </div>
      <div className="dash-chart-legend">
        <span className="dash-legend-item">
          <span className="dash-legend-dot current" />
          Sep 6&ndash;Oct 6, 2025
        </span>
        <span className="dash-legend-item">
          <span className="dash-legend-dot previous" />
          Aug 6&ndash;Sep 5, 2025
        </span>
      </div>
    </div>
  )
}

function Dashboard({ user, token, onLogout }: DashboardProps) {
  const [activeNav, setActiveNav] = useState('Home')
  const [activeChild, setActiveChild] = useState<string | null>(null)
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set())
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const initials = user.fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleNavClick = (item: NavItem) => {
    setActiveNav(item.label)
    setActiveChild(null)
    if (item.children) {
      setOpenMenus((open) => {
        const next = new Set(open)
        if (next.has(item.label)) {
          next.delete(item.label)
        } else {
          next.add(item.label)
        }
        return next
      })
    }
  }

  const handleChildClick = (label: string, child: string) => {
    setActiveNav(label)
    setActiveChild(child)
  }

  const isHome = activeNav === 'Home' && !activeChild
  const isProductsRoot = activeNav === 'Products' && !activeChild
  const isCollectionsRoot = activeNav === 'Products' && activeChild === 'Collections'
  const isInventoryRoot = activeNav === 'Products' && activeChild === 'Inventory'
  const isCustomersRoot = activeNav === 'Customers' && !activeChild

  return (
    <div id="dashboard">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <img src={hansLogo} alt="Hans Biomed" />
        </div>

        <nav className="dash-nav">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="dash-nav-group">
              <button
                type="button"
                className={`dash-nav-item ${activeNav === item.label ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <span className="dash-nav-icon">{item.icon}</span>
                <span className="dash-nav-label">{item.label}</span>
                {item.badge && <span className="dash-nav-badge">{item.badge}</span>}
                {item.children && (
                  <span className={`dash-nav-chevron ${openMenus.has(item.label) ? 'open' : ''}`}>
                    <IconChevron />
                  </span>
                )}
              </button>

              {item.children && openMenus.has(item.label) && (
                <div className="dash-subnav">
                  {item.children.map((child) => (
                    <button
                      key={child}
                      type="button"
                      className={`dash-subnav-item ${activeChild === child ? 'active' : ''}`}
                      onClick={() => handleChildClick(item.label, child)}
                    >
                      {child}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="dash-sidebar-section">
          <p className="dash-sidebar-heading">Sales channels</p>
          <button
            type="button"
            className={`dash-nav-item ${activeNav === 'Online Store' ? 'active' : ''}`}
            onClick={() => handleNavClick({ label: 'Online Store', icon: <IconStore /> })}
          >
            <span className="dash-nav-icon">
              <IconStore />
            </span>
            <span className="dash-nav-label">Online Store</span>
          </button>
        </div>

        <div className="dash-sidebar-footer">
          <button
            type="button"
            className={`dash-nav-item ${activeNav === 'Apps' ? 'active' : ''}`}
            onClick={() => handleNavClick({ label: 'Apps', icon: <IconApps /> })}
          >
            <span className="dash-nav-icon">
              <IconApps />
            </span>
            <span className="dash-nav-label">Apps</span>
          </button>
          <button
            type="button"
            className={`dash-nav-item ${activeNav === 'Settings' ? 'active' : ''}`}
            onClick={() => handleNavClick({ label: 'Settings', icon: <IconSettings /> })}
          >
            <span className="dash-nav-icon">
              <IconSettings />
            </span>
            <span className="dash-nav-label">Settings</span>
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-actions">
            <button type="button" className="dash-icon-btn" aria-label="Notifications">
              <IconBell />
              <span className="dash-icon-dot" />
            </button>

            <div className="dash-user-menu">
              <button
                type="button"
                className="dash-avatar"
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                {initials}
              </button>

              {userMenuOpen && (
                <div className="dash-user-dropdown">
                  <p className="dash-user-name">{user.fullName}</p>
                  <p className="dash-user-email">{user.email}</p>
                  <button type="button" className="dash-logout-btn" onClick={onLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`dash-content${isProductsRoot || isCollectionsRoot || isInventoryRoot || isCustomersRoot ? ' dash-content-wide' : ''}`}>
          {isHome ? (
            <>
              <div className="dash-content-header">
                <h1>Home</h1>
                <div className="dash-filters">
                  <button type="button" className="dash-filter-btn">Last 30 days</button>
                  <button type="button" className="dash-filter-btn">All channels</button>
                  <span className="dash-live">
                    <span className="dash-live-dot" />
                    0 live visitors
                  </span>
                </div>
              </div>

              <div className="dash-stats-card">
                <div className="dash-stats-row">
                  <div className="dash-stat">
                    <p className="dash-stat-label">Sessions</p>
                    <p className="dash-stat-value">
                      851 <span className="dash-stat-delta up">&#9650; 36%</span>
                    </p>
                  </div>
                  <div className="dash-stat">
                    <p className="dash-stat-label">Total sales</p>
                    <p className="dash-stat-value">AED 5,910</p>
                  </div>
                  <div className="dash-stat">
                    <p className="dash-stat-label">Orders</p>
                    <p className="dash-stat-value">3</p>
                  </div>
                  <div className="dash-stat">
                    <p className="dash-stat-label">Conversion rate</p>
                    <p className="dash-stat-value">0.35%</p>
                  </div>
                </div>

                <SessionsChart />
              </div>

              <div className="dash-tasks">
                <div className="dash-task-card">
                  <div className="dash-task-copy">
                    <p className="dash-task-progress">1 of 4 tasks complete</p>
                    <h3>Improve your conversion rate</h3>
                    <p>Increase the percentage of visitors who purchase something from your store.</p>
                  </div>
                  <button type="button" className="dash-task-cta">Resume guide</button>
                </div>

                <div className="dash-task-card">
                  <div className="dash-task-copy">
                    <h3>Get your first 10 sales</h3>
                    <p>Consider the opportunities below to get more visitors to your website and start making sales.</p>
                  </div>
                  <button type="button" className="dash-task-cta">View tasks</button>
                </div>
              </div>
            </>
          ) : isProductsRoot ? (
            <Products token={token} />
          ) : isCollectionsRoot ? (
            <Collections token={token} />
          ) : isInventoryRoot ? (
            <Inventory token={token} />
          ) : isCustomersRoot ? (
            <Customers token={token} />
          ) : (
            <div className="dash-placeholder">
              <h1>{activeChild ?? activeNav}</h1>
              <p>This section is coming soon.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
