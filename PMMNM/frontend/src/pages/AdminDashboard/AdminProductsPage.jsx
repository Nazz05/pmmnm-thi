import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || (user.role && !user.role.toUpperCase().includes('ADMIN'))) {
      message.error('Bạn không có quyền truy cập trang này');
      navigate('/');
      return;
    }
  }, [user, navigate]);

  return <AdminDashboard />;
};

export default AdminProductsPage;
