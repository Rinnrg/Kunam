import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { AdminLayout } from '@src/components/admin/layout/admin-layout'
import { Eye, Search, Filter, Download, Package, Truck, CheckCircle, XCircle, Clock, Trash2, Edit2, Save, X } from 'lucide-react'
import Link from 'next/link'
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

const statusConfig = {
  pending: { label: 'Pending', bg: '#fef3c7', color: '#92400e', icon: Clock },
  processing: { label: 'Processing', bg: '#dbeafe', color: '#1e40af', icon: Package },
  shipped: { label: 'Shipped', bg: '#e0e7ff', color: '#3730a3', icon: Truck },
  delivered: { label: 'Delivered', bg: '#dcfce7', color: '#166534', icon: CheckCircle },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b', icon: XCircle },
}

export default function OrdersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [updateLoading, setUpdateLoading] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)

  const [showAlert] = useStore(useShallow((state) => [state.showAlert]));
  // Local fallback dialog for Orders page (visible even if global AlertDialog is hampered)
  const [localDialog, setLocalDialog] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/orders')
      const data = await response.json()
      
      if (response.ok) {
        setOrders(data.orders || [])
      } else {
        console.error('Error fetching orders:', data.message)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (orderId) => {
    showAlert({
      type: 'confirm',
      title: 'Hapus Pesanan',
      message: 'Apakah Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          setDeleteLoading(orderId)
          const response = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
          const data = await response.json()
          if (response.ok) {
            setOrders(orders.filter(order => order.id !== orderId))
            showAlert({ type: 'success', title: 'Berhasil', message: 'Pesanan berhasil dihapus' })
          } else {
            showAlert({ type: 'error', title: 'Gagal', message: data.message || 'Gagal menghapus pesanan' })
          }
        } catch (error) {
          console.error('Error deleting order:', error)
          showAlert({ type: 'error', title: 'Terjadi Kesalahan', message: 'Terjadi kesalahan saat menghapus pesanan' })
        } finally {
          setDeleteLoading(null)
        }
      }
    })
    // also show local fallback dialog
    setLocalDialog({
      type: 'confirm',
      title: 'Hapus Pesanan',
      message: 'Apakah Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          setDeleteLoading(orderId)
          const response = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
          const data = await response.json()
          if (response.ok) {
            setOrders(orders.filter(order => order.id !== orderId))
            setLocalDialog({ type: 'success', title: 'Berhasil', message: 'Pesanan berhasil dihapus', confirmText: 'OK' })
          } else {
            setLocalDialog({ type: 'error', title: 'Gagal', message: data.message || 'Gagal menghapus pesanan', confirmText: 'OK' })
          }
        } catch (error) {
          console.error('Error deleting order:', error)
          setLocalDialog({ type: 'error', title: 'Terjadi Kesalahan', message: 'Terjadi kesalahan saat menghapus pesanan', confirmText: 'OK' })
        } finally {
          setDeleteLoading(null)
        }
      }
    })
   }

   const handleUpdateStatus = async (orderId, newStatus, newPaymentStatus) => {
     try {
       setUpdateLoading(orderId)
       const response = await fetch(`/api/admin/orders/${orderId}`, {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           status: newStatus,
           paymentStatus: newPaymentStatus,
         }),
       })
       
       const data = await response.json()
       
       if (response.ok) {
         // Update order in state
         setOrders(orders.map(order => 
           order.id === orderId 
             ? { 
                 ...order, 
                 status: newStatus || order.status,
                 paymentStatus: newPaymentStatus || order.paymentStatus,
                 updatedAt: new Date().toISOString(),
               }
             : order
         ))
         setEditingOrder(null)
         // Debug log before showing alert
         // eslint-disable-next-line no-console
         console.log('[Orders] showAlert success: Status pesanan berhasil diperbarui')
         showAlert({ type: 'success', title: 'Berhasil', message: 'Status pesanan berhasil diperbarui' })
         // local fallback
         setLocalDialog({ type: 'success', title: 'Berhasil', message: 'Status pesanan berhasil diperbarui', confirmText: 'OK' })
       } else {
         // eslint-disable-next-line no-console
         console.log('[Orders] showAlert error:', data.message)
         showAlert({ type: 'error', title: 'Gagal', message: data.message || 'Gagal memperbarui status pesanan' })
       }
     } catch (error) {
       console.error('Error updating order status:', error)
       // eslint-disable-next-line no-console
       console.log('[Orders] showAlert catch error:', error)
       showAlert({ type: 'error', title: 'Terjadi Kesalahan', message: 'Terjadi kesalahan saat memperbarui status pesanan' })
     } finally {
       setUpdateLoading(null)
     }
   }

  const filteredOrders = orders.filter((order) => {
    const statusLower = String(order.status || '').toLowerCase()
    const matchesTab = activeTab === 'all' || statusLower === activeTab

    const q = String(searchQuery || '').toLowerCase()
    const invoice = String(order.orderNumber || order.order || order.id || '')
    const userName = String(order.customerName || order.users?.name || order.customerEmail || order.users?.email || '')

    const matchesSearch = (
      invoice.toLowerCase().includes(q) ||
      userName.toLowerCase().includes(q)
    )

    return matchesTab && matchesSearch
  })
  
  // Counts for top cards/tabs (case-insensitive)
  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => String(o.status || '').toLowerCase() === 'pending').length,
    processing: orders.filter(o => String(o.status || '').toLowerCase() === 'processing').length,
    shipped: orders.filter(o => String(o.status || '').toLowerCase() === 'shipped').length,
    delivered: orders.filter(o => String(o.status || '').toLowerCase() === 'delivered').length,
    cancelled: orders.filter(o => String(o.status || '').toLowerCase() === 'cancelled').length,
  }

  const tabs = [
    { id: 'processing', label: 'Processing', icon: Package, color: '#2563eb', bgColor: '#dbeafe' },
    { id: 'shipped', label: 'Shipped', icon: Truck, color: '#7c3aed', bgColor: '#ede9fe' },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle, color: '#16a34a', bgColor: '#dcfce7' },
    { id: 'pending', label: 'Pending', icon: Clock, color: '#d97706', bgColor: '#fef3c7' },
    { id: 'cancelled', label: 'Cancelled', icon: XCircle, color: '#dc2626', bgColor: '#fee2e2' },
    { id: 'all', label: 'Semua Order', icon: Filter, color: '#6b7280', bgColor: '#f3f4f6' },
  ]

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Tab Menu (click a card to filter */}
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '1rem',
                  backgroundColor: isActive ? '#ffffff' : '#f9fafb',
                  border: `2px solid ${isActive ? tab.color : 'transparent'}`,
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: isActive ? tab.color : '#6b7280' }}>
                    {tab.label}
                  </span>
                  <div style={{ padding: '0.35rem', borderRadius: '0.5rem', backgroundColor: tab.bgColor, color: tab.color }}>
                    <Icon size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                  {orderCounts[tab.id] || 0}
                </div>
              </button>
            )
          })}
        </div>

        {/* Orders Table (filtered by selected tab and search) */}
        <div style={{
          backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden',
        }}>
          {filteredOrders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              {orders.length === 0 ? 'Data pesanan kosong atau gagal dimuat dari server.' : `Tidak ada pesanan di tab "${activeTab.toUpperCase()}"${searchQuery ? ' dengan kata kunci tersebut' : ''}.`}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Order ID</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Payment</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const statusInfo = statusConfig[order.status] || statusConfig.pending
                    const StatusIcon = statusInfo.icon
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>#{order.orderNumber || order.id}</td>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>{order.customerName || order.users?.name || 'N/A'}</div>
                            {(order.customerEmail || order.users?.email) && (<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>{order.customerEmail || order.users?.email}</div>)}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>Rp {(order.totalAmount || 0).toLocaleString('id-ID')}</td>
                        <td style={{ padding: '1rem' }}>
                          {editingOrder === order.id ? (
                            <select
                              defaultValue={order.status}
                              onChange={(e) => { order._newStatus = e.target.value }}
                              style={{ padding: '0.375rem 0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '500', backgroundColor: '#ffffff', color: '#374151', cursor: 'pointer', outline: 'none', width: '100%' }}
                            >
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: '500', borderRadius: '9999px', backgroundColor: statusInfo.bg, color: statusInfo.color }}>
                              <StatusIcon style={{ width: '0.75rem', height: '0.75rem' }} />
                              {statusInfo.label}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {editingOrder === order.id ? (
                            <select
                              defaultValue={order.paymentStatus}
                              onChange={(e) => { order._newPaymentStatus = e.target.value }}
                              style={{ padding: '0.375rem 0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '500', backgroundColor: '#ffffff', color: '#374151', cursor: 'pointer', outline: 'none', width: '100%' }}
                            >
                              <option value="pending">Pending</option>
                              <option value="settlement">Paid</option>
                              <option value="paid">Paid</option>
                              <option value="expire">Expired</option>
                              <option value="cancel">Cancelled</option>
                            </select>
                          ) : (
                            <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: '500', borderRadius: '9999px', backgroundColor: order.paymentStatus === 'settlement' || order.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7', color: order.paymentStatus === 'settlement' || order.paymentStatus === 'paid' ? '#166534' : '#92400e' }}>
                              {order.paymentStatus === 'settlement' || order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'expire' ? 'Expired' : order.paymentStatus === 'cancel' ? 'Cancelled' : 'Pending'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {editingOrder === order.id ? (
                              <>
                                <button
                                  onClick={() => {
                                    const newStatus = order._newStatus || order.status
                                    const newPaymentStatus = order._newPaymentStatus || order.paymentStatus
                                    handleUpdateStatus(order.id, newStatus, newPaymentStatus)
                                  }}
                                  disabled={updateLoading === order.id}
                                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', color: '#16a34a', backgroundColor: 'transparent', border: 'none', borderRadius: '0.25rem', cursor: updateLoading === order.id ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: updateLoading === order.id ? 0.5 : 1 }}
                                  onMouseEnter={(e) => { if (updateLoading !== order.id) { e.currentTarget.style.backgroundColor = '#f0fdf4' } }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                                >
                                  <Save style={{ width: '1rem', height: '1rem' }} />
                                </button>
                                <button
                                  onClick={() => setEditingOrder(null)}
                                  disabled={updateLoading === order.id}
                                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', color: '#6b7280', backgroundColor: 'transparent', border: 'none', borderRadius: '0.25rem', cursor: updateLoading === order.id ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                                  onMouseEnter={(e) => { if (updateLoading !== order.id) { e.currentTarget.style.backgroundColor = '#f9fafb' } }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                                >
                                  <X style={{ width: '1rem', height: '1rem' }} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setEditingOrder(order.id)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', color: '#f59e0b', backgroundColor: 'transparent', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fffbeb' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}><Edit2 style={{ width: '1rem', height: '1rem' }} /></button>
                                <Link href={`/admin/orders/${order.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', color: '#2563eb', backgroundColor: 'transparent', border: 'none', borderRadius: '0.25rem', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}><Eye style={{ width: '1rem', height: '1rem' }} /></Link>
                                <button onClick={() => handleDelete(order.id)} disabled={deleteLoading === order.id} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', color: '#dc2626', backgroundColor: 'transparent', border: 'none', borderRadius: '0.25rem', cursor: deleteLoading === order.id ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: deleteLoading === order.id ? 0.5 : 1 }} onMouseEnter={(e) => { if (deleteLoading !== order.id) { e.currentTarget.style.backgroundColor = '#fef2f2' } }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}><Trash2 style={{ width: '1rem', height: '1rem' }} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Local fallback dialog */}
        {localDialog && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999999 }}>
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setLocalDialog(null)} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#ffffff', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', zIndex: 10000000, width: '90%', maxWidth: '400px', animation: 'slideIn 0.2s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: localDialog.type === 'confirm' ? '#fee2e2' : '#dcfce7', borderRadius: '50%' }}>
                  {/* use simple icon fallback */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: localDialog.type === 'confirm' ? '#dc2626' : '#16a34a' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    {localDialog.type === 'confirm' ? (
                      <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>{localDialog.title || ''}</h3>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>{localDialog.message || ''}</p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                {localDialog.showCancel && (
                  <button onClick={() => setLocalDialog(null)} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.375rem', cursor: 'pointer' }}>
                    {localDialog.cancelText || 'Batal'}
                  </button>
                )}
                <button onClick={() => { if (localDialog.onConfirm) localDialog.onConfirm(); setLocalDialog(null); }} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#ffffff', backgroundColor: localDialog.type === 'confirm' ? '#dc2626' : '#111827', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                  {localDialog.confirmText || 'OK'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
