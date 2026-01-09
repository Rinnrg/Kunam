import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { AdminLayout } from '@src/components/admin/layout/admin-layout'
import { Eye, Search, Filter, Download, Package, Truck, CheckCircle, XCircle, Clock, Trash2, Edit2, Save, X } from 'lucide-react'
import Link from 'next/link'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [updateLoading, setUpdateLoading] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)

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
    if (!confirm('Apakah Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan.')) {
      return
    }

    try {
      setDeleteLoading(orderId)
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Remove order from state
        setOrders(orders.filter(order => order.id !== orderId))
        alert('Pesanan berhasil dihapus')
      } else {
        alert(data.message || 'Gagal menghapus pesanan')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Terjadi kesalahan saat menghapus pesanan')
    } finally {
      setDeleteLoading(null)
    }
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
        alert('Status pesanan berhasil diperbarui')
      } else {
        alert(data.message || 'Gagal memperbarui status pesanan')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Terjadi kesalahan saat memperbarui status pesanan')
    } finally {
      setUpdateLoading(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id?.toString().includes(searchQuery) ||
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.users?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

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
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        }}>
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon
            return (
              <div
                key={key}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderLeft: statusFilter === key ? `4px solid ${config.color}` : '1px solid #e5e7eb',
                }}
                onClick={() => setStatusFilter(key)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}>
                    {config.label}
                  </span>
                  <Icon style={{
                    width: '1rem',
                    height: '1rem',
                    color: config.color,
                  }} />
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#111827',
                }}>
                  {orderStats[key]}
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {/* Search Bar */}
          <div style={{
            position: 'relative',
            flex: '1',
            minWidth: '300px',
            maxWidth: '500px',
          }}>
            <Search style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1.25rem',
              height: '1.25rem',
              color: '#9ca3af',
            }} />
            <input
              type="text"
              placeholder="Search by order ID, customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 1rem 0.625rem 2.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.625rem 2rem 0.625rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: '#ffffff',
              color: '#374151',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              style={{
                padding: '0.625rem 1rem',
                backgroundColor: '#ffffff',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Orders Table */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}>
          {filteredOrders.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6b7280',
            }}>
              {searchQuery || statusFilter !== 'all' 
                ? 'No orders found matching your filters.' 
                : 'No orders yet.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}>
                <thead style={{
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  <tr>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Order ID
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Customer
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Date
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Total
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Payment
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'right',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const statusInfo = statusConfig[order.status] || statusConfig.pending
                    const StatusIcon = statusInfo.icon
                    
                    return (
                      <tr
                        key={order.id}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#111827',
                        }}>
                          #{order.orderNumber || order.id}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: '#111827',
                            }}>
                              {order.customerName || order.users?.name || 'N/A'}
                            </div>
                            {(order.customerEmail || order.users?.email) && (
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                marginTop: '0.125rem',
                              }}>
                                {order.customerEmail || order.users?.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#374151',
                        }}>
                          {order.createdAt 
                            ? new Date(order.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#374151',
                          fontWeight: '600',
                        }}>
                          Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {editingOrder === order.id ? (
                            <select
                              defaultValue={order.status}
                              onChange={(e) => {
                                order._newStatus = e.target.value
                              }}
                              style={{
                                padding: '0.375rem 0.5rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                backgroundColor: '#ffffff',
                                color: '#374151',
                                cursor: 'pointer',
                                outline: 'none',
                                width: '100%',
                              }}
                            >
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              borderRadius: '9999px',
                              backgroundColor: statusInfo.bg,
                              color: statusInfo.color,
                            }}>
                              <StatusIcon style={{ width: '0.75rem', height: '0.75rem' }} />
                              {statusInfo.label}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {editingOrder === order.id ? (
                            <select
                              defaultValue={order.paymentStatus}
                              onChange={(e) => {
                                order._newPaymentStatus = e.target.value
                              }}
                              style={{
                                padding: '0.375rem 0.5rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                backgroundColor: '#ffffff',
                                color: '#374151',
                                cursor: 'pointer',
                                outline: 'none',
                                width: '100%',
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="settlement">Paid</option>
                              <option value="paid">Paid</option>
                              <option value="expire">Expired</option>
                              <option value="cancel">Cancelled</option>
                            </select>
                          ) : (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              borderRadius: '9999px',
                              backgroundColor: order.paymentStatus === 'settlement' || order.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                              color: order.paymentStatus === 'settlement' || order.paymentStatus === 'paid' ? '#166534' : '#92400e',
                            }}>
                              {order.paymentStatus === 'settlement' || order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'expire' ? 'Expired' : order.paymentStatus === 'cancel' ? 'Cancelled' : 'Pending'}
                            </span>
                          )}
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'right',
                        }}>
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
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                    color: '#16a34a',
                                    backgroundColor: '#f0fdf4',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: updateLoading === order.id ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: updateLoading === order.id ? 0.5 : 1,
                                  }}
                                  onMouseEnter={(e) => {
                                    if (updateLoading !== order.id) {
                                      e.currentTarget.style.backgroundColor = '#dcfce7'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f0fdf4'
                                  }}
                                >
                                  <Save style={{ width: '1rem', height: '1rem' }} />
                                  {updateLoading === order.id ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingOrder(null)}
                                  disabled={updateLoading === order.id}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                    color: '#6b7280',
                                    backgroundColor: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: updateLoading === order.id ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (updateLoading !== order.id) {
                                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f9fafb'
                                  }}
                                >
                                  <X style={{ width: '1rem', height: '1rem' }} />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingOrder(order.id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                    color: '#f59e0b',
                                    backgroundColor: '#fffbeb',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fef3c7'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fffbeb'
                                  }}
                                >
                                  <Edit2 style={{ width: '1rem', height: '1rem' }} />
                                  Edit
                                </button>
                                <Link
                                  href={`/admin/orders/${order.id}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                    color: '#2563eb',
                                    backgroundColor: '#eff6ff',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#dbeafe'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#eff6ff'
                                  }}
                                >
                                  <Eye style={{ width: '1rem', height: '1rem' }} />
                                  View
                                </Link>
                                <button
                                  onClick={() => handleDelete(order.id)}
                                  disabled={deleteLoading === order.id}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                    color: '#dc2626',
                                    backgroundColor: '#fef2f2',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: deleteLoading === order.id ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: deleteLoading === order.id ? 0.5 : 1,
                                  }}
                                  onMouseEnter={(e) => {
                                    if (deleteLoading !== order.id) {
                                      e.currentTarget.style.backgroundColor = '#fee2e2'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fef2f2'
                                  }}
                                >
                                  <Trash2 style={{ width: '1rem', height: '1rem' }} />
                                  {deleteLoading === order.id ? 'Deleting...' : 'Delete'}
                                </button>
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

        {/* Stats */}
        {filteredOrders.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            color: '#6b7280',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div>
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
            <div style={{ fontWeight: '600', color: '#111827' }}>
              Total Revenue: Rp {filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString('id-ID')}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
