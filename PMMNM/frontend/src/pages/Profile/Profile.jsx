import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
import Header from '../../components/ui/Header/Header';
import Footer from '../../components/ui/Footer/Footer';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Profile.css';

const DEFAULT_FORM = {
  fullName: '',
  email: '',
  phone: ''
};

const validateProfileForm = (formData) => {
  const errors = {};

  if (!formData.fullName.trim()) {
    errors.fullName = 'Họ tên là bắt buộc';
  }

  if (!formData.email.trim()) {
    errors.email = 'Email là bắt buộc';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Email không hợp lệ';
  }

  if (!formData.phone.trim()) {
    errors.phone = 'Số điện thoại là bắt buộc';
  } else if (!/^\d{9,11}$/.test(formData.phone)) {
    errors.phone = 'Số điện thoại không hợp lệ';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDateVi = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('vi-VN');
};

const normalizeOrder = (order) => {
  const statusValue = order?.status?.value ?? order?.status ?? 'PENDING';

  return {
    ...order,
    status: String(statusValue),
    createdAt: order?.createdAt ?? order?.created_at ?? null,
    totalPrice: toSafeNumber(order?.totalPrice ?? order?.total_price, 0),
    shippingAddr: order?.shippingAddr ?? order?.shipping_addr ?? '',
    items: Array.isArray(order?.items)
      ? order.items.map((item) => ({
          ...item,
          productId: item?.productId ?? item?.product_id,
          quantity: toSafeNumber(item?.quantity, 0),
          price: toSafeNumber(item?.price, 0),
        }))
      : [],
  };
};

const ProfilePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [originalData, setOriginalData] = useState(DEFAULT_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: '',
    ward: '',
    district: '',
    city: '',
    phoneNumber: ''
  });
  const [addressFormErrors, setAddressFormErrors] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const userData = {
      fullName: user.fullName || user.name || '',
      email: user.email || '',
      phone: user.phone || ''
    };
    setFormData(userData);
    setOriginalData(userData);
  }, [user, navigate]);

  // Load orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders' && token && orders.length === 0) {
      loadOrders();
    }
  }, [activeTab, token]);

  // Load addresses when addresses tab is active
  useEffect(() => {
    if (activeTab === 'addresses' && token && addresses.length === 0) {
      loadAddresses();
    }
  }, [activeTab, token]);

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const data = await api.get('/orders/my');
      const normalizedOrders = Array.isArray(data?.data)
        ? data.data.map(normalizeOrder)
        : [];
      setOrders(normalizedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      message.error('Lỗi khi tải đơn hàng');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      setAddressesLoading(true);
      const data = await api.get('/addresses');
      setAddresses(data.data || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!addressForm.street.trim() || !addressForm.district.trim() || !addressForm.city.trim()) {
      setAddressFormErrors({ submit: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    try {
      await api.post('/addresses', {
        street: addressForm.street,
        ward: addressForm.ward,
        district: addressForm.district,
        city: addressForm.city,
        phoneNumber: addressForm.phoneNumber
      });

      message.success('Thêm địa chỉ thành công');
      setAddressForm({ street: '', ward: '', district: '', city: '', phoneNumber: '' });
      setShowAddressForm(false);
      loadAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
      message.error('Lỗi khi thêm địa chỉ');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      try {
        await api.delete(`/addresses/${addressId}`);

        message.success('Xóa địa chỉ thành công');
        setAddresses(addresses.filter(addr => addr.id !== addressId));
      } catch (error) {
        console.error('Error deleting address:', error);
        message.error('Lỗi khi xóa địa chỉ');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateProfileForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      message.error('Vui lòng kiểm tra lại các trường thông tin');
      return;
    }

    saveProfileChanges();
  };

  const saveProfileChanges = async () => {
    try {
      const data = await api.put('/users/profile', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
      });

      setOriginalData(formData);
      setIsEditing(false);
      message.success('Thông tin tài khoản đã được lưu');
    } catch (error) {
      console.error('Error saving profile:', error);
      message.error('Lỗi khi lưu thông tin tài khoản');
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setErrors({});
    setIsEditing(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="profile-content">
            <div className="content-header">
              <h2>Thông tin tài khoản</h2>
              <p>Quản lý thông tin cá nhân của bạn</p>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-section">
                <div className="section-header">
                  <h3>Thông tin cơ bản</h3>
                  {!isEditing && (
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                       Chỉnh sửa
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="fullName">Họ tên</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={errors.fullName ? 'input-error' : ''}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={errors.email ? 'input-error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={errors.phone ? 'input-error' : ''}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button type="submit" className="save-btn">
                     Lưu thay đổi
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    ✕ Hủy
                  </button>
                </div>
              )}
            </form>
          </div>
        );

      case 'orders':
        return (
          <div className="orders-content">
            <div className="content-header">
              <h2>Đơn hàng của tôi</h2>
              <p>Lịch sử mua hàng và trạng thái đơn hàng</p>
            </div>

            {ordersLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" description="Đang tải đơn hàng..." />
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <p>Bạn chưa có đơn hàng nào.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h4>Đơn hàng #{order.id}</h4>
                        <p className="order-date">
                          {formatDateVi(order.createdAt)}
                        </p>
                      </div>
                      <div className={`order-status status-${order.status.toLowerCase()}`}>
                        {order.status === 'PENDING' ? ' Đang xử lý' :
                         order.status === 'COMPLETED' ? ' Hoàn thành' :
                         order.status === 'CANCELLED' ? ' Đã hủy' :
                         order.status}
                      </div>
                    </div>

                    <div className="order-items">
                      {order.items && order.items.map((item) => (
                        <div key={item.id} className="order-item">
                          <span className="item-name">
                            {item.product?.name || `Product #${item.productId}`}
                          </span>
                          <span className="item-qty">x{item.quantity}</span>
                          <span className="item-price">
                            {toSafeNumber(item.price * item.quantity).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="order-footer">
                      <div className="order-total">
                        <strong>Tổng tiền:</strong>
                        <strong className="total-price">
                          {toSafeNumber(order.totalPrice).toLocaleString('vi-VN')}đ
                        </strong>
                      </div>
                      <p className="order-address">
                        Địa chỉ: {order.shippingAddr}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'addresses':
        return (
          <div className="addresses-content">
            <div className="content-header">
              <h2>Địa chỉ giao hàng</h2>
              <p>Quản lý địa chỉ giao hàng của bạn</p>
              <button 
                className="add-address-btn"
                onClick={() => setShowAddressForm(!showAddressForm)}
              >
                 {showAddressForm ? 'Hủy' : 'Thêm địa chỉ'}
              </button>
            </div>

            {showAddressForm && (
              <div className="address-form-container">
                <form onSubmit={handleAddAddressSubmit} className="address-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Địa chỉ *</label>
                      <input
                        type="text"
                        placeholder="Số nhà, tên đường"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phường/Xã</label>
                      <input
                        type="text"
                        placeholder="Phường/Xã"
                        value={addressForm.ward}
                        onChange={(e) => setAddressForm({...addressForm, ward: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Quận/Huyện *</label>
                      <input
                        type="text"
                        placeholder="Quận/Huyện"
                        value={addressForm.district}
                        onChange={(e) => setAddressForm({...addressForm, district: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Thành phố *</label>
                      <input
                        type="text"
                        placeholder="Thành phố"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={addressForm.phoneNumber}
                      onChange={(e) => setAddressForm({...addressForm, phoneNumber: e.target.value})}
                    />
                  </div>

                  {addressFormErrors.submit && (
                    <span className="error-message">{addressFormErrors.submit}</span>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="save-btn">
                       Thêm địa chỉ
                    </button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => setShowAddressForm(false)}
                    >
                      ✕ Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            {addressesLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" description="Đang tải địa chỉ..." />
              </div>
            ) : addresses.length === 0 ? (
              <div className="empty-state">
                <p>Bạn chưa thêm địa chỉ nào.</p>
                <p style={{fontSize: '13px', color: '#999'}}>Thêm địa chỉ giao hàng để đặt hàng nhanh hơn</p>
              </div>
            ) : (
              <div className="address-list">
                {addresses.map((address) => (
                  <div key={address.id} className="address-card">
                    <div className="address-header">
                      <h4>{address.street}</h4>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteAddress(address.id)}
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                    <p>{address.ward && address.ward + ', '}{address.district}, {address.city}</p>
                    {address.phoneNumber && <p>📞 {address.phoneNumber}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-page">
      <Header />

      <main className="profile-container">
        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="user-info">
              <div className="user-avatar">
                <span>{formData.fullName.charAt(0) || 'U'}</span>
              </div>
              <div className="user-details">
                <h3>Tài khoản của</h3>
                <p>{formData.fullName || 'Người dùng'}</p>
              </div>
            </div>

            <nav className="profile-nav">
              <button
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <span className="material-icons">person</span>
                <span>Thông tin tài khoản</span>
              </button>
              <button
                className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <span className="material-icons">receipt_long</span>
                <span>Đơn hàng của tôi</span>
              </button>
              <button
                className={`nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
                onClick={() => setActiveTab('addresses')}
              >
                <span className="material-icons">location_on</span>
                <span>Địa chỉ giao hàng</span>
              </button>
            </nav>
          </aside>

          <div className="profile-main">{renderContent()}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
