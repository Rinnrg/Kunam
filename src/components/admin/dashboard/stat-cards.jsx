import { TrendingUp, ShoppingCart, Package, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export function StatCards() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const statCards = stats ? [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: stats.pendingRevenue > 0 ? `${formatCurrency(stats.pendingRevenue)} pending` : 'All settled',
      changeType: 'positive',
      icon: TrendingUp,
      iconColor: '#2563eb',
      iconBg: '#dbeafe',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      change: `${stats.ordersByStatus.pending} pending`,
      changeType: 'positive',
      icon: ShoppingCart,
      iconColor: '#16a34a',
      iconBg: '#dcfce7',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      change: 'Active products',
      changeType: 'positive',
      icon: Package,
      iconColor: '#9333ea',
      iconBg: '#f3e8ff',
    },
    {
      title: 'Total Customers',
      value: stats.totalUsers.toString(),
      change: 'Registered users',
      changeType: 'positive',
      icon: Users,
      iconColor: '#ea580c',
      iconBg: '#ffedd5',
    },
  ] : []

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="animate-pulse" style={{ color: '#9ca3af' }}>Loading...</div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div style={{
      display: 'grid',
      gap: '1rem',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    }}>
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.title}
            style={{
              position: 'relative',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280',
              }}>
                {stat.title}
              </h3>
              <Icon style={{
                width: '1rem',
                height: '1rem',
                color: stat.iconColor,
              }} />
            </div>
            
            {/* Content */}
            <div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#111827',
              }}>
                {stat.value}
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.25rem',
              }}>
                <span style={{ color: '#16a34a', fontWeight: '500' }}>
                  {stat.change}
                </span>
                {' from last month'}
              </p>
            </div>
            
            {/* Decorative icon background */}
            <div style={{
              position: 'absolute',
              top: '0',
              right: '0',
              opacity: '0.1',
            }}>
              <Icon style={{
                width: '8rem',
                height: '8rem',
                marginRight: '-2rem',
                marginTop: '-2rem',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
