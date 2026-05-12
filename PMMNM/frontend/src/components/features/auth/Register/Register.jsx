import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logger from '../../../../utils/logger';
import { validateRegisterForm } from '../../../../utils/validation';
import './Register.css';

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

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    terms: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const validation = validateRegisterForm(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (validateForm()) {
      setLoading(true);
      try {
        // Call backend API
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setErrors({ submit: data.message || 'Đăng ký thất bại' });
          return;
        }

        // Show success message
        setSuccessMessage('Đăng ký thành công! Vui lòng đăng nhập.');
        
        // Reset form
        setFormData({
          email: '',
          password: '',
          fullName: '',
          phone: '',
          terms: false
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);

      } catch (error) {
        logger.error('Register error:', error);
        setErrors({ submit: 'Có lỗi xảy ra, vui lòng thử lại' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="register-page">
      <div className="register-wrapper">
        {/* Left Column - Form */}
        <div className="register-form-column">
          <div className="register-form-box">
            <div className="register-header">
              <div className="logo">
                <Link to="/" className="logo-link">
                  <span className="logo-text">Sixedi</span>
                </Link>
              </div>
              <h2 className="register-title">Tạo tài khoản mới</h2>
              <p className="register-subtitle">Tham gia cùng hàng nghìn khách hàng tin tưởng Sixedi</p>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              {errors.submit && <div className="error-message-box" style={{marginBottom: '15px'}}>{errors.submit}</div>}
              {successMessage && <div className="success-message-box" style={{marginBottom: '15px'}}>{successMessage}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">Họ và tên</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className={`form-input ${errors.fullName ? 'error' : ''}`}
                    placeholder="Nhập họ và tên"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">Số điện thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-group checkbox-wrapper">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="terms"
                    name="terms"
                    className={`form-checkbox ${errors.terms ? 'error' : ''}`}
                    checked={formData.terms}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="terms" className="checkbox-label">
                    Tôi đồng ý với <a href="#" className="link">Điều khoản sử dụng</a> và <a href="#" className="link">Chính sách bảo mật</a>
                  </label>
                </div>
                {errors.terms && <span className="error-message">{errors.terms}</span>}
              </div>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? 'Đang đăng ký...' : 'Tạo Tài Khoản'}
              </button>
            </form>

            <div className="login-link">
              <p>Đã có tài khoản? <Link to="/login" className="link">Đăng nhập ngay</Link></p>
            </div>
          </div>
        </div>

        {/* Right Column - Benefits */}
        <div className="register-benefits-column">
          <div className="benefits-card">
            <h3>Tại sao nên tham gia Sixedi?</h3>
            
            <div className="benefit-item">
              <div className="benefit-icon"></div>
              <h4>Ưu Đãi Độc Quyền</h4>
              <p>Nhận chiết khấu đặc biệt, mã khuyến mãi và các ưu đãi riêng dành cho thành viên</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon"></div>
              <h4>Giao Hàng Nhanh</h4>
              <p>Vận chuyển miễn phí đơn hàng từ 500k, giao hàng toàn quốc trong 2-3 ngày</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon"></div>
              <h4>Đổi Trả Dễ Dàng</h4>
              <p>30 ngày đổi trả miễn phí nếu không ưng ý, không cần hỏi lý do</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon"></div>
              <h4>Thanh Toán An Toàn</h4>
              <p>Hỗ trợ nhiều phương thức thanh toán, toàn bộ giao dịch được mã hóa 256-bit</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon"></div>
              <h4>Bảo Vệ Người Mua</h4>
              <p>Chương trình bảo vệ mua hàng 100%, nếu có vấn đề, chúng tôi sẽ hoàn tiền</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon"></div>
              <h4>Cộng Đồng Sixedi</h4>
              <p>Kết nối với hàng nghìn khách hàng, chia sẻ kinh nghiệm mua sắm thời trang</p>
            </div>
          </div>

          <div className="testimonials-card">
            <p className="testimonial">
              "Sixedi là nơi tôi yêu thích mua sắm. Chất lượng sản phẩm tuyệt vời, dịch vụ khách hàng xuất sắc!"
            </p>
            <p className="testimonial-author">- Nguyễn Linh, TP.HCM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;