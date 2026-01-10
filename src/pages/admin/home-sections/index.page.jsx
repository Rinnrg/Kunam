import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { AdminLayout } from '@src/components/admin/layout/admin-layout'
import { Edit, Trash2, Plus, Search, Image as ImageIcon, MoveUp, MoveDown } from 'lucide-react'
import Link from 'next/link'
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

export default function HomeSectionsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPage, setFilterPage] = useState('all') // all, home, produk, etc.
  const [showAlert] = useStore(useShallow((state) => [state.showAlert]));

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated') {
      fetchSections()
    }
  }, [status])

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/home-sections')
      const data = await response.json()
      setSections(data.sections || [])
    } catch (error) {
      console.error('Error fetching sections:', error)
      showAlert({ type: 'error', title: 'Gagal', message: 'Gagal memuat sections' });
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    showAlert({
      type: 'confirm',
      title: 'Hapus Section',
      message: 'Apakah Anda yakin ingin menghapus section ini?',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/home-sections/${id}`, { method: 'DELETE' })
          if (response.ok) {
            setSections(sections.filter((s) => s.id !== id))
            showAlert({ type: 'success', title: 'Berhasil', message: 'Section berhasil dihapus' })
          } else {
            showAlert({ type: 'error', title: 'Gagal', message: 'Gagal menghapus section' })
          }
        } catch (error) {
          console.error('Error deleting section:', error)
          showAlert({ type: 'error', title: 'Terjadi Kesalahan', message: 'Gagal menghapus section' })
        }
      }
    })
  }

  const filteredSections = sections.filter((section) =>
    section.judul?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterPage === 'all' || section.page === filterPage)
  )

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
            href="/admin/home-sections/create"
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
            Tambah Section
          </Link>
        </div>

        {/* Search Bar & Filter */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
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
              placeholder="Cari section..."
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

          {/* Page Filter */}
          <select
            value={filterPage}
            onChange={(e) => setFilterPage(e.target.value)}
            style={{
              padding: '0.625rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Semua Halaman</option>
            <option value="home">Beranda</option>
            <option value="produk">Produk</option>
            <option value="about">Tentang Kami</option>
            <option value="contact">Kontak</option>
            <option value="promo">Promo</option>
          </select>
        </div>

        {/* Sections Table */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}>
          {filteredSections.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6b7280',
            }}>
              {searchQuery ? 'Tidak ada section yang cocok dengan pencarian.' : 'Belum ada section. Tambahkan section pertama Anda!'}
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
                      Section
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Halaman
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Urutan
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Jumlah Gambar
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
                  {filteredSections.map((section) => (
                    <tr
                      key={section.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                        }}>
                          <div style={{
                            width: '4rem',
                            height: '4rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}>
                            {section.images && section.images.length > 0 ? (
                              <img
                                src={section.images[0]}
                                alt={section.judul}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <ImageIcon style={{
                                width: '1.5rem',
                                height: '1.5rem',
                                color: '#9ca3af',
                              }} />
                            )}
                          </div>
                          <div>
                            <div style={{
                              fontWeight: '500',
                              color: '#111827',
                              marginBottom: '0.25rem',
                            }}>
                              {section.judul}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                            }}>
                              ID: {section.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'center',
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textTransform: 'capitalize',
                        }}>
                          {section.page === 'home' ? 'Beranda' : 
                           section.page === 'produk' ? 'Produk' :
                           section.page === 'about' ? 'Tentang Kami' :
                           section.page === 'contact' ? 'Kontak' :
                           section.page === 'promo' ? 'Promo' : section.page}
                        </span>
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'center',
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                        }}>
                          {section.urutan}
                        </span>
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                      }}>
                        {section.images?.length || 0}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '0.5rem',
                        }}>
                          <Link
                            href={`/admin/home-sections/edit/${section.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '2rem',
                              height: '2rem',
                              color: '#2563eb',
                              borderRadius: '0.375rem',
                              transition: 'all 0.2s',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dbeafe'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Edit style={{ width: '1rem', height: '1rem' }} />
                          </Link>
                          <button
                            onClick={() => handleDelete(section.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '2rem',
                              height: '2rem',
                              color: '#dc2626',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.375rem',
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
                            <Trash2 style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <strong>Tips:</strong> Urutan section menentukan posisi tampilan di halaman home. Semakin kecil angka urutan, semakin atas posisinya.
        </div>
      </div>
    </AdminLayout>
  )
}
