import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import EmailDashboard from './components/EmailDashboard'

function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'email'>('dashboard')

  return (
    <div className="app-container">
      <nav className="app-navigation">
        <div className="nav-brand">
          <h1>AuraLink IoT</h1>
        </div>
        <div className="nav-links">
          <button
            className={activeView === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveView('dashboard')}
          >
            📊 Sensor Dashboard
          </button>
          <button
            className={activeView === 'email' ? 'active' : ''}
            onClick={() => setActiveView('email')}
          >
            📧 Email Management
          </button>
        </div>
      </nav>
      <main className="app-main">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'email' && <EmailDashboard />}
      </main>
    </div>
  )
}

export default App
