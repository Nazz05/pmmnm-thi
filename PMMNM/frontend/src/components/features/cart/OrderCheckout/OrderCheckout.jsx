import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useCart } from '../../../../context/CartContext';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';
import './OrderCheckout.css';

const OrderCheckout = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    ward: '',
    district: '',
    city: '',
    postalCode: '',
    recipientName: '',
    notes: '',
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    const cancelled = searchParams.get('cancelled') === 'true';
    const failed = searchParams.get('failed') === 'true';
    
    if (cancelled) {
      setPaymentMethod('');
      setStep(2);
      message.error('Giao dịch thanh toán đã bị hủy. Vui lòng chọn phương thức thanh toán khác.');
      setSearchParams({});
    }
    
    if (failed) {
      setPaymentMethod('');
      setStep(2);
      const responseCode = searchParams.get('responseCode');
      const responseCodeMap = {
        '01': 'Không tìm thấy thanh toán',
        '02': 'Giao dịch bị từ chối',
        '04': 'Số tiền không khớp',
        '97': 'Chữ ký không hợp lệ',
        '99': 'Lỗi khác',
      };
      const errorMsg = responseCodeMap[responseCode] || 'Thanh toán thất bại. Vui lòng thử lại.';
      message.error(`${errorMsg} Vui lòng chọn phương thức thanh toán khác.`);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Initialize form with user data on mount
  useEffect(() => {
    if (user?.fullName || user?.phone) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        recipientName: user.fullName || prev.recipientName,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const fetchUserAddresses = async () => {
    if (!token) return;
    try {
      const result = await api.get('/addresses');
      const addresses = result.data || [];
      setUserAddresses(addresses);

      if (addresses.length === 0) {
        setShowAddNewAddress(true);
        setSelectedAddressId(null);
        return;
      }

      const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
      setShowAddNewAddress(false);
      fillFormWithAddress(defaultAddress);
    } catch (error) {
      console.error('Lỗi khi tải danh sách địa chỉ:', error);
    }
  };

  useEffect(() => {
    fetchUserAddresses();
  }, [token]);

  useEffect(() => {
    if (userAddresses.length > 0 && selectedAddressId === null) {
      const defaultAddress = userAddresses.find((addr) => addr.isDefault) || userAddresses[0];
      setSelectedAddressId(defaultAddress.id);
      fillFormWithAddress(defaultAddress, user);
    }

    if (userAddresses.length === 0) {
      setShowAddNewAddress(true);
    }
  }, [userAddresses, selectedAddressId]);

  useEffect(() => {
    if (!showAddNewAddress && selectedAddressId !== null) {
      const selectedAddress = userAddresses.find((address) => address.id === selectedAddressId);
      if (selectedAddress) {
        fillFormWithAddress(selectedAddress, user);
      }
    }
  }, [selectedAddressId, showAddNewAddress, userAddresses]);

  const fillFormWithAddress = (address, userObj = user) => {
    setFormData((prev) => {
      const filledData = {
        ...prev,
        // Use address recipientName, fallback to user fullName, then prev
        recipientName: address.recipientName || userObj?.fullName || prev.recipientName,
        // Use address phone/phoneNumber, fallback to user phone, then prev
        phone: address.phone || address.phoneNumber || userObj?.phone || prev.phone,
        // Address fields with multiple field name options
        address: address.addressLine || address.street || prev.address,
        ward: address.ward || prev.ward,
        district: address.district || prev.district,
        city: address.province || address.city || prev.city,
        postalCode: address.postalCode || address.zipCode || prev.postalCode,
        notes: address.notes || prev.notes,
        fullName: address.recipientName || userObj?.fullName || prev.fullName,
      };
      return filledData;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getShippingFee = () => {
    const subtotal = getCartTotal();
    return subtotal > 500000 ? 0 : 30000;
  };

  const validateStep1 = () => {
    const { recipientName, phone, address, ward, district, city } = formData;
    if (!recipientName.trim() || !phone.trim() || !address.trim() || !ward.trim() || !district.trim() || !city.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin giao hàng');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const validateStep2 = () => {
    if (!paymentMethod || paymentMethod.trim() === '') {
      setErrorMessage('Vui lòng chọn phương thức thanh toán');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleConfirmOrder = async () => {
    if (!user?.id || !token) {
      message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống.');
      return;
    }

    try {
      setLoading(true);

      // Format shipping address as a single string
      const shippingAddr = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`;

      const resolveProductId = (item) => {
        const candidates = [
          item?.productId,
          item?.product?.id,
          item?.product?.productId,
          item?.id,
        ];

        for (const candidate of candidates) {
          const parsed = Number.parseInt(String(candidate ?? ''), 10);
          if (Number.isInteger(parsed) && parsed > 0) {
            return parsed;
          }
        }

        return null;
      };

      const resolveQuantity = (item) => {
        const candidates = [item?.quantity, item?.qty, item?.count];

        for (const candidate of candidates) {
          const parsed = Number.parseInt(String(candidate ?? ''), 10);
          if (Number.isInteger(parsed) && parsed > 0) {
            return parsed;
          }
        }

        return 1;
      };

      let items = cartItems
        .map((item) => {
          const productId = resolveProductId(item);
          if (!Number.isInteger(productId) || productId <= 0) {
            return null;
          }

          return {
            productId,
            quantity: resolveQuantity(item),
          };
        })
        .filter(Boolean);

      // Nếu mapping từ client ra rỗng, cố gắng lấy giỏ hàng từ server (trường hợp đồng bộ sai/guest->user)
      if (items.length === 0) {
        try {
          const cartResp = await api.get('/cart');
          const serverItems = cartResp?.data?.items || [];
          if (Array.isArray(serverItems) && serverItems.length > 0) {
            items = serverItems
              .map((ci) => {
                const pid = Number(ci.productId);
                const qty = Number(ci.quantity || 1);
                if (!Number.isInteger(pid) || pid <= 0) return null;
                return { productId: pid, quantity: qty > 0 ? qty : 1 };
              })
              .filter(Boolean);
          }
        } catch (err) {
          console.warn('Error fetching server cart fallback:', err);
        }
      }

      if (items.length === 0) {
        setErrorMessage('Giỏ hàng không có sản phẩm hợp lệ.');
        return;
      }

      const orderData = {
        shippingAddr: shippingAddr,
        phoneNumber: formData.phone,
        note: formData.notes,
        items,
      };

      const result = await api.post('/orders', orderData);
      const orderId = result.data?.id;

      // If payment method is VNPAY, create payment URL and redirect
      if (paymentMethod === 'vnpay' && orderId) {
        const paymentData = await api.post('/payments/vnpay/create-url', {
          orderId: orderId,
          locale: 'vn',
        });

        setSuccessMessage('Đơn hàng đã được tạo! Chuyển hướng đến VNPAY...');
        message.success('Vui lòng hoàn thành thanh toán');
        
        // DO NOT clear cart here - only clear after successful payment
        // clearCart() will be called in PaymentCallback after success
        
        // Redirect to VNPAY payment URL
        setTimeout(() => {
          window.location.href = paymentData.data?.paymentUrl;
        }, 1000);
      } else {
        // COD or other methods - order created successfully, show success page
        setSuccessMessage('Đơn hàng đã được tạo thành công!');
        message.success('Đặt hàng thành công');
        clearCart();
        setTimeout(() => {
          navigate(`/payment/success?orderId=${orderId}&paymentStatus=cod`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setErrorMessage(error.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
      message.error(error.message || 'Đặt hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Calculate subtotal and shipping for render
  const subtotal = getCartTotal();
  const shipping = 30000; // Assuming fixed shipping fee
  const discount = 0;
  const total = subtotal + shipping - discount;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="payment-container">
      <div className="payment-header">
        <Button 
          type="primary" 
          ghost 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          className="back-to-home-btn"
        >
          Quay Lại Trang Chủ
        </Button>
      </div>
      <div className="payment-wrapper">
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Giao Hàng</span>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Thanh Toán</span>
          </div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Xác Nhận</span>
          </div>
        </div>

        <div className="payment-content">
          <div className="payment-form">
            {step === 1 && (
              <div className="form-section">
                <h2>Thông Tin Giao Hàng</h2>

                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                {/* Select existing address */}
                {!showAddNewAddress && userAddresses.length > 0 && (
                  <div className="address-selection">
                    <h3>Chọn Địa Chỉ Có Sẵn</h3>
                    <div className="address-list">
                      {userAddresses.map((address) => (
                        <label key={address.id} className="address-option">
                          <input
                            type="radio"
                            name="addressSelection"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={() => {
                              setSelectedAddressId(address.id);
                              fillFormWithAddress(address);
                            }}
                          />
                          <div className="address-info">
                            <p className="recipient-name">{address.recipientName || user?.fullName} ({address.phone || address.phoneNumber || user?.phone})</p>
                            <p className="address-text">{address.addressLine || address.street}, {address.ward}, {address.district}, {address.province || address.city}</p>
                            {address.isDefault && <span className="badge-default">Mặc định</span>}
                          </div>
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-add-new"
                      onClick={() => {
                        setShowAddNewAddress(true);
                        setFormData((prev) => ({
                          ...prev,
                          recipientName: '',
                          phone: '',
                          address: '',
                          ward: '',
                          district: '',
                          city: '',
                          postalCode: '',
                          notes: '',
                        }));
                      }}
                    >
                       Thêm Địa Chỉ Mới
                    </button>
                  </div>
                )}

                {/* Add new address form */}
                {showAddNewAddress && (
                  <div className="new-address-form">
                    <h3>Thêm Địa Chỉ Mới</h3>
                    <div className="form-group">
                      <label>Tên Người Nhận *</label>
                      <input
                        type="text"
                        name="recipientName"
                        value={formData.recipientName}
                        onChange={handleInputChange}
                        placeholder="Nhập tên người nhận"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="example@email.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>Số Điện Thoại *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="0912 345 678"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Địa Chỉ Chi Tiết *</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Nhập địa chỉ cụ thể (Số nhà, đường phố)"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Phường/Xã *</label>
                        <input
                          type="text"
                          name="ward"
                          value={formData.ward}
                          onChange={handleInputChange}
                          placeholder="Nhập phường/xã"
                        />
                      </div>
                      <div className="form-group">
                        <label>Quận/Huyện *</label>
                        <input
                          type="text"
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          placeholder="Nhập quận/huyện"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Tỉnh/Thành Phố *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Nhập tỉnh/thành phố"
                        />
                      </div>
                      <div className="form-group">
                        <label>Mã Bưu Chính</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          placeholder="Mã bưu chính"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Ghi Chú</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="VD: Cách nhà trước tòa nhà màu xanh"
                        rows="3"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-cancel-new"
                      onClick={() => {
                        if (userAddresses.length > 0) {
                          const defaultAddress = userAddresses.find((addr) => addr.isDefault) || userAddresses[0];
                          setSelectedAddressId(defaultAddress.id);
                          fillFormWithAddress(defaultAddress);
                          setShowAddNewAddress(false);
                        } else {
                          setShowAddNewAddress(false);
                          setSelectedAddressId(null);
                        }
                      }}
                    >
                       Quay Lại Danh Sách Địa Chỉ
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="form-section">
                <h2>Phương Thức Thanh Toán</h2>

                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <div className="payment-methods">
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="option-label"> Thanh Toán Khi Nhận Hàng (COD)</span>
                  </label>
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="vnpay"
                      checked={paymentMethod === 'vnpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="option-label"> Thanh Toán Qua VNPAY</span>
                  </label>
                </div>

                

                {paymentMethod === 'vnpay' && (
                  <div className="vnpay-info">
                    <p>Thanh toán an toàn qua cổng VNPAY</p>
                    <p>Hỗ trợ: Thẻ tín dụng, thẻ ghi nợ, ví điện tử</p>
                  </div>
                )}

                <div className="confirmation-section">
                  <div className="confirmation-block">
                    <h3>Địa Chỉ Giao Hàng</h3>
                    <p><strong>{formData.recipientName}</strong></p>
                    <p>{formData.address}, {formData.ward}, {formData.district}, {formData.city}</p>
                    <p>ĐT: {formData.phone}</p>
                    {formData.notes && <p>Ghi chú: {formData.notes}</p>}
                  </div>
                  <div className="confirmation-block">
                    <h3>Phương Thức Thanh Toán</h3>
                    <p>
                      {paymentMethod === 'cod' && 'Thanh Toán Khi Nhận Hàng (COD)'}
                      {paymentMethod === 'vnpay' && 'Thanh Toán Qua VNPAY'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-section">
                <h2>Xác Nhận Đặt Hàng</h2>

                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <div className="confirmation-section">
                  <div className="confirmation-block">
                    <h3>Địa Chỉ Giao Hàng</h3>
                    <p><strong>{formData.recipientName}</strong></p>
                    <p>{formData.address}, {formData.ward}, {formData.district}, {formData.city}</p>
                    <p>ĐT: {formData.phone}</p>
                    {formData.notes && <p><strong>Ghi chú:</strong> {formData.notes}</p>}
                  </div>

                  <div className="confirmation-block">
                    <h3>Phương Thức Thanh Toán</h3>
                    <div>
                      {paymentMethod === 'cod' && (
                        <>
                          <strong>Thanh Toán Khi Nhận Hàng (COD)</strong>
                          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                            ✓ Thanh toán trực tiếp cho nhân viên giao hàng<br/>
                            ✓ Không phí trả góp, không phí thanh toán<br/>
                            ✓ Kiểm tra hàng trước khi thanh toán
                          </div>
                        </>
                      )}
                      {paymentMethod === 'vnpay' && (
                        <>
                          <strong>Thanh Toán Qua VNPAY</strong>
                          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                            Thanh toán an toàn qua cổng VNPAY<br/>
                            Hỗ trợ: Thẻ tín dụng, thẻ ghi nợ, ví điện tử
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="confirmation-block">
                    <h3>Sản Phẩm</h3>
                    {cartItems.map((item) => (
                      <div key={`${item.id}-${item.size}-${item.color}`} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        paddingBottom: '8px',
                        borderBottom: '1px solid #eee',
                        marginBottom: '8px'
                      }}>
                        <span>
                          <strong>{item.name}</strong> x{item.quantity}
                          {item.size && <span> (Size: {item.size})</span>}
                          {item.color && <span> (Màu: {item.color})</span>}
                        </span>
                        <span><strong>{formatCurrency(item.price * item.quantity)}</strong></span>
                      </div>
                    ))}
                  </div>

                  <div className="confirmation-block" style={{ backgroundColor: '#f0f8ff'}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Tạm Tính:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Phí Vận Chuyển:</span>
                      <span>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                      <span>Tổng Cộng:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              {step > 1 && (
                <button className="btn btn-secondary" onClick={handlePreviousStep}>
                  Quay Lại
                </button>
              )}
              {step < 3 && (
                <button className="btn btn-primary" onClick={handleNextStep}>
                  Tiếp Tục 
                </button>
              )}
              {step === 3 && (
                <button className="btn btn-success" onClick={handleConfirmOrder} disabled={loading}>
                  {loading ? ' Đang xử lý...' : ' Đặt Hàng Ngay'}
                </button>
              )}
            </div>
          </div>

          <div className="order-summary">
            <h3>Tóm Tắt Đơn Hàng</h3>
            {cartItems.length > 0 ? (
              <>
                <div className="cart-items">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="cart-item-summary">
                      <div className="item-image">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : '📦'}
                      </div>
                      <div className="item-details">
                        <p className="item-name">{item.name}</p>
                        {item.size && <p className="item-size">Size: {item.size}</p>}
                        {item.color && <p className="item-color">Màu: {item.color}</p>}
                        <p className="item-qty">x{item.quantity}</p>
                      </div>
                      <div className="item-price">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary-divider"></div>
                <div className="summary-row">
                  <span>Tạm Tính:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Phí Vận Chuyển:</span>
                  <span>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span>
                </div>
                {shipping === 0 && (
                  <p className="free-shipping-note"> Miễn phí vận chuyển cho đơn hàng từ 500.000 ₫</p>
                )}
                {discount > 0 && (
                  <div className="summary-row discount">
                    <span>Giảm Giá:</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="summary-divider"></div>
                <div className="summary-total">
                  <span>Tổng Tiền:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="payment-info">
                  <p>✓ Miễn phí vận chuyển cho đơn hàng trên 500.000đ</p>
                  <p>✓ Hỗ trợ 24/7</p>
                  <p>✓ Hoàn tiền 100% nếu không hài lòng</p>
                </div>
              </>
            ) : (
              <div className="empty-cart">
                <p>🛒 Giỏ hàng của bạn trống</p>
                <p>Vui lòng quay lại cửa hàng để thêm sản phẩm</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCheckout;
