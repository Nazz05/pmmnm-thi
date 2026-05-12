import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Spin } from 'antd';
import { useAuth } from '../../../../context/AuthContext';
import './AddressManagement.css';

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

const AddressManagement = () => {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [form] = Form.useForm();
  const isMountedRef = useRef(false);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      loadAddresses();
      loadUsers();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load addresses');
      }

      const data = await response.json().catch(() => ({}));
      setAddresses(data?.data?.addresses || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
      message.error('Lỗi khi tải danh sách địa chỉ');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json().catch(() => ({}));
      setUsers(data?.data?.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Lỗi khi tải danh sách người dùng');
      setUsers([]);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    form.setFieldsValue({
      street: address.street,
      ward: address.ward,
      district: address.district,
      city: address.city,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleDeleteAddress = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      setAddresses((prev) => prev.filter((address) => address.id !== id));
      message.success('Xóa địa chỉ thành công');
    } catch (error) {
      console.error('Error deleting address:', error);
      message.error('Lỗi khi xóa địa chỉ');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/addresses/${id}/set-default`, {
        method: 'POST',
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to set default address');
      }

      const data = await response.json().catch(() => ({}));
      setAddresses((prev) => prev.map((address) =>
        address.id === id ? data.data : { ...address, isDefault: false }
      ));
      message.success('Đặt địa chỉ mặc định thành công');
    } catch (error) {
      console.error('Error setting default address:', error);
      message.error('Lỗi khi đặt địa chỉ mặc định');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (!editingAddress) {
        const response = await fetch(`${API_BASE_URL}/admin/addresses`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            userId: values.userId,
            street: values.street,
            ward: values.ward,
            district: values.district,
            city: values.city,
            zipCode: values.zipCode,
            isDefault: values.isDefault,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create address');
        }

        const data = await response.json().catch(() => ({}));
        setAddresses((prev) => [data.data, ...prev]);
        message.success('Tạo địa chỉ thành công');
        setIsModalOpen(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/addresses/${editingAddress.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          street: values.street,
          ward: values.ward,
          district: values.district,
          city: values.city,
          zipCode: values.zipCode,
          isDefault: values.isDefault,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update address');
      }

      const data = await response.json().catch(() => ({}));
      setAddresses((prev) => prev.map((item) => (item.id === editingAddress.id ? data.data : item)));
      message.success('Cập nhật địa chỉ thành công');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving address:', error);
      message.error('Lỗi khi lưu địa chỉ');
    }
  };

  const columns = [
    {
      title: 'Họ tên',
      dataIndex: ['user', 'fullName'],
      key: 'fullName',
    },
    {
      title: 'Số điện thoại',
      dataIndex: ['user', 'phone'],
      key: 'phone',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'street',
      key: 'address',
      render: (_, record) => `${record.street}, ${record.ward}, ${record.district}, ${record.city}`,
    },
    {
      title: 'Mặc định',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault) => (
        <span style={{
          color: isDefault ? '#52c41a' : '#999',
          fontWeight: isDefault ? 'bold' : 'normal'
        }}>
          {isDefault ? '✓ Mặc định' : 'Không'}
        </span>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {!record.isDefault && (
            <Button
              type="link"
              size="small"
              onClick={() => handleSetDefault(record.id)}
            >
              Đặt mặc định
            </Button>
          )}
          <Button type="primary" size="small" onClick={() => handleEditAddress(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa địa chỉ"
            description="Bạn chắc chắn muốn xóa địa chỉ này?"
            onConfirm={() => handleDeleteAddress(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button danger size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="admin-content">
        <div className="admin-header">
          <h1>Quản Lý Địa Chỉ Giao Hàng</h1>
          <Button type="primary" onClick={handleAddAddress}>
            Thêm Địa Chỉ
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={addresses}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ'}
          open={isModalOpen}
          onOk={() => form.submit()}
          onCancel={() => setIsModalOpen(false)}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            {!editingAddress && (
              <Form.Item
                label="Người dùng"
                name="userId"
                rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
              >
                <Select placeholder="Chọn người dùng">
                  {users.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.fullName} ({user.email})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item
              label="Số nhà, đường"
              name="street"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Phường/Xã"
              name="ward"
              rules={[{ required: true, message: 'Vui lòng nhập phường/xã' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Quận/Huyện"
              name="district"
              rules={[{ required: true, message: 'Vui lòng nhập quận/huyện' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Tỉnh/Thành phố"
              name="city"
              rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Mã bưu chính"
              name="zipCode"
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Mặc định"
              name="isDefault"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái mặc định' }]}
            >
              <Select>
                <Select.Option value={true}>Có</Select.Option>
                <Select.Option value={false}>Không</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Spin>
  );
};

export default AddressManagement;