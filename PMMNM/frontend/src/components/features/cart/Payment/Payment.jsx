import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useCart } from '../../../../context/CartContext';
import { useAuth } from '../../../../context/AuthContext';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user, token } = useAuth();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userAddresses, setUserAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [formData, setFormData] = useState({
    // Shipping Info
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

    // Payment Info
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  // Load user info khi component mount
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        recipientName: user.fullName || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      loadAddresses();
    }
  }, [token]);

  const loadAddresses = async () => {
    try {
      setAddressesLoading(true);
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load addresses');
      }

      const data = await response.json().catch(() => ({}));
      const addresses = data.data || [];
      setUserAddresses(addresses);

      const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        applySelectedAddress(defaultAddress);
      }
    } catch (err) {
      console.error('Error loading user addresses:', err);
      setUserAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  const applySelectedAddress = (address) => {
    setFormData((prev) => ({
      ...prev,
      address: address.street || '',
      ward: address.ward || '',
      district: address.district || '',
      city: address.city || '',
      phone: address.phoneNumber || prev.phone,
      notes: prev.notes,
    }));
  };

  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    const address = userAddresses.find((item) => item.id === addressId);
    if (address) {
      applySelectedAddress(address);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 30000;
  const discount = 0;
  const total = subtotal + shipping - discount;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s+/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setFormData(prev => ({
      ...prev,
      cardNumber: formatted
    }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setFormData(prev => ({
      ...prev,
      expiryDate: value
    }));
  };

  const handleCVVChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setFormData(prev => ({
      ...prev,
      cvv: value
    }));
  };

  const validateStep1 = () => {
    const { fullName, email, phone, address, district, city, recipientName } = formData;
    if (!fullName.trim() || !email.trim() || !phone.trim() || !address.trim() || !district.trim() || !city.trim() || !recipientName.trim()) {
      message.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { cardName, cardNumber, expiryDate, cvv } = formData;
    if (!cardName.trim() || !cardNumber.trim() || !expiryDate.trim() || !cvv.trim()) {
      message.error('Vui lòng điền đầy đủ thông tin thẻ');
      return false;
    }
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      message.error('Số thẻ phải có 16 chữ số');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (step === 2) {
      if (paymentMethod === 'card' && !validateStep2()) return;

      // Check if cart is not empty
      if (cartItems.length === 0) {
        message.error('Giỏ hàng của bạn trống!');
        return;
      }

      setStep(3);
    }
  };

  const handleConfirmOrder = async () => {
    try {
      setLoading(true);

      if (!token) {
        throw new Error('Bạn cần đăng nhập để đặt hàng');
      }

      const response = await fetch(`${API_BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddr: `${formData.address}${formData.ward ? ', ' + formData.ward : ''}${formData.district ? ', ' + formData.district : ''}${formData.city ? ', ' + formData.city : ''}`,
          phoneNumber: formData.phone,
          note: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể đặt đơn hàng');
      }

      message.success('Đơn hàng đã được đặt thành công!');
      setError('');
      clearCart();
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      console.error('Error placing order:', err);
      const errorMsg = err.message || 'Có lỗi khi đặt hàng. Vui lòng thử lại!';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="payment-container">
      <div className="payment-wrapper">
        {/* Progress Bar */}
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
          {/* Left - Form */}
          <div className="payment-form">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="form-section">
                <h2>Thông Tin Giao Hàng</h2>

                {error && <div className="error-message">{error}</div>}
                {loading && <div className="loading-message">Đang tải...</div>}

                {addressesLoading ? (
                  <div className="loading-message">Đang tải địa chỉ đã lưu...</div>
                ) : userAddresses.length > 0 ? (
                  <div className="saved-addresses">
                    <label>Địa chỉ đã lưu</label>
                    <div className="address-options">
                      {userAddresses.map((address) => (
                        <label key={address.id} className={`address-option ${selectedAddressId === address.id ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="selectedAddress"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={() => handleAddressSelect(address.id)}
                          />
                          <span>
                            {address.street}, {address.ward ? `${address.ward}, ` : ''}{address.district}, {address.city}
                            {address.isDefault && ' (Mặc định)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="no-address-form">
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
                      placeholder="Nhập địa chỉ cụ thể"
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
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="form-section">
                <h2>Phương Thức Thanh Toán</h2>

                <div className="payment-methods">
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="option-label"> Thẻ Tín Dụng / Ghi Nợ</span>
                  </label>
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="option-label">🏦 Chuyển Khoản Ngân Hàng</span>
                  </label>
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="option-label">📱 Ví Điện Tử</span>
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div className="card-form">
                    <div className="form-group">
                      <label>Tên Chủ Thẻ</label>
                      <input
                        type="text"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        placeholder="Nhập tên trên thẻ"
                      />
                    </div>

                    <div className="form-group">
                      <label>Số Thẻ</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Hạn Sử Dụng</label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          maxLength="5"
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleCVVChange}
                          placeholder="123"
                          maxLength="3"
                        />
                      </div>
                    </div>

                    <div className="security-info">
                      🔒 Thông tin thẻ của bạn được mã hóa và bảo mật
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank' && (
                  <div className="bank-info">
                    <p>Vui lòng chuyển khoản đến tài khoản dưới đây:</p>
                    <div className="bank-details">
                      <div><strong>Ngân hàng:</strong> ACB (Ngân hàng Á Châu)</div>
                      <div><strong>Số tài khoản:</strong> 123456789</div>
                      <div><strong>Tên chủ tài khoản:</strong> CÔNG TY CỔ PHẦN THƯƠNG MỤC</div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'wallet' && (
                  <div className="wallet-info">
                    <p>Chọn ví điện tử để thanh toán</p>
                    <div className="wallet-options">
                      <button className="wallet-btn">Momo</button>
                      <button className="wallet-btn">ZaloPay</button>
                      <button className="wallet-btn">ViettelPay</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="form-section">
                <h2>Xác Nhận Đơn Hàng</h2>

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
                      {paymentMethod === 'card' && ' Thẻ Tín Dụng / Ghi Nợ'}
                      {paymentMethod === 'bank' && ' Chuyển Khoản Ngân Hàng'}
                      {paymentMethod === 'wallet' && ' Ví Điện Tử'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="form-actions">
              {step > 1 && (
                <button className="btn btn-secondary" onClick={handlePreviousStep}>
                   Quay Lại
                </button>
              )}
              {step < 3 && (
                <button className="btn btn-primary" onClick={handleNextStep} disabled={loading}>
                  Tiếp Tục 
                </button>
              )}
              {step === 3 && (
                <button className="btn btn-success" onClick={handleConfirmOrder} disabled={loading}>
                  {loading ? 'Đang xử lý...' : '✓ Đặt Hàng Ngay'}
                </button>
              )}
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="order-summary">
            <h3>Tóm Tắt Đơn Hàng</h3>

            {cartItems && cartItems.length > 0 ? (
              <>
                <div className="cart-items">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="cart-item">
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
                  <span>{formatCurrency(shipping)}</span>
                </div>
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

export default Payment;