import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, ShoppingOutlined, UserOutlined, FileTextOutlined, AuditOutlined, LogoutOutlined, EnvironmentOutlined, HomeOutlined } from '@ant-design/icons';
import { useAuth } from '../../../context/AuthContext';
import './AdminLayout.css';

const { Sider, Content } = Layout;

const AdminLayout = ({ children, activePage = 'orders' }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'products':
        navigate('/admin/products');
        break;
      case 'orders':
        navigate('/admin/orders');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'modules':
        navigate('/admin/modules');
        break;
      case 'audit':
        navigate('/admin/audit-logs');
        break;
      case 'logout':
        logout();
        navigate('/login');
        break;
      default:
        break;
    }
  };

  const menuItems = [
    {
      key: 'products',
      icon: <ShoppingOutlined />,
      label: 'Quản lý sản phẩm',
    },
    {
      key: 'orders',
      icon: <FileTextOutlined />,
      label: 'Quản lý đơn hàng',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'Quản lý người dùng',
    },
    {
      key: 'modules',
      icon: <DashboardOutlined />,
      label: 'Quản lý module',
    },
    {
      type: 'divider',
    },
    {
      key: 'audit',
      icon: <AuditOutlined />,
      label: 'Audit Logs',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
    },
  ];

  return (
    <div className="admin-page">
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={250} theme="dark" className="admin-sider" collapsible>
          <div className="admin-logo">
            <h2>Sixedi Admin</h2>
            <button 
              className="logo-home-btn" 
              onClick={() => navigate('/')}
              title="Về trang chủ"
            >
              <HomeOutlined />
              <span className="btn-text">Trang chủ</span>
            </button>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activePage]}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
        <Content className="admin-content">
          <div className="admin-container">{children}</div>
        </Content>
      </Layout>
    </div>
  );
};

export default AdminLayout;
