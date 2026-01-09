import { StatCards } from './stat-cards'
import { RevenueChart } from './revenue-chart'
import { OrdersChart } from './orders-chart'
import { RecentOrders } from './recent-orders'
import { TopProducts } from './top-products'

export function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stat Cards */}
      <StatCards />

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: '1fr',
      }}>
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}>
          <div style={{ gridColumn: 'span 2 / span 2' }}>
            <RevenueChart />
          </div>
          <div>
            <OrdersChart />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      }}>
        <RecentOrders />
        <TopProducts />
      </div>
    </div>
  )
}
