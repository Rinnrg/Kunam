import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import styles from './SearchDropdown.module.scss';

function SearchDropdown({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((term) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  // Search API call
  const searchProducts = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&limit=8`);
      const data = await res.json();
      setResults(data.results || []);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchProducts]);

  // Handle input change
  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  // Handle search submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      router.push(`/produk?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      if (onClose) onClose();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'category') {
      router.push(`/produk?kategori=${encodeURIComponent(suggestion.value)}`);
    } else if (suggestion.type === 'product') {
      router.push(`/produk/${suggestion.id}`);
    }
    saveRecentSearch(suggestion.value);
    setIsOpen(false);
    if (onClose) onClose();
  };

  // Handle recent search click
  const handleRecentClick = (term) => {
    setQuery(term);
    router.push(`/produk?search=${encodeURIComponent(term)}`);
    setIsOpen(false);
    if (onClose) onClose();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input on open
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Popular searches (static for now)
  const popularSearches = [
    'T-Shirt',
    'Hoodie',
    'Jacket',
    'Pants',
    'Accessories',
  ];

  return (
    <div className={styles.searchContainer} ref={dropdownRef}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder="Cari produk..."
            className={styles.searchInput}
            aria-label="Cari produk"
          />
          {query && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => setQuery('')}
              aria-label="Hapus pencarian"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <div className={styles.dropdown}>
          {isLoading && (
            <div className={styles.loadingState}>
              <span>Mencari...</span>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className={styles.noResults}>
              <p>Tidak ditemukan hasil untuk "{query}"</p>
            </div>
          )}

          {!isLoading && query && results.length > 0 && (
            <>
              {suggestions.length > 0 && (
                <div className={styles.suggestionsSection}>
                  <h4 className={styles.sectionTitle}>Saran Pencarian</h4>
                  <ul className={styles.suggestionsList}>
                    {suggestions.map((suggestion, index) => (
                      <li key={`${suggestion.type}-${index}`}>
                        <button
                          type="button"
                          className={styles.suggestionItem}
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>{suggestion.label}</span>
                          {suggestion.type === 'category' && (
                            <span className={styles.badge}>Kategori</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.resultsSection}>
                <h4 className={styles.sectionTitle}>Produk</h4>
                <ul className={styles.resultsList}>
                  {results.slice(0, 5).map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/produk/${product.id}`}
                        className={styles.resultItem}
                        onClick={() => {
                          saveRecentSearch(product.nama);
                          setIsOpen(false);
                          if (onClose) onClose();
                        }}
                      >
                        {product.gambar && product.gambar[0] && (
                          <div className={styles.resultImage}>
                            <Image
                              src={product.gambar[0]}
                              alt={product.nama}
                              width={50}
                              height={50}
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        )}
                        <div className={styles.resultInfo}>
                          <span className={styles.resultName}>{product.nama}</span>
                          <span className={styles.resultCategory}>{product.kategori}</span>
                          <span className={styles.resultPrice}>
                            Rp {product.diskon > 0
                              ? (product.harga * (1 - product.diskon / 100)).toLocaleString('id-ID')
                              : product.harga.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                {results.length > 5 && (
                  <button
                    type="button"
                    className={styles.viewAllButton}
                    onClick={handleSubmit}
                  >
                    Lihat semua {results.length} hasil
                  </button>
                )}
              </div>
            </>
          )}

          {!isLoading && !query && (
            <>
              {recentSearches.length > 0 && (
                <div className={styles.recentSection}>
                  <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>Pencarian Sebelumnya:</h4>
                    <button
                      type="button"
                      className={styles.clearAll}
                      onClick={clearRecentSearches}
                    >
                      Hapus Semua
                    </button>
                  </div>
                  <div className={styles.recentTags}>
                    {recentSearches.map((term, index) => (
                      <button
                        key={index}
                        type="button"
                        className={styles.recentTag}
                        onClick={() => handleRecentClick(term)}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.popularSection}>
                <h4 className={styles.sectionTitle}>Pencarian Populer</h4>
                <ul className={styles.popularList}>
                  {popularSearches.map((term, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        className={styles.popularItem}
                        onClick={() => handleRecentClick(term)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{term}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchDropdown;
