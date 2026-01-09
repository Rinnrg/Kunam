import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useEffect, useState } from 'react'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']

const STATUS_LABELS = {
  completed: 'Completed',
  processing: 'Processing',
  pending: 'Pending',
  cancelled: 'Cancelled',
}

export function OrdersChart() {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderStats()
  }, [])

  const fetchOrderStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      
      if (response.ok) {
        const ordersByStatus = data.stats?.ordersByStatus || {}
        const formattedData = Object.entries(ordersByStatus).map(([status, count]) => ({
          name: STATUS_LABELS[status] || status,
          value: count,
        })).filter(item => item.value > 0) // Only show statuses with orders
        
        setChartData(formattedData)
      }
    } catch (error) {
      console.error('Error fetching order stats:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#111827',
        }}>
          Order Status
        </h3>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          Loading...
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          No orders yet
        </div>
      ) : (
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

