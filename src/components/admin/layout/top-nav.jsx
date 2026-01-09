import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'
import { Menu, Bell, Search } from 'lucide-react'

export function TopNav({ onMenuClick }) {
  return (
    <div style={{
      height: '64px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
    }}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden" 
        onClick={onMenuClick}
      >
        <Menu style={{ width: '1.25rem', height: '1.25rem' }} />
      </Button>

      {/* Search Bar - Hidden on mobile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        margin: '0 1.5rem',
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '24rem',
        }}>
          <Search style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '1rem',
            height: '1rem',
            color: '#9ca3af',
          }} />
          <Input 
            placeholder="Search..." 
            style={{
              paddingLeft: '2.25rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
            }}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <Button variant="ghost" size="icon" style={{ position: 'relative' }}>
          <Bell style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
          <span style={{
            position: 'absolute',
            top: '0.25rem',
            right: '0.25rem',
            width: '0.5rem',
            height: '0.5rem',
            backgroundColor: '#ef4444',
            borderRadius: '9999px',
          }} />
        </Button>

        <div style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '9999px',
          backgroundColor: '#111827',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '600',
          fontSize: '0.875rem',
          cursor: 'pointer',
        }}>
          A
        </div>
      </div>
    </div>
  )
}
