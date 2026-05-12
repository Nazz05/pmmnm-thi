import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/ui/AdminLayout/AdminLayout';
import Profile from './Profile';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      message.error('Bạn cần đăng nhập để truy cập trang này');
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <AdminLayout activePage="profile">
      <Profile />
    </AdminLayout>
  );
};

export default ProfilePage;