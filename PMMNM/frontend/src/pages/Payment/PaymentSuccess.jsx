import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { CheckCircleOutlined, HomeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './PaymentSuccess.css';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window === 'undefined') return 'http://localhost:8080/api';
  const hostname = window.location.hostname;
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(hostname);
  if (isLocalhost) return 'http://localhost:8080/api';
  const protocol = window.location.protocol;
  return `${protocol}//api.${hostname}/api`;
};

const API_BASE_URL = getApiBaseUrl();

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const orderId = searchParams.get('orderId');
        
        if (!orderId) {
          setError('Không tìm thấy thông tin đơn hàng');
          setLoading(false);
          return;
        }

        if (!token) {
          setError('Vui lòng đăng nhập để xem chi tiết đơn hàng');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Không thể lấy thông tin đơn hàng');
        }

        const data = await response.json();
        setOrderData(data.data || data);
        clearCart();
      } catch (error) {
        console.error('Error fetching order:', error);
        setError(error.message || 'Có lỗi khi tải thông tin đơn hàng');
        message.error(error.message || 'Có lỗi khi tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [searchParams, token, clearCart]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="payment-success-container">
        <Spin size="large" description="Đang tải thông tin đơn hàng..." />
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="payment-success-container">
        <div className="error-section">
          <div className="error-icon">⚠️</div>
          <h2>Lỗi</h2>
          <p>{error || 'Không thể lấy thông tin thanh toán'}</p>
          <div className="button-group">
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              <HomeOutlined /> Về Trang Chủ
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
              <ShoppingCartOutlined /> Xem Đơn Hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { items = [], totalPrice, status, createdAt, id: orderId } = orderData;

  return (
    <div className="payment-success-page">
      <div className="payment-success-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">
            <CheckCircleOutlined />
          </div>
          <h1>Thanh Toán Thành Công!</h1>
          <p>Cảm ơn bạn đã mua hàng. Chúng tôi sẽ sớm xử lý và gửi đơn hàng cho bạn.</p>
        </div>

        {/* Order Information */}
        <div className="order-info-section">
          <div className="info-grid">
            <div className="info-card">
              <label>Mã Đơn Hàng</label>
              <p className="info-value">#{orderId}</p>
            </div>
            <div className="info-card">
              <label>Trạng Thái</label>
              <p className="info-value status">{status === 'CONFIRMED' ? '✓ Đã Xác Nhận' : 'Đang Xử Lý'}</p>
            </div>
            <div className="info-card">
              <label>Ngày Đặt Hàng</label>
              <p className="info-value">{new Date(createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="products-section">
          <h2>Sản Phẩm Đã Mua</h2>
          <div className="products-list">
            {items && items.length > 0 ? (
              items.map((item, index) => (
                <div key={index} className="product-item">
                  <div className="product-image">
                    {item.product?.image ? (
                      <img src={item.product.image} alt={item.product?.name} />
                    ) : (
                      <div className="no-image">Không có ảnh</div>
                    )}
                  </div>
                  <div className="product-details">
                    <h4>{item.product?.name || 'Sản phẩm'}</h4>
                    <p className="category">{item.product?.category?.name || 'Không có danh mục'}</p>
                    <p className="quantity">Số lượng: <strong>{item.quantity}</strong></p>
                  </div>
                  <div className="product-price">
                    <p>{formatCurrency(item.price)}</p>
                    <p className="total">x{item.quantity}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-message">Không có sản phẩm nào</p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="summary-row">
            <span>Tổng Tiền Hàng:</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <div className="summary-row">
            <span>Phí Vận Chuyển:</span>
            <span>Miễn Phí</span>
          </div>
          <div className="summary-row discount">
            <span>Giảm Giá:</span>
            <span>0 ₫</span>
          </div>
          <div className="summary-row total">
            <span>Tổng Thanh Toán:</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </div>

        

        {/* Action Buttons */}
        <div className="button-group">
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>
            <ShoppingCartOutlined /> Xem Đơn Hàng
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/san-pham')}>
            Tiếp Tục Mua Sắm
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            <HomeOutlined /> Về Trang Chủ
          </button>
        </div>

        {/* Note */}
        <div className="info-note">
          <p> Email xác nhận thanh toán sẽ được gửi đến hộp thư của bạn trong vòng vài phút.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
