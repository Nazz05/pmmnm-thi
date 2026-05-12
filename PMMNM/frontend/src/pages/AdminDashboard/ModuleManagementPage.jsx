import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Switch, Card, Button, message, Spin, Modal } from "antd";
import AdminLayout from "../../components/ui/AdminLayout/AdminLayout";
import { useModules } from "../../context/ModuleContext";
import api from "../../services/api";

const ModuleManagementPage = () => {
  const navigate = useNavigate();
  const { moduleCatalog, refreshModuleStatuses, loading } = useModules();
  const [savingModule, setSavingModule] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailModule, setDetailModule] = useState(null);

  const handleAuthError = () => {
    localStorage.removeItem("token");
    message.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    navigate("/login");
  };

  useEffect(() => {
    refreshModuleStatuses();
  }, [refreshModuleStatuses]);

  const handleToggle = async (moduleName, isEnabled) => {
    setSavingModule(moduleName);
    try {
      await api.put(`/admin/modules/${moduleName}`, { isEnabled });
      message.success(`Module ${moduleName} đã ${isEnabled ? "bật" : "tắt"}.`);
      // Refresh toàn bộ module statuses từ context
      await refreshModuleStatuses();
    } catch (error) {
      console.error("Failed to update module status", error);
      if (error.message && error.message.includes("Invalid or expired token")) {
        handleAuthError();
      } else {
        message.error("Cập nhật trạng thái module thất bại.");
      }
    } finally {
      setSavingModule(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout activePage="modules">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePage="modules">
      <div
        className="admin-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'nowrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1>Quản lý module</h1>
          <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.65)' }}>Bật/tắt tính năng theo module</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button type="default" onClick={refreshModuleStatuses} style={{ whiteSpace: 'nowrap' }}>
            Làm mới
          </Button>
        </div>
      </div>

      <Card style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {moduleCatalog.map((module) => {
            const enabled = module.isEnabled;

            return (
              <div
                key={module.name}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: '#fff',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  minHeight: '120px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="font-semibold text-lg">{module.label}</div>
                  <div className="text-sm text-slate-500">{module.description}</div>
                  <div className="text-xs text-slate-400" style={{ marginTop: 8 }}>
                    Mặc định: {module.defaultEnabled ? 'bật' : 'tắt'} · {module.sample ? 'module mẫu' : module.category}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Button type="link" onClick={() => { setDetailModule(module); setDetailModalVisible(true); }}>
                    Chi tiết
                  </Button>
                  <Switch
                    checked={enabled}
                    loading={savingModule === module.name}
                    onChange={(checked) => handleToggle(module.name, checked)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Modal
        title={detailModule ? `${detailModule.label} — Chi tiết` : 'Chi tiết module'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {detailModule ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>Tên hiển thị:</strong> {detailModule.label}</div>
            <div><strong>Key:</strong> {detailModule.name}</div>
            <div><strong>Mô tả:</strong> {detailModule.description}</div>
            <div><strong>Danh mục:</strong> {detailModule.category}</div>
            <div><strong>Mặc định:</strong> {detailModule.defaultEnabled ? 'Bật' : 'Tắt'}</div>
            <div><strong>Hiện bật:</strong> {detailModule.isEnabled ? 'Có' : 'Không'}</div>
            <div><strong>Đã lưu setting:</strong> {detailModule.hasStoredSetting ? 'Có' : 'Không'}</div>
            {/* Entry point and routes intentionally hidden in UI */}
            {detailModule.dependencies && detailModule.dependencies.length > 0 && (
              <div>
                <strong>Dependencies:</strong>
                <ul style={{ marginTop: 6 }}>
                  {detailModule.dependencies.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
};

export default ModuleManagementPage;
