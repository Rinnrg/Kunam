import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { AdminLayout } from '@src/components/admin/layout/admin-layout'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function EditVoucherPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    } else if (status === 'authenticated' && id) {
      fetchVoucher()
    }
  }, [status, id, router])

  const fetchVoucher = async () => {
    try {
      const response = await fetch(`/api/vouchers/${id}`)
      const data = await response.json()
      
      if (data.voucher) {
        const voucher = data.voucher
        setFormData({
          code: voucher.code,
          name: voucher.name,
          description: voucher.description || '',
          discountType: voucher.discountType,
          discountValue: voucher.discountValue.toString(),
          minPurchase: voucher.minPurchase.toString(),
          maxDiscount: voucher.maxDiscount ? voucher.maxDiscount.toString() : '',
          usageLimit: voucher.usageLimit ? voucher.usageLimit.toString() : '',
          startDate: new Date(voucher.startDate).toISOString().slice(0, 16),
          endDate: new Date(voucher.endDate).toISOString().slice(0, 16),
          isActive: voucher.isActive,
        })
      }
    } catch (error) {
      console.error('Error fetching voucher:', error)
      alert('Gagal memuat data voucher')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
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

    setSaving(true)

    try {
      const response = await fetch(`/api/vouchers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui voucher')
      }

      alert('Voucher berhasil diperbarui!')
      router.push('/admin/promotions')
    } catch (error) {
      console.error('Error updating voucher:', error)
      alert(error.message || 'Gagal memperbarui voucher')
    } finally {
      setSaving(false)
    }
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
              marginBottom: '1rem',
            }}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
            Kembali ke Daftar Voucher
          </Link>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: '#111827',
          }}>
            Edit Voucher
          </h1>
        </div>

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
            {/* Similar form fields as create page - I'll include the full form */}
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

            <div style={{
              display: 'flex',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb',
            }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: saving ? '#9ca3af' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                <Save style={{ width: '1rem', height: '1rem' }} />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
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
