import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import Header from '../../components/ui/Header/Header';
import Footer from '../../components/ui/Footer/Footer';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import { formatCurrency } from '../../utils/format';
import './ProductPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || (() => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080/api';
  }
  
  const hostname = window.location.hostname;
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(hostname);
  
  if (isLocalhost) {
    return 'http://localhost:8080/api';
  }
  
  const protocol = window.location.protocol;
  
  // Convert to api subdomain
  if (hostname.startsWith('api.')) {
    return `${protocol}//${hostname}/api`;
  }
  
  return `${protocol}//api.${hostname}/api`;
})();

const categories = [
  { value: 'all', label: 'Tất cả sản phẩm' },
  { value: 'Nam', label: 'Thời trang nam' },
  { value: 'Nữ', label: 'Thời trang nữ' },
  { value: 'Giày dép', label: 'Giày dép' },
  { value: 'Phụ kiện', label: 'Phụ kiện' }
];

const ProductPage = () => {
  const [category, setCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  
  const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect fill="%23f0f0f0" width="300" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3EKhông có ảnh%3C/text%3E%3C/svg%3E';

  // Load products from API
  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL(`${API_BASE_URL}/products`);
      url.searchParams.append('limit', '100');
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      
      const data = await response.json().catch(() => ({}));
      setProducts(data.data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Lỗi khi tải sản phẩm');
      message.error('Lỗi khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (category === 'all') {
      return products;
    }
    return products.filter((product) => product.category === category);
  }, [products, category]);

  return (
    <div className="product-page">
      <Header />

      <main className="product-main">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/" className="breadcrumb-link">Trang chủ</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Sản phẩm</span>
          </div>

          <div className="page-header">
            <h1 className="page-title">Sản phẩm nổi bật</h1>
            <p className="page-description">
              Khám phá bộ sưu tập mới nhất với thiết kế thời trang, chất liệu cao cấp và phong cách đầy cảm hứng.
            </p>
          </div>

          <div className="product-content">
            <aside className="product-sidebar">
              <div className="filter-section">
                <h3 className="filter-title">Danh mục</h3>
                <ul className="filter-list">
                  {categories.map((cat) => (
                    <li key={cat.value}>
                      <button
                        className={`filter-item ${category === cat.value ? 'active' : ''}`}
                        onClick={() => setCategory(cat.value)}
                      >
                        {cat.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="product-grid-section">
              <div className="product-controls">
                <div className="results-count">
                  Hiển thị {filteredProducts.length} sản phẩm
                </div>
              </div>

              <div className="products-grid">
                {loading ? (
                  <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
                    <div className="loading-spinner"></div>
                    <p>Đang tải sản phẩm...</p>
                  </div>
                ) : error ? (
                  <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#f5222d' }}>Lỗi: {error}</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      image={product.image || product.imageUrl || DEFAULT_PLACEHOLDER}
                      alt={product.name}
                      category={product.category}
                      name={product.name}
                      currentPrice={formatCurrency(product.price)}
                      oldPrice={product.oldPrice ? formatCurrency(product.oldPrice) : undefined}
                      link={`/product/${product.id}`}
                    />
                  ))
                ) : (
                  <div className="no-products">Không có sản phẩm trong danh mục này</div>
                )}
              </div>

              <div className="pagination">
                <button className="pagination-btn prev" disabled>
                  <span className="material-icons">chevron_left</span>
                  Trước
                </button>
                <div className="pagination-numbers">
                  <button className="pagination-number active">1</button>
                </div>
                <button className="pagination-btn next" disabled>
                  Sau
                  <span className="material-icons">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
