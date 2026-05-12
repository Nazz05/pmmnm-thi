import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/">Sixedi</Link>
            <p>Sixedi mang đến xu hướng thời trang hiện đại, chất lượng cao cho người Việt. Tự tin thể hiện cá tính cùng chúng tôi.</p>
            <div className="social-links">
              <a href="#"><span className="material-icons">facebook</span></a>
              <a href="#"><span className="material-icons">camera_alt</span></a>
              <a href="#"><span className="material-icons">play_circle_filled</span></a>
            </div>
          </div>
          <div className="footer-links">
            <h3>Mua Sắm</h3>
            <ul>
              <li><Link to="/nam">Thời trang Nam</Link></li>
              <li><Link to="/nu">Thời trang Nữ</Link></li>
              <li><Link to="/phu-kien">Phụ Kiện</Link></li>
              <li><Link to="/san-pham">Sale Off</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h3>Hỗ Trợ</h3>
            <ul>
              <li><Link to="#">Chính sách đổi trả</Link></li>
              <li><Link to="#">Chính sách vận chuyển</Link></li>
              <li><Link to="#">Hướng dẫn chọn size</Link></li>
              <li><Link to="#">Liên hệ</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h3>Liên Hệ</h3>
            <ul>
              <li>
                <span className="material-icons">place</span>
                123 Đường ABC, Quận 1, TP.HCM
              </li>
              <li>
                <span className="material-icons">phone</span>
                1900 1234
              </li>
              <li>
                <span className="material-icons">email</span>
                cskh@sixedi.com
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2023 Sixedi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;