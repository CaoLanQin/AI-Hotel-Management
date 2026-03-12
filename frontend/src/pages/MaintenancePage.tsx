import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Row, Col, Tag, Button, Table, Statistic, Select, Badge, Empty, Modal, Form, Input, message, Popconfirm, DatePicker } from 'antd';
import { 
  Wrench, AlertCircle, CheckCircle, Clock, User, Home, 
  Plus, RefreshCw, Search, Filter
} from 'lucide-react';
import api from '../lib/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface RepairRequest {
  id: number;
  request_no: string;
  room_number: string;
  device_type: string;
  description: string;
  priority: string;
  status: string;
  reporter_name: string;
  assignee_name?: string;
  created_at: string;
  completed_at?: string;
}

const MaintenancePage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();

  // Get rooms
  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data?.rooms || res.data || [];
    },
  });

  // Simulated repair requests data
  const { data: repairData, isLoading, refetch } = useQuery({
    queryKey: ['repair-requests', statusFilter],
    queryFn: async () => {
      // Simulated data
      const mockData: RepairRequest[] = [
        { id: 1, request_no: 'RE20260312001', room_number: '1001', device_type: 'ac', description: '空调不制冷', priority: 'high', status: 'pending', reporter_name: '张三', created_at: dayjs().subtract(2, 'hour').toISOString() },
        { id: 2, request_no: 'RE20260312002', room_number: '1005', device_type: 'light', description: '卧室灯不亮', priority: 'medium', status: 'in_progress', assignee_name: '维修员A', reporter_name: '李四', created_at: dayjs().subtract(5, 'hour').toISOString() },
        { id: 3, request_no: 'RE20260311003', room_number: '2003', device_type: 'lock', description: '门锁故障', priority: 'high', status: 'completed', assignee_name: '维修员B', reporter_name: '王五', created_at: dayjs().subtract(1, 'day').toISOString(), completed_at: dayjs().subtract(3, 'hour').toISOString() },
        { id: 4, request_no: 'RE20260311004', room_number: '1508', device_type: 'tv', description: '电视无信号', priority: 'low', status: 'pending', reporter_name: '赵六', created_at: dayjs().subtract(1, 'day').toISOString() },
        { id: 5, request_no: 'RE20260310005', room_number: '1206', device_type: 'curtain', description: '窗帘无法关闭', priority: 'medium', status: 'completed', assignee_name: '维修员A', reporter_name: '孙七', created_at: dayjs().subtract(2, 'day').toISOString(), completed_at: dayjs().subtract(1, 'day').toISOString() },
      ];
      return mockData;
    },
  });

  // Filter requests
  const filteredRequests = (repairData || []).filter((req: RepairRequest) => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (searchKeyword && !req.request_no.toLowerCase().includes(searchKeyword.toLowerCase()) && 
        !req.room_number.includes(searchKeyword)) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: (repairData || []).length,
    pending: (repairData || []).filter(r => r.status === 'pending').length,
    inProgress: (repairData || []).filter(r => r.status === 'in_progress').length,
    completed: (repairData || []).filter(r => r.status === 'completed').length,
  };

  // Create repair request
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      // Simulated API call
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      message.success('报修请求已提交');
      setShowModal(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });

  // Handle form submit
  const handleSubmit = (values: any) => {
    createMutation.mutate(values);
  };

  // Update status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      message.success('状态已更新');
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });

  // Get status tag
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待处理' },
      in_progress: { color: 'blue', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
    };
    const map = statusMap[status] || { color: 'default', text: status };
    return <Tag color={map.color}>{map.text}</Tag>;
  };

  // Get priority tag
  const getPriorityTag = (priority: string) => {
    const priorityMap: Record<string, { color: string; text: string }> = {
      high: { color: 'red', text: '紧急' },
      medium: { color: 'orange', text: '一般' },
      low: { color: 'blue', text: '低' },
    };
    const map = priorityMap[priority] || { color: 'default', text: priority };
    return <Tag color={map.color}>{map.text}</Tag>;
  };

  // Get device type name
  const getDeviceTypeName = (type: string) => {
    const names: Record<string, string> = {
      ac: '空调',
      light: '照明',
      lock: '门锁',
      tv: '电视',
      curtain: '窗帘',
      fan: '风扇',
    };
    return names[type] || type;
  };

  // Columns
  const columns = [
    {
      title: '工单号',
      dataIndex: 'request_no',
      key: 'request_no',
      render: (no: string) => <span className="font-mono text-sm">{no}</span>,
    },
    {
      title: '房间',
      dataIndex: 'room_number',
      key: 'room_number',
      render: (no: string) => (
        <div className="flex items-center gap-1">
          <Home size={14} />
          {no}
        </div>
      ),
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
      render: (type: string) => (
        <Tag>{getDeviceTypeName(type)}</Tag>
      ),
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '报修人',
      dataIndex: 'reporter_name',
      key: 'reporter_name',
      render: (name: string) => (
        <div className="flex items-center gap-1">
          <User size={14} />
          {name}
        </div>
      ),
    },
    {
      title: '处理人',
      dataIndex: 'assignee_name',
      key: 'assignee_name',
      render: (name: string) => name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => dayjs(time).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: RepairRequest) => (
        <div className="flex gap-1">
          {record.status === 'pending' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => updateStatusMutation.mutate({ id: record.id, status: 'in_progress' })}
            >
              开始处理
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button 
              type="primary"
              size="small"
              onClick={() => updateStatusMutation.mutate({ id: record.id, status: 'completed' })}
            >
              完成
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🔧 维修管理</h1>
        <Button 
          type="primary" 
          icon={<Plus size={18} />}
          onClick={() => setShowModal(true)}
        >
          新建报修
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card>
            <Statistic 
              title="工单总数" 
              value={stats.total} 
              prefix={<Wrench />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="待处理" 
              value={stats.pending} 
              prefix={<AlertCircle />}
              valueStyle={{ color: stats.pending > 0 ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="处理中" 
              value={stats.inProgress} 
              prefix={<Clock />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已完成" 
              value={stats.completed} 
              prefix={<CheckCircle />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="搜索工单号/房间号..."
              prefix={<Search size={16} />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={8}>
            <Select
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待处理</Option>
              <Option value="in_progress">处理中</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Button icon={<RefreshCw size={16} />} onClick={() => refetch()}>刷新</Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          dataSource={filteredRequests}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="暂无报修工单" /> }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="新建报修"
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="room_id"
            label="报修房间"
            rules={[{ required: true, message: '请选择房间' }]}
          >
            <Select placeholder="选择房间">
              {(roomsData || []).map((room: any) => (
                <Option key={room.id} value={room.id}>
                  {room.number} - {room.room_type?.name || '未知房型'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="device_type"
            label="设备类型"
            rules={[{ required: true, message: '请选择设备类型' }]}
          >
            <Select placeholder="选择设备类型">
              <Option value="ac">空调</Option>
              <Option value="light">照明</Option>
              <Option value="lock">门锁</Option>
              <Option value="tv">电视</Option>
              <Option value="curtain">窗帘</Option>
              <Option value="fan">风扇</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            initialValue="medium"
          >
            <Select>
              <Option value="high">紧急</Option>
              <Option value="medium">一般</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="问题描述"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea rows={3} placeholder="描述设备故障情况..." />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                提交报修
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaintenancePage;
