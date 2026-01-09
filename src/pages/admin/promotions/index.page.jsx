import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { AdminLayout } from '@src/components/admin/layout/admin-layout'
import { Edit, Trash2, Plus, Search, Tag, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function VouchersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, expired

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated') {
      fetchVouchers()
    }
  }, [status])

  const fetchVouchers = async () => {
    try {
      const response = await fetch('/api/vouchers')
      const data = await response.json()
      setVouchers(data.vouchers || [])
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return

    try {
      const response = await fetch(`/api/vouchers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setVouchers(vouchers.filter((v) => v.id !== id))
        alert('Voucher berhasil dihapus')
      } else {
        alert('Gagal menghapus voucher')
      }
    } catch (error) {
      console.error('Error deleting voucher:', error)
      alert('Error menghapus voucher')
    }
  }

  const getVoucherStatus = (voucher) => {
    const now = new Date()
    const startDate = new Date(voucher.startDate)
    const endDate = new Date(voucher.endDate)

    if (!voucher.isActive) return 'inactive'
    if (now < startDate) return 'scheduled'
    if (now > endDate) return 'expired'
    if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) return 'limit-reached'
    return 'active'
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#dcfce7', color: '#166534', text: 'Aktif' },
      expired: { bg: '#fee2e2', color: '#991b1b', text: 'Kadaluarsa' },
      inactive: { bg: '#f3f4f6', color: '#6b7280', text: 'Tidak Aktif' },
      scheduled: { bg: '#dbeafe', color: '#1e40af', text: 'Terjadwal' },
      'limit-reached': { bg: '#fef3c7', color: '#92400e', text: 'Limit Tercapai' },
    }

    const style = styles[status] || styles.inactive

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        backgroundColor: style.bg,
        color: style.color,
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
      }}>
        {style.text}
      </span>
    )
  }

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch = 
      voucher.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false

    const status = getVoucherStatus(voucher)
    if (filterStatus === 'all') return true
    if (filterStatus === 'active') return status === 'active'
    if (filterStatus === 'expired') return status === 'expired' || status === 'limit-reached'
    
    return true
  })

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
        {/* Header Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <Link
            href="/admin/promotions/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb'
            }}
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            Tambah Voucher
          </Link>
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
            minWidth: '250px',
            maxWidth: '400px',
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
              placeholder="Cari voucher..."
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

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.625rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="expired">Kadaluarsa</option>
          </select>
        </div>

        {/* Vouchers Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {filteredVouchers.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '3rem',
              textAlign: 'center',
              color: '#6b7280',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}>
              {searchQuery || filterStatus !== 'all' ? 'Tidak ada voucher yang cocok dengan filter.' : 'Belum ada voucher. Tambahkan voucher pertama Anda!'}
            </div>
          ) : (
            filteredVouchers.map((voucher) => {
              const status = getVoucherStatus(voucher)
              const usagePercentage = voucher.usageLimit 
                ? (voucher.usageCount / voucher.usageLimit) * 100 
                : 0

              return (
                <div
                  key={voucher.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flex: 1,
                    }}>
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#dbeafe',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Tag style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          color: '#2563eb',
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: '700',
                          fontSize: '1rem',
                          color: '#111827',
                          fontFamily: 'monospace',
                          marginBottom: '0.25rem',
                        }}>
                          {voucher.code}
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {voucher.name}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(status)}
                  </div>

                  {/* Discount Info */}
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#2563eb',
                    }}>
                      {voucher.discountType === 'percentage' 
                        ? `${voucher.discountValue}%` 
                        : `Rp ${voucher.discountValue.toLocaleString('id-ID')}`
                      }
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginTop: '0.25rem',
                    }}>
                      {voucher.discountType === 'percentage' ? 'Diskon Persentase' : 'Diskon Nominal'}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar style={{ width: '1rem', height: '1rem' }} />
                      <span>
                        {new Date(voucher.startDate).toLocaleDateString('id-ID')} - {new Date(voucher.endDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp style={{ width: '1rem', height: '1rem' }} />
                      <span>
                        Min. Belanja: Rp {voucher.minPurchase.toLocaleString('id-ID')}
                      </span>
                    </div>
                    {voucher.usageLimit && (
                      <div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.25rem',
                        }}>
                          <span>Penggunaan:</span>
                          <span>{voucher.usageCount} / {voucher.usageLimit}</span>
                        </div>
                        <div style={{
                          height: '0.5rem',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${usagePercentage}%`,
                            backgroundColor: usagePercentage >= 100 ? '#dc2626' : '#2563eb',
                            transition: 'width 0.3s',
                          }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid #e5e7eb',
                  }}>
                    <Link
                      href={`/admin/promotions/edit/${voucher.id}`}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        color: '#2563eb',
                        backgroundColor: '#eff6ff',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dbeafe'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#eff6ff'
                      }}
                    >
                      <Edit style={{ width: '1rem', height: '1rem' }} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(voucher.id)}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        color: '#dc2626',
                        backgroundColor: '#fef2f2',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef2f2'
                      }}
                    >
                      <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      Hapus
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Info */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#1e40af',
        }}>
          <strong>Tips:</strong> Voucher akan otomatis tersedia untuk pelanggan sesuai periode yang ditentukan. Pastikan minimal pembelian dan limit penggunaan sesuai dengan strategi promosi Anda.
        </div>
      </div>
    </AdminLayout>
  )
}
