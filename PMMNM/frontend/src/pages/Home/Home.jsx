import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import logger from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/ui/Header/Header';
import Footer from '../../components/ui/Footer/Footer';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import { productService } from '../../services/productService';
import { formatCurrency } from '../../utils/format';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect fill="%23f0f0f0" width="300" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3EKhông có ảnh%3C/text%3E%3C/svg%3E';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const apiProducts = await productService.listProducts(1, 6);
      setProducts(apiProducts || []);
    } catch (error) {
      logger.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="home">
      <Header />
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <svg className="hero-svg" aria-hidden="true" fill="currentColor" preserveAspectRatio="none" viewBox="0 0 100 100">
              <polygon points="50,0 100,0 50,100 0,100"></polygon>
            </svg>
            <main className="hero-main">
              <div className="hero-text">
                <h1 className="hero-title">
                  <span>Phong cách mới</span>
                  <span className="hero-title-primary">cho mùa hè rực rỡ</span>
                </h1>
                <p className="hero-description">
                  Khám phá bộ sưu tập mới nhất từ Sixedi với những thiết kế tinh tế, chất liệu cao cấp và sự thoải mái tuyệt đối cho mọi hoạt động của bạn.
                </p>
                <div className="hero-buttons">
                  {user ? (
                    <>
                      <Link to="/san-pham" className="btn btn-primary">Mua Ngay</Link>
                      <Link to="/san-pham" className="btn btn-secondary">Xem Lookbook</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="btn btn-primary">Đăng Nhập</Link>
                      <Link to="/register" className="btn btn-secondary">Đăng Ký</Link>
                    </>
                  )}
                </div>
              </div>
            </main>
            <div className="hero-image">
              <img alt="Fashion model wearing Sixedi collection" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDg-RGk8szuX9GM5KddrQwjLtS0Tx0VwOrGgoMck8Uz8FqIFJ4Dglgmzf2Z2JQ3ouPS5chfWjoebVoDnR55Z9KTeDQXIEKqstO9nxMg8oQ3PtpXzShJ1E5S05SHN3sRbl_2JaIuarnG4Ubn8CfZgNz-M0zJzsOUnr-0JopEtmFCL7rq9nswllxkVxka9ZMcF999-GebA4kmD0S-c5QQ8nJRMzqVTE-5J_gxpijWbCRZJDtC1jT2MrZ54k13lVfmIvKyu37G7eWNNfx8"/>
            </div>
          </div>
        </div>
      </div>
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <span className="material-icons">local_shipping</span>
              </div>
              <h3>Giao Hàng Nhanh</h3>
              <p>Vận chuyển toàn quốc trong 2-3 ngày.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <span className="material-icons">published_with_changes</span>
              </div>
              <h3>Đổi Trả Dễ Dàng</h3>
              <p>30 ngày đổi trả miễn phí nếu không ưng ý.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <span className="material-icons">verified</span>
              </div>
              <h3>Chất Lượng Cao</h3>
              <p>Cam kết hàng chính hãng 100%.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <span className="material-icons">support_agent</span>
              </div>
              <h3>Hỗ Trợ 24/7</h3>
              <p>Đội ngũ tư vấn nhiệt tình, tận tâm.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="categories-section">
        <div className="container">
          <h2>Danh Mục Nổi Bật</h2>
          <div className="categories-grid">
            <Link to="#" className="category-card">
              <img alt="Thời trang nữ" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcqnAZU3XNkkzZLCuIAracfdG3g7-GF0oXj_IPrZv_TQ9GiSrACUs0lOuwc4XO77Ty073ZbHovtojX97KOl4BmIiJfdIqX4Pl-8Wom9Bg_gRXJywMmm9F5RyVtO4c_uRgGuf8JXFjlLGZx2BLOCwG-xQh1HVPptIGqZYPVaPuHu5NV4fktvZygULryt8JzDqu3oyY-LLt16Mx3WWAtxXKy08uonATPfjcAEgCpWSNBvzpL5tXUh_u-jAJBgpU2OvY6HcVWDaKIm-3j"/>
              <div className="category-overlay">
                <h3>Nữ Giới</h3>
                <p>Thanh lịch và quyến rũ</p>
              </div>
            </Link>
            <Link to="#" className="category-card">
              <img alt="Thời trang nam" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmYfkrk5S9GZDyuAz_emBk_4tdr2JcUVLSPZmXaZReevin9kPnFWj9jbwEV8nc4OG1NbzSrFDpiSHr4ttAYQyvThG-VBkvGjJu-2_0lxeqYj4xl06U1YWTyrYOW4Y5fiVboHRp95nZGbV3klycxBBMNVBhAPgz_YioOPlZGpya-LnAiq9Pp8Jx9_MLT433DTwZXPCf98OZbwKgPQT_Yco3t0h-WHTkTiI9JYD9ccbsOLdoMXpA5Er4ovg-BLqPn5oiby5ZqJaxD58H"/>
              <div className="category-overlay">
                <h3>Nam Giới</h3>
                <p>Mạnh mẽ và phong cách</p>
              </div>
            </Link>
            <Link to="#" className="category-card">
              <img alt="Phụ kiện" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBut99Gmk48WBJj60GQE6M2ndM__tT5HuglYhvWBLKHFRcRnn6Dd2EOh-cxTo4lGFEEcNMVO0-Wz2SDQhhI7ROc87QLUQdsUTFeZhZUG76yQWq7kGAWZ78HFTRuANg16dFH0QZF1mjk7RJBpFXUKRk6S5Hgd17yIaPnP40Q_RQsOYUEtbmevaovS8YxV5eX1e1AsxZZmlckmQMWMEFetYkDxN_NfUoVo2GZ_4aKC98ZW160pIzmfbLDG45aT_Z5gGFU-45M2hcR_6xT"/>
              <div className="category-overlay">
                <h3>Phụ Kiện</h3>
                <p>Điểm nhấn hoàn hảo</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Sản Phẩm Bán Chạy</h2>
              <p>Những món đồ được yêu thích nhất tuần qua</p>
            </div>
            <Link to="#" className="view-all">Xem tất cả <span className="material-icons">arrow_forward</span></Link>
          </div>
          <div className="products-grid">
            {loading ? (
              <p>Đang tải sản phẩm...</p>
            ) : products.length > 0 ? (
              products.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  image={product.imageUrl || product.image || DEFAULT_PLACEHOLDER}
                  fallbackImages={product.images || []}
                  alt={product.name}
                  category={product.category?.name || product.category || product.type}
                  name={product.name}
                  currentPrice={formatCurrency(product.price)}
                  oldPrice={product.originPrice ? formatCurrency(product.originPrice) : undefined}
                  link={`/product/${product.id}`}
                />
              ))
            ) : (
              <p>Không có sản phẩm nào</p>
            )}
          </div>
          <div className="view-all-mobile">
            <Link to="#" className="view-all">Xem tất cả <span className="material-icons">arrow_forward</span></Link>
          </div>
        </div>
      </section>
      <section className="promotion-section">
        <div className="promotion-bg">
          <img alt="Fashion promotion background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYOM7f34_c_jzNJJfgGxQ1PTyi2dRxEfYwMwsyW_Cw_E78NxwLkH-QkdS9TA17VCJ4NHpE2Zcwjw49AlXwnNr6OdFhDXrt7-fEGlkwbMviFI8HP31WObnHQClS8z2uYGVQpysFEYRHyN3OiCPgs3VOgzI4kZvURXGWvRKJ6VR7lafv9BckuwLHb2sDHO5GJ7mMS7L9Xgm0Xcq5i5dLm5dYrq6TehMZHEBOpjJoLsqxcu5t0tAGcA5Ss4q4zdOMQIqEVVWBlRJMUsTL"/>
        </div>
        <div className="container">
          <div className="promotion-content">
            <h2>Mùa Hè Sôi Động - Sale Up To 50%</h2>
            <p>Cập nhật tủ đồ của bạn với những items hot nhất mùa hè này. Ưu đãi có hạn, mua ngay kẻo lỡ!</p>
            <Link to="#" className="btn btn-light">Khám Phá Ngay</Link>
          </div>
        </div>
      </section>
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <span className="material-icons newsletter-icon">mail_outline</span>
            <h2>Đăng Ký Nhận Tin</h2>
            <p>Nhận thông tin về sản phẩm mới và khuyến mãi đặc biệt.</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Nhập email của bạn" />
              <button type="submit">Gửi</button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Home;