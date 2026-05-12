import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/ui/AdminLayout/AdminLayout';
import AuditLogsView from '../../components/features/admin/AuditLogs/AuditLogsView';

const AuditLogsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || (user.role && !user.role.toUpperCase().includes('ADMIN'))) {
      message.error('Bạn không có quyền truy cập trang này');
      navigate('/');
      return;
    }
  }, [user, navigate]);

  return (
    <AdminLayout activePage="audit">
      <AuditLogsView />
    </AdminLayout>
  );
};

export default AuditLogsPage;
