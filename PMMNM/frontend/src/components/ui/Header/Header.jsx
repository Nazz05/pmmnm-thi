import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="announcement-bar">
        Miễn phí vận chuyển cho đơn hàng từ 500k — Mua ngay!
      </div>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <div className="mobile-menu">
              <button className="menu-btn">
                <span className="material-icons">menu</span>
              </button>
            </div>
            <div className="logo">
              <Link to="/">Sixedi</Link>
            </div>
            <div className="nav-links">
              <Link to="/san-pham">Sản phẩm</Link>
              <Link to="/nam">Nam</Link>
              <Link to="/nu">Nữ</Link>
              <Link to="/giay">Giày</Link>
              <Link to="/phu-kien">Phụ kiện</Link>
            </div>
            <div className="nav-actions">
              <button className="icon-btn" onClick={() => navigate('/search')}>
                <span className="material-icons">search</span>
              </button>              <Link to="/cart" className="icon-btn cart-btn" title="Giỏ hàng">
                <span className="material-icons">shopping_cart</span>
                {getCartCount() > 0 && (
                  <span className="cart-badge">{getCartCount()}</span>
                )}
              </Link>              {user ? (
                <div className="user-menu">
                  {user.role && user.role.toUpperCase().includes('ADMIN') && (
                    <Link to="/admin/products" className="icon-btn admin-btn" title="Admin Dashboard">
                      <span className="material-icons">admin_panel_settings</span>
                    </Link>
                  )}
                  <Link to="/profile" className="icon-btn" title="Hồ sơ cá nhân">
                    <span className="material-icons">person_outline</span>
                  </Link>
                  <button className="icon-btn logout-btn" onClick={handleLogout} title="Đăng xuất">
                    <span className="material-icons">logout</span>
                  </button>
                </div>
              ) : (
                <Link to="/login" className="icon-btn">
                  <span className="material-icons">person_outline</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
