import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm } from 'antd';
import AdminLayout from '../../components/ui/AdminLayout/AdminLayout';
import { createApiFetch } from '../../services/api-helper';
import './AdminDashboard.css';

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

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchJson = createApiFetch(getAuthHeaders);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      console.log('[AdminDashboard] Loading products and categories...');
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetchJson(`${API_BASE_URL}/products?limit=100`),
        fetchJson(`${API_BASE_URL}/products/categories`),
      ]);

      setProducts(productsResponse?.data || []);
      setCategories(categoriesResponse?.data || []);
      console.log(`[AdminDashboard] Loaded ${productsResponse?.data?.length || 0} products`);
    } catch (error) {
      console.error('[AdminDashboard] Error loading data:', error);
      message.error(error.message || 'Không thể tải dữ liệu sản phẩm');
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      desc: product.desc,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
      image: product.image,
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      setLoading(true);
      await fetchJson(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });
      message.success('Xóa sản phẩm thành công');
      await loadProducts();
    } catch (error) {
      message.error(error.message || 'Không thể xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name.trim(),
        desc: values.desc?.trim() || undefined,
        price: Number(values.price),
        stock: Number(values.stock || 0),
        categoryId: Number(values.categoryId),
        image: values.image?.trim() || undefined,
      };

      if (editingProduct) {
        await fetchJson(`${API_BASE_URL}/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await fetchJson(`${API_BASE_URL}/products`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        message.success('Thêm sản phẩm thành công');
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingProduct(null);
      await loadProducts();
    } catch (error) {
      message.error(error.message || 'Không thể lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category) => category?.name || 'Chưa có danh mục',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => `${price?.toLocaleString()}đ`,
    },
    {
      title: 'Số lượng',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" onClick={() => handleEditProduct(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa sản phẩm"
            description="Bạn chắc chắn muốn xóa sản phẩm này?"
            onConfirm={() => handleDeleteProduct(record.id)}
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
    <AdminLayout activePage="products">
      <div className="admin-header">
        <h1>Quản Lý Sản Phẩm</h1>
        <Button type="primary" onClick={handleAddProduct}>
          Thêm Sản Phẩm
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
        open={isModalOpen}
        okText={editingProduct ? 'Lưu' : 'Tạo'}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Tên sản phẩm"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Danh mục"
            name="categoryId"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select options={categoryOptions} placeholder="Chọn danh mục" />
          </Form.Item>

          <Form.Item
            label="Giá"
            name="price"
            rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
          >
            <InputNumber min={0} />
          </Form.Item>

          <Form.Item
            label="Số lượng"
            name="stock"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          >
            <InputNumber min={0} />
          </Form.Item>

          <Form.Item
            label="Hình ảnh URL"
            name="image"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="desc"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminDashboard;
