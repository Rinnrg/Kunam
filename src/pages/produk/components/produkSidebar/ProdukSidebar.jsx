import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './ProdukSidebar.module.scss';

// Default filter categories
const CATEGORIES = ['T-Shirt', 'Hoodie', 'Jacket', 'Pants', 'Shorts', 'Accessories'];

// Color options with their hex codes
const COLOR_OPTIONS = [
  { name: 'Beige', color: '#D4B896' },
  { name: 'Black', color: '#000000' },
  { name: 'Blue', color: '#0066CC' },
  { name: 'Brown', color: '#8B4513' },
  { name: 'Gold', color: '#FFD700' },
  { name: 'Green', color: '#228B22' },
  { name: 'Grey', color: '#808080' },
  { name: 'Multi', color: 'linear-gradient(135deg, #ff0000, #00ff00, #0000ff)' },
  { name: 'Orange', color: '#FF8C00' },
  { name: 'Pink', color: '#FF69B4' },
  { name: 'Purple', color: '#800080' },
  { name: 'Red', color: '#DC143C' },
  { name: 'Silver', color: '#C0C0C0' },
  { name: 'Turquoise', color: '#40E0D0' },
  { name: 'White', color: '#FFFFFF' },
  { name: 'Yellow', color: '#FFD700' },
];

// Price range options
const PRICE_RANGE_OPTIONS = [
  { label: 'Rp 0 - Rp 100.000', min: 0, max: 100000 },
  { label: 'Rp 100.000 - Rp 250.000', min: 100000, max: 250000 },
  { label: 'Rp 250.000 - Rp 500.000', min: 250000, max: 500000 },
  { label: 'Rp 500.000 - Rp 1.000.000', min: 500000, max: 1000000 },
  { label: 'Rp > 1.000.000', min: 1000000, max: null },
];

const DISCOUNT_OPTIONS = [
  { label: 'Semua', value: '' },
  { label: '10% ke atas', value: '10' },
  { label: '20% ke atas', value: '20' },
  { label: '30% ke atas', value: '30' },
  { label: '50% ke atas', value: '50' },
];

function FilterSection({ title, isOpen, onToggle, children }) {
  return (
    <div className={styles.filterSection}>
      <button
        type="button"
        className={styles.filterHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.filterTitle}>{title}</span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className={styles.filterContent}>
          {children}
        </div>
      )}
    </div>
  );
}

function ProdukSidebar({ produkList = [], onFilterChange }) {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  
  // Section open states
  const [openSections, setOpenSections] = useState({
    category: false,
    color: false,
    price: false,
    discount: false,
  });

  // Get unique categories from products
  const availableCategories = [...new Set(produkList.map((p) => p.kategori))].filter(Boolean);
  const categories = availableCategories.length > 0 ? availableCategories : CATEGORIES;

  // Get colors from COLOR_OPTIONS
  const colors = COLOR_OPTIONS;

  // Toggle section
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Apply filters
  const applyFilters = useCallback(() => {
    const filters = {
      search: '',
      categories: selectedCategories,
      colors: selectedColors,
      discount: selectedDiscount,
      priceMin: priceRange.min,
      priceMax: priceRange.max,
    };

    if (onFilterChange) {
      onFilterChange(filters);
    }

    // Update URL with filters
    const query = {};
    if (filters.categories.length === 1) query.kategori = filters.categories[0];
    if (filters.discount) query.diskon = filters.discount;

    router.push({
      pathname: '/produk',
      query,
    }, undefined, { shallow: true });
  }, [selectedCategories, selectedColors, selectedDiscount, priceRange, onFilterChange, router]);

  // Apply filters on change
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategories, selectedColors, selectedDiscount, priceRange, applyFilters]);

  // Initialize from URL
  useEffect(() => {
    const { kategori, diskon } = router.query;
    if (kategori) setSelectedCategories([kategori]);
    if (diskon) setSelectedDiscount(diskon);
  }, [router.query]);

  // Handle category toggle
  const toggleCategory = (category) => {
    setSelectedCategories((prev) => (
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    ));
  };

  // Handle color toggle
  const toggleColor = (color) => {
    setSelectedColors((prev) => (
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : [...prev, color]
    ));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedDiscount('');
    setPriceRange({ min: '', max: '' });
    setSelectedPriceRange(null);
    router.push('/produk', undefined, { shallow: true });
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedColors.length > 0 || selectedDiscount || priceRange.min || priceRange.max;

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Filter</h2>
        {hasActiveFilters && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={clearAllFilters}
          >
            Reset
          </button>
        )}
      </div>

      {/* Category Filter */}
      <FilterSection
        title="Kategori"
        isOpen={openSections.category}
        onToggle={() => toggleSection('category')}
      >
        <ul className={styles.filterList}>
          {categories.map((category) => (
            <li key={category}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className={styles.checkbox}
                />
                <span className={styles.checkmark} />
                <span className={styles.labelText}>{category}</span>
                <span className={styles.count}>
                  ({produkList.filter((p) => p.kategori === category).length})
                </span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* Color Filter */}
      <FilterSection
        title="Warna"
        isOpen={openSections.color}
        onToggle={() => toggleSection('color')}
      >
        <div className={styles.colorGrid}>
          {colors.map((colorItem) => (
            <button
              key={colorItem.name}
              type="button"
              className={`${styles.colorTag} ${selectedColors.includes(colorItem.name) ? styles.selected : ''}`}
              onClick={() => toggleColor(colorItem.name)}
            >
              <span
                className={styles.colorBox}
                style={{
                  background: colorItem.color,
                  border: colorItem.name === 'White' ? '1px solid #ccc' : undefined,
                }}
              />
              <span>{colorItem.name}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Filter */}
      <FilterSection
        title="Harga"
        isOpen={openSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className={styles.priceInputs}>
          <input
            type="number"
            value={priceRange.min}
            onChange={(e) => {
              setPriceRange((prev) => ({ ...prev, min: e.target.value }));
              setSelectedPriceRange(null);
            }}
            placeholder="Harga..."
            className={styles.priceInput}
          />
          <span className={styles.priceSeparator}>–</span>
          <input
            type="number"
            value={priceRange.max}
            onChange={(e) => {
              setPriceRange((prev) => ({ ...prev, max: e.target.value }));
              setSelectedPriceRange(null);
            }}
            placeholder="Harga..."
            className={styles.priceInput}
          />
        </div>
        <ul className={styles.priceRangeOptions}>
          {PRICE_RANGE_OPTIONS.map((option, index) => (
            <li key={index}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="priceRange"
                  checked={selectedPriceRange === index}
                  onChange={() => {
                    setSelectedPriceRange(index);
                    setPriceRange({
                      min: option.min.toString(),
                      max: option.max ? option.max.toString() : '',
                    });
                  }}
                  className={styles.radio}
                />
                <span className={styles.radioMark} />
                <span className={styles.labelText}>{option.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* Discount Filter */}
      <FilterSection
        title="Diskon"
        isOpen={openSections.discount}
        onToggle={() => toggleSection('discount')}
      >
        <ul className={styles.filterList}>
          {DISCOUNT_OPTIONS.map((option) => (
            <li key={option.value}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="discount"
                  value={option.value}
                  checked={selectedDiscount === option.value}
                  onChange={() => setSelectedDiscount(option.value)}
                  className={styles.radio}
                />
                <span className={styles.radioMark} />
                <span className={styles.labelText}>{option.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>
    </aside>
  );
}

export default ProdukSidebar;
