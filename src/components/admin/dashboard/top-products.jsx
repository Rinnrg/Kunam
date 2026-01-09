import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'

export function TopProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopProducts()
  }, [])

  const fetchTopProducts = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      
      if (response.ok) {
        const formattedData = data.topProducts?.map((product) => ({
          name: product.nama,
          sales: product.totalSold,
        })) || []
        setProducts(formattedData)
      }
    } catch (error) {
      console.error('Error fetching top products:', error)
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
          Top Selling Products
        </h3>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          Loading...
        </div>
      ) : products.length === 0 ? (
        <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          No data available
        </div>
      ) : (
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={products}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              />
              <Bar dataKey="sales" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

