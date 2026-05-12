import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
import logger from '../../../../utils/logger';
import Header from '../../../ui/Header/Header';
import Footer from '../../../ui/Footer/Footer';
import { productService } from '../../../../services/productService';
import { formatCurrency } from '../../../../utils/format';
import { useAuth } from '../../../../context/AuthContext';
import { useCart } from '../../../../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // Load product data from local data
  useEffect(() => {
    loadProductDetail();
  }, [id]);

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      const data = await productService.getProductDetail(id);
      if (data) {
        setProduct(data);
        if (data.image) {
          setSelectedImage(0);
        }
      } else {
        message.error('Sản phẩm không tồn tại');
        navigate('/san-pham');
      }
    } catch (error) {
      logger.error('Failed to load product:', error);
      message.error('Không thể tải chi tiết sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <Header />
        <div className="product-detail-container">
          <Spin size="large" style={{ margin: '100px auto' }} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <Header />
        <main className="product-detail-container">
          <div className="error-message">
            <h2>Sản phẩm không tồn tại</h2>
            <p>Sản phẩm bạn tìm kiếm có thể đã được gỡ bỏ hoặc không còn khả dụng.</p>
            <button
              onClick={() => navigate('/san-pham')}
              className="btn btn-primary"
            >
              Quay về danh sách sản phẩm
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOutOfStock = (product.stock || 0) <= 0;
  const availableQuantity = product.stock || 0;

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= availableQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    if (!user?.id) {
      message.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }

    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image,
        quantity: quantity,
      });
      message.success('Sản phẩm đã được thêm vào giỏ hàng');
    } catch (error) {
      message.error('Lỗi khi thêm vào giỏ hàng');
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    if (!user?.id) {
      message.error('Vui lòng đăng nhập để mua hàng');
      navigate('/login');
      return;
    }

    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image,
        quantity: quantity,
      });
      message.success('Sản phẩm đã được thêm vào giỏ. Đi tới thanh toán...');
      navigate('/cart');
    } catch (error) {
      message.error('Lỗi khi mua sản phẩm');
    }
  };

  const formatPrice = (price) => {
    return formatCurrency(price);
  };

  return (
    <div className="product-detail-page">
      <Header />

      <main className="product-detail-container">
        <div className="container">
          <div className="breadcrumb">
            <span onClick={() => navigate('/')} className="breadcrumb-link">Trang chủ</span>
            <span className="breadcrumb-separator">/</span>
            <span onClick={() => navigate('/san-pham')} className="breadcrumb-link">Sản phẩm</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{product.name}</span>
          </div>

          <div className="product-detail-content">
            <div className="product-gallery">
              <div className="main-image">
                <img
                  src={product.images && product.images[selectedImage] ? product.images[selectedImage] : product.image}
                  alt={product.name}
                  className="product-image"
                />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="thumbnail-gallery">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-info">
              <h1 className="product-title">{product.name}</h1>

              <div className="product-price">
                <span className="current-price">{formatPrice(product.price)}</span>
              </div>

              <div className="product-meta">
                <div className="meta-item">
                  <span className="meta-label">Danh mục:</span>
                  <span className="meta-value">{typeof product.category === 'string' ? product.category : product.category?.name}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Tình trạng:</span>
                  <span className={`meta-value ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                    {isOutOfStock ? 'Hết hàng' : `Còn ${availableQuantity} sản phẩm`}
                  </span>
                </div>
              </div>

              <div className="product-description">
                <p>{product.description}</p>
              </div>

              {!isOutOfStock && (
                <div className="quantity-selector">
                  <label className="quantity-label">Số lượng:</label>
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= availableQuantity}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="product-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
                </button>
              </div>
            </div>
          </div>

          <div className="product-tabs">
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Mô tả sản phẩm
              </button>
              <button
                className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Đánh giá
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'description' && (
                <div className="description-content">
                  <h3>Mô tả chi tiết</h3>
                  <p>{product.description}</p>
                  <p>
                    Sản phẩm {product.name} được thiết kế với chất liệu cao cấp,
                    mang đến sự thoải mái và phong cách cho người sử dụng.
                    Phù hợp cho nhiều dịp khác nhau từ đi làm, dạo phố đến các sự kiện đặc biệt.
                  </p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="reviews-content">
                  <h3>Đánh giá từ khách hàng</h3>
                  <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                  <p>Hãy là người đầu tiên đánh giá sản phẩm!</p>
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

export default ProductDetail;