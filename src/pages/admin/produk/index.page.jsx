import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { AdminLayout } from '@src/components/admin/layout/admin-layout'
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react'
import Link from 'next/link'

export default function ProductsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated') {
      fetchProducts()
    }
  }, [status])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== id))
        alert('Product deleted successfully')
      } else {
        alert('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
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
            href="/admin/produk/create"
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
            Add Product
          </Link>
        </div>

        {/* Search Bar */}
        <div style={{
          position: 'relative',
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
            placeholder="Search products..."
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

        {/* Products Table */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6b7280',
            }}>
              {searchQuery ? 'No products found matching your search.' : 'No products yet. Add your first product!'}
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
                      Product
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
                      Category
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
                      Price
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
                      Stock
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
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}>
                          {product.images?.[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              style={{
                                width: '3rem',
                                height: '3rem',
                                objectFit: 'cover',
                                borderRadius: '0.375rem',
                                backgroundColor: '#f3f4f6',
                              }}
                            />
                          )}
                          <div>
                            <div style={{
                              fontWeight: '500',
                              color: '#111827',
                              fontSize: '0.875rem',
                            }}>
                              {product.name}
                            </div>
                            {product.sku && (
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                marginTop: '0.125rem',
                              }}>
                                SKU: {product.sku}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: '#374151',
                      }}>
                        {product.category || '-'}
                      </td>
                      <td style={{
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: '#374151',
                        fontWeight: '500',
                      }}>
                        Rp {product.price?.toLocaleString('id-ID') || '0'}
                      </td>
                      <td style={{
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: '#374151',
                      }}>
                        {product.stock || 0}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          borderRadius: '9999px',
                          backgroundColor: product.isActive ? '#dcfce7' : '#fee2e2',
                          color: product.isActive ? '#166534' : '#991b1b',
                        }}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'right',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '0.5rem',
                        }}>
                          <Link
                            href={`/produk/${product.slug || product.id}`}
                            target="_blank"
                            style={{
                              padding: '0.5rem',
                              color: '#6b7280',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6'
                              e.currentTarget.style.color = '#111827'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = '#6b7280'
                            }}
                          >
                            <Eye style={{ width: '1rem', height: '1rem' }} />
                          </Link>
                          <Link
                            href={`/admin/produk/edit/${product.id}`}
                            style={{
                              padding: '0.5rem',
                              color: '#6b7280',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6'
                              e.currentTarget.style.color = '#2563eb'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = '#6b7280'
                            }}
                          >
                            <Edit style={{ width: '1rem', height: '1rem' }} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            style={{
                              padding: '0.5rem',
                              color: '#6b7280',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2'
                              e.currentTarget.style.color = '#dc2626'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = '#6b7280'
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

        {/* Stats */}
        {filteredProducts.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            color: '#6b7280',
          }}>
            <div>
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
