import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import Header from '../ui/Header/Header';
import Footer from '../ui/Footer/Footer';

const ModuleDisabledPage = ({ moduleName }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="maintenance-page">
      <Header />
      <main style={{ background: '#f6f7fb', padding: '80px 0' }}>
        <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: '60px 48px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: '#fff7e6',
                border: '1px solid #ffd591',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <span style={{ fontSize: 42, color: '#fa8c16', lineHeight: 1 }}>!</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 34, color: '#111827' }}>
              Tính năng tạm thời không khả dụng
            </h1>
            <p style={{ marginTop: 18, color: '#4b5563', fontSize: 16, lineHeight: 1.75, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
              Tính năng <strong>{moduleName}</strong> hiện đang được bảo trì hoặc tạm thời tắt.
              Vui lòng quay lại sau hoặc liên hệ quản trị viên nếu cần hỗ trợ.
            </p>
            <Button
              type="primary"
              size="large"
              onClick={handleGoHome}
              style={{ marginTop: 32, minWidth: 220 }}
            >
              Quay về trang chủ
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ModuleDisabledPage;
