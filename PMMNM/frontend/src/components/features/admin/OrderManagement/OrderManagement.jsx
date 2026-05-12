import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Spin, InputNumber } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../../../../context/AuthContext';
import './OrderManagement.css';

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

const OrderManagement = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      loadOrders();
      loadUsers();
      loadProducts();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load orders');
      }

      const data = await response.json().catch(() => ({}));
      setOrders(data?.data?.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      message.error('Lỗi khi tải danh sách đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products?limit=100`);
      if (!response.ok) {
        throw new Error('Failed to load products');
      }

      const data = await response.json().catch(() => ({}));
      setProducts(data?.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      message.error('Lỗi khi tải danh sách sản phẩm');
      setProducts([]);
    }
  };

  const handleAddOrder = () => {
    setEditingOrder(null);
    setIsCreating(true);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setIsCreating(false);
    form.setFieldsValue({ status: order.status });
    setIsModalOpen(true);
  };

  const handleDeleteOrder = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      setOrders((prev) => prev.filter((order) => order.id !== id));
      message.success('Xóa đơn hàng thành công');
    } catch (error) {
      console.error('Error deleting order:', error);
      message.error('Lỗi khi xóa đơn hàng');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (isCreating) {
        const response = await fetch(`${API_BASE_URL}/admin/orders`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            userId: values.userId,
            shippingAddr: values.shippingAddr,
            phoneNumber: values.phoneNumber,
            note: values.note,
            items: values.items,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(errorBody || 'Failed to create order');
        }

        const data = await response.json();
        setOrders((prev) => [data.data, ...prev]);
        message.success('Tạo đơn hàng thành công');
        setIsModalOpen(false);
        return;
      }

      if (!editingOrder) {
        message.error('Vui lòng chọn đơn hàng để cập nhật');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          status: values.status,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || 'Failed to update order');
      }

      const data = await response.json();
      setOrders((prev) => prev.map((item) => (item.id === editingOrder.id ? data.data : item)));
      message.success('Cập nhật đơn hàng thành công');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving order:', error);
      message.error('Lỗi khi lưu đơn hàng');
    }
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'id',
      key: 'id',
      render: (id) => `#${id}`,
    },
    {
      title: 'ID Khách hàng',
      dataIndex: ['user', 'id'],
      key: 'userId',
    },
    {
      title: 'Số tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (totalPrice) => `${Number(totalPrice).toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColor = {
          PENDING: '#ffc53d',
          CONFIRMED: '#1890ff',
          SHIPPED: '#52c41a',
          DELIVERED: '#13c2c2',
          CANCELLED: '#ff4d4f'
        };
        const statusLabel = {
          PENDING: 'Chờ xử lý',
          CONFIRMED: 'Xác nhận',
          SHIPPED: 'Đã gửi',
          DELIVERED: 'Đã giao',
          CANCELLED: 'Đã hủy'
        };
        return (
          <span
            style={{
              color: '#fff',
              backgroundColor: statusColor[status] || '#999',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            {statusLabel[status] || status}
          </span>
        );
      }
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'shippingAddr',
      key: 'shippingAddr',
      render: (shippingAddr) => shippingAddr || 'Chưa xác định',
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt) => (createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : '-'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" onClick={() => handleEditOrder(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa đơn hàng"
            description="Bạn chắc chắn muốn xóa đơn hàng này?"
            onConfirm={() => handleDeleteOrder(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button danger size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase();
    return (
      !search ||
      `#${order.id}`.toLowerCase().includes(search) ||
      `${order.userId}`.toLowerCase().includes(search) ||
      order.shippingAddr?.toLowerCase().includes(search) ||
      order.status?.toLowerCase().includes(search)
    );
  });

  return (
    <Spin spinning={loading}>
      <div className="admin-content">
        <div className="admin-header">
          <h1>Quản Lý Đơn Hàng</h1>
          <div>
            <Button type="primary" onClick={handleAddOrder} style={{ marginRight: '10px' }}>
              Tạo đơn hàng
            </Button>
            <Button onClick={() => loadOrders()}>
              Làm mới
            </Button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Input
            placeholder="Tìm kiếm theo mã đơn, ID khách, địa chỉ hoặc trạng thái..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={isCreating ? 'Tạo đơn hàng mới' : 'Cập nhật trạng thái đơn hàng'}
          open={isModalOpen}
          onOk={() => form.submit()}
          onCancel={() => setIsModalOpen(false)}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {isCreating ? (
              <>
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

                <Form.Item
                  label="Địa chỉ giao hàng"
                  name="shippingAddr"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ giao hàng' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  name="phoneNumber"
                  rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item label="Ghi chú" name="note">
                  <Input.TextArea rows={3} />
                </Form.Item>

                <Form.List
                  name="items"
                  initialValue={[{ productId: null, quantity: 1 }]}
                  rules={[
                    {
                      validator: async (_, items) => {
                        if (!items || items.length === 0) {
                          return Promise.reject(new Error('Vui lòng thêm ít nhất một sản phẩm'));
                        }
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <>
                      {fields.map(({ key, name, ...field }) => (
                        <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                          <Form.Item
                            {...field}
                            name={[name, 'productId']}
                            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
                          >
                            <Select placeholder="Chọn sản phẩm" style={{ width: 280 }}>
                              {products.map((product) => (
                                <Select.Option key={product.id} value={product.id}>
                                  {product.name} - {Number(product.price).toLocaleString('vi-VN')} ₫
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item
                            {...field}
                            name={[name, 'quantity']}
                            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                          >
                            <InputNumber min={1} style={{ width: 120 }} />
                          </Form.Item>

                          <MinusCircleOutlined onClick={() => remove(name)} />
                        </Space>
                      ))}

                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          Thêm sản phẩm
                        </Button>
                        <Form.ErrorList errors={errors} />
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </>
            ) : (
              editingOrder && (
                <>
                  <Form.Item label="Mã đơn hàng">
                    <Input value={`#${editingOrder.id}`} disabled />
                  </Form.Item>
                  <Form.Item label="Khách hàng">
                    <Input value={`${editingOrder.user?.fullName || '-'} (${editingOrder.user?.email || '-'})`} disabled />
                  </Form.Item>
                  <Form.Item label="Số tiền">
                    <Input value={`${Number(editingOrder.totalPrice).toLocaleString('vi-VN')} ₫`} disabled />
                  </Form.Item>
                  <Form.Item label="Địa chỉ">
                    <Input value={editingOrder.shippingAddr || 'Chưa xác định'} disabled />
                  </Form.Item>
                  <Form.Item label="Ngày đặt">
                    <Input value={editingOrder.createdAt ? new Date(editingOrder.createdAt).toLocaleDateString('vi-VN') : '-'} disabled />
                  </Form.Item>
                </>
              )
            )}

            {!isCreating && (
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select
                  options={[
                    { value: 'PENDING', label: 'Chờ xử lý' },
                    { value: 'CONFIRMED', label: 'Xác nhận' },
                    { value: 'SHIPPED', label: 'Đã gửi' },
                    { value: 'DELIVERED', label: 'Đã giao' },
                    { value: 'CANCELLED', label: 'Đã hủy' }
                  ]}
                />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </Spin>
  );
};

export default OrderManagement;
