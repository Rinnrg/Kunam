import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { AdminLayout } from '@src/components/admin/layout/admin-layout'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function CreateVoucherPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minPurchase: '0',
    maxDiscount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    isActive: true,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Kode voucher wajib diisi'
    } else if (!/^[A-Z0-9]+$/.test(formData.code.toUpperCase())) {
      newErrors.code = 'Kode hanya boleh berisi huruf kapital dan angka'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nama voucher wajib diisi'
    }

    if (!formData.discountValue) {
      newErrors.discountValue = 'Nilai diskon wajib diisi'
    } else {
      const value = parseFloat(formData.discountValue)
      if (value <= 0) {
        newErrors.discountValue = 'Nilai diskon harus lebih dari 0'
      }
      if (formData.discountType === 'percentage' && value > 100) {
        newErrors.discountValue = 'Persentase diskon tidak boleh lebih dari 100%'
      }
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Tanggal mulai wajib diisi'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Tanggal berakhir wajib diisi'
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = 'Tanggal berakhir harus setelah tanggal mulai'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat voucher')
      }

      alert('Voucher berhasil dibuat!')
      router.push('/admin/promotions')
    } catch (error) {
      console.error('Error creating voucher:', error)
      alert(error.message || 'Gagal membuat voucher')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link
            href="/admin/promotions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
            Kembali ke Daftar Voucher
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}>
            {/* Kode Voucher */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem',
              }}>
                Kode Voucher *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="DISKON50K"
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  border: errors.code ? '1px solid #dc2626' : '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                }}
              />
              {errors.code && (
                <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.code}
                </p>
              )}
            </div>

            {/* Nama Voucher */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem',
              }}>
                Nama Voucher *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Diskon Akhir Tahun 50%"
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  border: errors.name ? '1px solid #dc2626' : '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              {errors.name && (
                <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Deskripsi */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem',
              }}>
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Deskripsi singkat tentang voucher ini..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Tipe dan Nilai Diskon */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Tipe Diskon *
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal (Rp)</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Nilai Diskon *
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  placeholder={formData.discountType === 'percentage' ? '10' : '50000'}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    border: errors.discountValue ? '1px solid #dc2626' : '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
                {errors.discountValue && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.discountValue}
                  </p>
                )}
              </div>
            </div>

            {/* Min Purchase & Max Discount */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Minimal Pembelian (Rp)
                </label>
                <input
                  type="number"
                  name="minPurchase"
                  value={formData.minPurchase}
                  onChange={handleChange}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem',
                  }}>
                    Maksimal Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleChange}
                    placeholder="Kosongkan jika tidak ada batas"
                    style={{
                      width: '100%',
                      padding: '0.625rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Usage Limit */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem',
              }}>
                Batas Penggunaan
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleChange}
                placeholder="Kosongkan untuk unlimited"
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Jumlah maksimal voucher dapat digunakan oleh pelanggan
              </p>
            </div>

            {/* Date Range */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Tanggal Mulai *
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    border: errors.startDate ? '1px solid #dc2626' : '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
                {errors.startDate && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Tanggal Berakhir *
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    border: errors.endDate ? '1px solid #dc2626' : '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
                {errors.endDate && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>

            {/* Is Active */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                style={{
                  width: '1rem',
                  height: '1rem',
                  cursor: 'pointer',
                }}
              />
              <label style={{
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer',
              }}>
                Aktifkan voucher
              </label>
            </div>

            {/* Submit Button */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb',
            }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Save style={{ width: '1rem', height: '1rem' }} />
                {loading ? 'Menyimpan...' : 'Simpan Voucher'}
              </button>

              <Link
                href="/admin/promotions"
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                Batal
              </Link>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
