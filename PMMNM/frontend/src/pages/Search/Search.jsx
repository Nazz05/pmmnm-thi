import React, { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import Header from '../../components/ui/Header/Header';
import Footer from '../../components/ui/Footer/Footer';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import { formatCurrency } from '../../utils/format';
import './Search.css';

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

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      message.warning('Vui lòng nhập từ khóa tìm kiếm');
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const keyword = searchTerm.trim();
      const response = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(keyword)}&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to search products');
      }
      
      const data = await response.json().catch(() => ({}));
      const filteredResults = data.data || [];

      // Update all state at once
      setSearchResults(filteredResults);
      setIsSearching(false);

      if (filteredResults.length === 0) {
        message.info('Không tìm thấy sản phẩm nào phù hợp');
      } else {
        message.success(`Tìm thấy ${filteredResults.length} sản phẩm`);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      message.error('Lỗi khi tìm kiếm sản phẩm');
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  const handleInputChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoize results to prevent re-renders
  const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect fill="%23f0f0f0" width="300" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3EKhông có ảnh%3C/text%3E%3C/svg%3E';
  
  const memoizedResults = useMemo(() => {
    return searchResults.map((product) => (
      <ProductCard
        key={product.id}
        image={product.image || product.imageUrl || DEFAULT_PLACEHOLDER}
        alt={product.name}
        category={product.category?.name || product.category || 'Sản phẩm'}
        name={product.name}
        currentPrice={formatCurrency(product.price)}
        oldPrice={product.originPrice ? formatCurrency(product.originPrice) : undefined}
        link={`/product/${product.id}`}
      />
    ));
  }, [searchResults]);

  return (
    <div className="search-page">
      <Header />

      <main className="search-main">
        <div className="container">
          <div className="search-header">
            <h1>Tìm kiếm sản phẩm</h1>
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  className="search-input"
                />
                <button type="submit" className="search-btn" disabled={isSearching}>
                  <span className="material-icons">
                    {isSearching ? 'hourglass_empty' : 'search'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          <div className="search-results">
            {isSearching ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Đang tìm kiếm...</p>
              </div>
            ) : hasSearched ? (
              searchResults.length > 0 ? (
                <>
                  <div className="results-header">
                    <p>Tìm thấy <strong>{searchResults.length}</strong> sản phẩm</p>
                  </div>
                  <div className="products-grid">
                    {memoizedResults}
                  </div>
                </>
              ) : (
                <div className="no-results">
                  <div className="no-results-icon">
                    <span className="material-icons">search_off</span>
                  </div>
                  <h3>Không tìm thấy sản phẩm</h3>
                  <p>Không có sản phẩm nào phù hợp với từ khóa "<strong>{searchTerm}</strong>"</p>
                  <div className="suggestions">
                    <h4>Gợi ý tìm kiếm:</h4>
                    <ul>
                      <li>Kiểm tra chính tả</li>
                      <li>Sử dụng từ khóa khác</li>
                      <li>Tìm kiếm theo danh mục sản phẩm</li>
                    </ul>
                  </div>
                </div>
              )
            ) : (
              <div className="search-placeholder">
                <div className="placeholder-icon">
                  <span className="material-icons">search</span>
                </div>
                <h3>Bắt đầu tìm kiếm</h3>
                <p>Nhập tên sản phẩm hoặc danh mục để tìm kiếm</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;
