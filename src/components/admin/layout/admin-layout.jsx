import { useState } from 'react'
import { Sidebar } from './sidebar'
// TopNav removed: header intentionally omitted

export function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="admin-layout" style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f9fafb',
    }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top Navigation removed */}

        {/* Page Content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#f9fafb',
        }}>
          <div style={{
            padding: '1.5rem',
            maxWidth: '80rem',
            margin: '0 auto',
          }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
