import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Row, Col, Descriptions } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useCart } from '../../context/CartContext';
import './PaymentCallback.css';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const parsePaymentData = () => {
      try {
        const success = searchParams.get('success') === 'true';
        const orderId = searchParams.get('orderId');
        const transactionId = searchParams.get('transactionId');
        const responseCode = searchParams.get('responseCode');
        const message = searchParams.get('message');
        const paymentStatusStr = searchParams.get('paymentStatus');

        // If payment success, redirect to success page
        if (success) {
          const params = new URLSearchParams({
            orderId: orderId || '',
            transactionId: transactionId || '',
            paymentStatus: paymentStatusStr || '',
          });
          navigate(`/payment/success?${params.toString()}`, { replace: true });
          return;
        }

        // Handle payment failures
        const data = {
          success,
          orderId: orderId ? parseInt(orderId) : null,
          transactionId,
          responseCode,
          message,
          paymentStatus: paymentStatusStr,
        };

        setPaymentData(data);
        setPaymentStatus('error');
        
        // Redirect back to checkout after 2 seconds
        setTimeout(() => {
          const isCancelled = responseCode === '24';
          const params = new URLSearchParams();
          params.set(isCancelled ? 'cancelled' : 'failed', 'true');
          if (responseCode) params.set('responseCode', responseCode);
          navigate(`/checkout?${params.toString()}`);
        }, 2000);
      } catch (error) {
        console.error('Error parsing payment data:', error);
        setPaymentStatus('error');
      } finally {
        setLoading(false);
      }
    };

    parsePaymentData();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="payment-callback-container">
        <Spin size="large" description="Đang xử lý kết quả thanh toán..." />
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="payment-callback-container">
        <Result
          status="error"
          title="Lỗi"
          subTitle="Không thể lấy thông tin thanh toán"
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
          }
        />
      </div>
    );
  }

  const { orderId, transactionId, responseCode, message: resultMessage } = paymentData;

  const responseCodeMap = {
    '00': 'Giao dịch thành công',
    '01': 'Không tìm thấy thanh toán',
    '02': 'Giao dịch bị từ chối',
    '04': 'Số tiền không khớp',
    '24': 'Giao dịch bị hủy',
    '97': 'Chữ ký không hợp lệ',
    '99': 'Lỗi khác',
  };

  const getResponseCodeMessage = (code) => {
    return responseCodeMap[code] || `Mã lỗi: ${code}`;
  };

  // Only show error result (success redirects to /payment/success)
  return (
    <div className="payment-callback-container">
      <Result
        status="error"
        icon={<CloseCircleOutlined className="error-icon" />}
        title={responseCode === '24' ? "Giao dịch đã bị hủy" : "Thanh toán thất bại"}
        subTitle={responseCode === '24' ? "Giao dịch của bạn đã bị hủy. Hệ thống sẽ chuyển hướng bạn về trang chủ..." : `${resultMessage || getResponseCodeMessage(responseCode)}\n\nHệ thống sẽ chuyển hướng bạn về trang chủ...`}
        extra={[
          <Button type="primary" key="back" onClick={() => navigate('/checkout')}>
            Quay lại checkout
          </Button>,
        ]}
      >
        <Row style={{ marginTop: '24px', justifyContent: 'center' }}>
          <Col xs={24} sm={20} md={16} lg={12}>
            <Descriptions
              column={1}
              bordered
              size="small"
              items={[
                {
                  key: '1',
                  label: 'Mã đơn hàng',
                  children: orderId ? `#${orderId}` : 'N/A',
                },
                {
                  key: '2',
                  label: 'Mã lỗi',
                  children: responseCode || 'N/A',
                },
                {
                  key: '3',
                  label: 'Chi tiết',
                  children: getResponseCodeMessage(responseCode),
                },
              ]}
            />
          </Col>
        </Row>
      </Result>
    </div>
  );
};

export default PaymentCallback;
