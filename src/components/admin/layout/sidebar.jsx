import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { cn } from '@src/lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Star,
  BarChart3,
  Settings,
  ImageIcon,
  Tag,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
} from 'lucide-react'
import { Button } from '@src/components/ui/button'

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    label: 'Products',
    icon: Package,
    submenu: [
      {
        label: 'All Products',
        icon: List,
        href: '/admin/produk',
      },
      {
        label: 'Add Product',
        icon: Plus,
        href: '/admin/produk/create',
      },
    ],
  },
  {
    label: 'Orders',
    icon: ShoppingCart,
    href: '/admin/orders',
  },
  {
    label: 'Customers',
    icon: Users,
    href: '/admin/customers',
  },
  {
    label: 'Reviews',
    icon: Star,
    href: '/admin/reviews',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    comingSoon: true,
  },
  {
    label: 'Home Sections',
    icon: ImageIcon,
    submenu: [
      {
        label: 'All Sections',
        icon: List,
        href: '/admin/home-sections',
      },
      {
        label: 'Add Section',
        icon: Plus,
        href: '/admin/home-sections/create',
      },
    ],
  },
  {
    label: 'Promotions',
    icon: Tag,
    submenu: [
      {
        label: 'All Vouchers',
        icon: List,
        href: '/admin/promotions',
      },
      {
        label: 'Add Voucher',
        icon: Plus,
        href: '/admin/promotions/create',
      },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings',
    comingSoon: true,
  },
]

export function Sidebar({ isOpen, setIsOpen }) {
  const router = useRouter()
  const [expandedMenus, setExpandedMenus] = useState({})
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  const handleMenuClick = (e, item) => {
    if (item.comingSoon) {
      e.preventDefault()
      alert('🚀 Coming Soon!\n\nThis feature is under development and will be available soon.')
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Clear all admin session data
      await signOut({ redirect: false })
      
      // Clear any local storage or session storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin-token')
        sessionStorage.clear()
      }
      
      // Redirect to admin login page with logout query
      router.push('/admin/login?logout=true')
    } catch (error) {
      console.error('Logout error:', error)
      alert('Failed to logout. Please try again.')
    } finally {
      setIsLoggingOut(false)
      setShowLogoutDialog(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-30" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:relative transition-transform duration-300 z-40 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          width: '256px',
          height: '100vh',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#111827',
          }}>Kunam</h1>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = router.pathname === item.href
              const isExpanded = expandedMenus[item.label]
              
              // Menu item with submenu
              if (item.submenu) {
                const hasActiveSubmenu = item.submenu.some(sub => router.pathname === sub.href)
                
                return (
                  <div key={item.label}>
                    {/* Parent Menu Item */}
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        backgroundColor: hasActiveSubmenu ? '#f3f4f6' : 'transparent',
                        color: hasActiveSubmenu ? '#111827' : '#6b7280',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!hasActiveSubmenu) {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                          e.currentTarget.style.color = '#111827'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!hasActiveSubmenu) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#6b7280'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                        <span>{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown style={{ width: '1rem', height: '1rem' }} />
                      ) : (
                        <ChevronRight style={{ width: '1rem', height: '1rem' }} />
                      )}
                    </button>
                    
                    {/* Submenu Items */}
                    {isExpanded && (
                      <div style={{
                        marginLeft: '2rem',
                        marginTop: '0.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}>
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = router.pathname === subItem.href
                          
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={(e) => handleMenuClick(e, subItem)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                backgroundColor: isSubActive ? '#f3f4f6' : 'transparent',
                                color: isSubActive ? '#111827' : '#6b7280',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSubActive) {
                                  e.currentTarget.style.backgroundColor = '#f9fafb'
                                  e.currentTarget.style.color = '#111827'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSubActive) {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = '#6b7280'
                                }
                              }}
                            >
                              <SubIcon style={{ width: '1rem', height: '1rem' }} />
                              <span>{subItem.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              // Regular menu item without submenu
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleMenuClick(e, item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                    color: isActive ? '#111827' : '#6b7280',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                      e.currentTarget.style.color = '#111827'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#6b7280'
                    }
                  }}
                >
                  <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                  <span>{item.label}</span>
                  {item.comingSoon && (
                    <span style={{
                      marginLeft: 'auto',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      borderRadius: '9999px',
                    }}>
                      Soon
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Logout Section */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #e5e7eb',
        }}>
          <button
            onClick={() => setShowLogoutDialog(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '0.75rem',
              padding: '0.625rem 0.75rem',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              backgroundColor: 'transparent',
              color: '#dc2626',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <LogOut style={{ width: '1.25rem', height: '1.25rem' }} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <>
          {/* Overlay */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 50,
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={() => !isLoggingOut && setShowLogoutDialog(false)}
          />

          {/* Dialog */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 51,
              width: '90%',
              maxWidth: '400px',
              animation: 'slideIn 0.2s ease-out',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                borderRadius: '50%',
              }}>
                <LogOut style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  color: '#dc2626',
                }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                }}>
                  Confirm Logout
                </h3>
              </div>
            </div>

            {/* Content */}
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '1.5rem',
            }}>
              Are you sure you want to logout? You will need to login again to access the admin panel.
            </p>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowLogoutDialog(false)}
                disabled={isLoggingOut}
                style={{
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                  opacity: isLoggingOut ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isLoggingOut) {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoggingOut) {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                style={{
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                  opacity: isLoggingOut ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isLoggingOut) {
                    e.currentTarget.style.backgroundColor = '#b91c1c'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoggingOut) {
                    e.currentTarget.style.backgroundColor = '#dc2626'
                  }
                }}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translate(-50%, -48%);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%);
              }
            }
          `}</style>
        </>
      )}
    </>
  )
}
