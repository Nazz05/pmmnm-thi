import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import logger from '../../../../utils/logger';
import Header from '../../../ui/Header/Header';
import Footer from '../../../ui/Footer/Footer';
import ProductCard from '../../../ui/ProductCard/ProductCard';
import { productService } from '../../../../services/productService';
import { formatCurrency } from '../../../../utils/format';
import './ProductPage.css';

const ProductPage = ({
  title,
  description,
  category,
  products: propProducts = []
}) => {
  const [displayProducts, setDisplayProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load products from local data based on category
  useEffect(() => {
    loadProductsByCategory();
  }, [category]);

  const loadProductsByCategory = async () => {
    try {
      setLoading(true);
      // Fetch products from API
      const allProducts = await productService.listProducts(1, 50);
      
      let filteredProducts;
      if (category === 'all' || !category) {
        filteredProducts = allProducts;
      } else {
        // Filter by category name
        filteredProducts = allProducts.filter(product =>
          product.category?.name === category || product.category === category
        );
      }
      
      // Filter only available products
      const availableProducts = filteredProducts.filter(product =>
        product.stock > 0
      );
      
      setDisplayProducts(availableProducts);
    } catch (error) {
      logger.error('Failed to load products:', error);
      message.error('Không thể tải sản phẩm');
      setDisplayProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'Tất cả sản phẩm' },
    { value: 'Nam', label: 'Thời trang nam' },
    { value: 'Nữ', label: 'Thời trang nữ' },
    { value: 'Giày dép', label: 'Giày dép' },
    { value: 'Phụ kiện', label: 'Phụ kiện' }
  ];

  const handleCategoryChange = (newCategory) => {
    // Navigate to category page
    const categoryMap = {
      'all': '/san-pham',
      'Nam': '/nam',
      'Nữ': '/nu',
      'Giày dép': '/giay',
      'Phụ kiện': '/phu-kien'
    };
    window.location.href = categoryMap[newCategory] || '/san-pham';
  };

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
            <h1 className="page-title">{title}</h1>
            <p className="page-description">
              {description}
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
                        className={`filter-link ${category === cat.value ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(cat.value)}
                      >
                        {cat.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="product-grid">
              {loading ? (
                <div className="loading">Đang tải sản phẩm...</div>
              ) : displayProducts.length > 0 ? (
                <div className="products-grid">
                  {displayProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      image={product.image}
                      fallbackImages={product.images || []}
                      alt={product.name}
                      category={product.category?.name || product.category}
                      name={product.name}
                      currentPrice={formatCurrency(product.price)}
                      oldPrice={product.originPrice ? formatCurrency(product.originPrice) : undefined}
                      link={`/product/${product.id}`}
                      badge={product.stock < 10 ? { text: 'Sắp hết', type: 'warning' } : null}
                    />
                  ))}
                </div>
              ) : (
                <div className="no-products">
                  <p>Không có sản phẩm nào trong danh mục này.</p>
                  <Link to="/san-pham" className="btn btn-primary">Xem tất cả sản phẩm</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;