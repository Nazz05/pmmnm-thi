import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Space, Spin, Pagination, Row, Col, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../../../context/AuthContext';
import './AuditLogsView.css';

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

const AuditLogsView = () => {
    const { token } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [filterUser, setFilterUser] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterEntity, setFilterEntity] = useState('');

    useEffect(() => {
        fetchLogs(0, '', '', '');
    }, []);

    const fetchLogs = async (pageNum = 0, user = filterUser, actionType = filterType, entity = filterEntity) => {
        try {
            setLoading(true);
            
            const params = new URLSearchParams({
                page: pageNum + 1,
                limit: size,
                ...(user && { userId: user }),
                ...(actionType && { action: actionType }),
                ...(entity && { entity })
            });

            const response = await fetch(`${API_BASE_URL}/admin/audit-logs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load audit logs');
            }

            const data = await response.json().catch(() => ({}));
            setLogs(data.data?.content || []);
            setTotal(data.data?.totalElements || 0);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching logs:', error);
            message.error('Lỗi khi tải audit logs');
            setLogs([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchLogs(0, filterUser, filterType, filterEntity);
    };

    const handleReset = () => {
        setFilterUser('');
        setFilterType('');
        setFilterEntity('');
        fetchLogs(0, '', '', '');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getActionColor = (actionType) => {
        const colors = {
            'create': '#52c41a',
            'update': '#1890ff',
            'delete': '#f5222d',
            'login': '#faad14',
            'logout': '#722ed1',
            'register': '#13c2c2'
        };
        return colors[actionType?.toLowerCase()] || '#1890ff';
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 60,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Hành động',
            dataIndex: 'action',
            width: 100,
            render: (text) => (
                <span style={{
                    backgroundColor: getActionColor(text),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                    {text}
                </span>
            ),
        },
        {
            title: 'Entity',
            dataIndex: 'entity',
            width: 100,
        },
        {
            title: 'Entity ID',
            dataIndex: 'entityId',
            width: 120,
            render: (text) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text || '-'}</span>,
        },
        {
            title: 'User ID',
            dataIndex: 'userId',
            width: 100,
            render: (text) => text || '-',
        },
        {
            title: 'Service',
            dataIndex: 'sourceService',
            width: 120,
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            width: 180,
            render: (text) => formatDate(text),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
    ];

    return (
        <div className="audit-logs-view">
            <div className="audit-logs-header">
                <h1>Audit Logs</h1>
            </div>

            <div className="audit-logs-filters">
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Tìm theo User ID"
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            prefix={<SearchOutlined />}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="-- Loại hành động --"
                            value={filterType || undefined}
                            onChange={(value) => setFilterType(value || '')}
                        >
                            <Select.Option value="">-- Chọn --</Select.Option>
                            <Select.Option value="created">created</Select.Option>
                            <Select.Option value="create">create</Select.Option>
                            <Select.Option value="update">update</Select.Option>
                            <Select.Option value="delete">delete</Select.Option>
                            <Select.Option value="login">login</Select.Option>
                            <Select.Option value="logout">logout</Select.Option>
                            <Select.Option value="register">register</Select.Option>
                            <Select.Option value="checkout">checkout</Select.Option>
                            <Select.Option value="cancel">cancel</Select.Option>
                            <Select.Option value="status_update">status_update</Select.Option>
                            <Select.Option value="payment_success">payment_success</Select.Option>
                            <Select.Option value="payment_failed">payment_failed</Select.Option>
                        </Select>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="-- Entity --"
                            value={filterEntity || undefined}
                            onChange={(value) => setFilterEntity(value || '')}
                        >
                            <Select.Option value="">-- Chọn --</Select.Option>
                            <Select.Option value="order">ORDER</Select.Option>
                            <Select.Option value="product">PRODUCT</Select.Option>
                            <Select.Option value="user">USER</Select.Option>
                        </Select>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Space>
                            <Button 
                                type="primary" 
                                icon={<SearchOutlined />}
                                onClick={handleSearch}
                            >
                                Tìm
                            </Button>
                            <Button 
                                icon={<ReloadOutlined />}
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>

            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={logs.map((log) => ({ ...log, key: log.id }))}
                    pagination={false}
                    scroll={{ x: 1000 }}
                    bordered
                    size="middle"
                />
            </Spin>

            {total > size && (
                <div className="audit-logs-pagination">
                    <Pagination
                        current={page + 1}
                        pageSize={size}
                        total={total}
                            onChange={(pageNum) => fetchLogs(pageNum - 1, filterUser, filterType, filterEntity)}
                        showTotal={(total) => `Tổng cộng ${total} logs`}
                    />
                </div>
            )}
        </div>
    );
};

export default AuditLogsView;
