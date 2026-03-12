import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Tag, Button, Table, Statistic, Select, Badge, Empty, Tabs, List } from 'antd';
import { 
  Shield, AlertTriangle, Camera, Eye, Video, UserCheck, 
  Lock, Unlock, Bell, Clock, MapPin, RefreshCw
} from 'lucide-react';
import api from '../lib/api';
import dayjs from 'dayjs';

const { Option } = Select;

interface Alert {
  id: number;
  type: string;
  message: string;
  severity: string;
  location: string;
  created_at: string;
  is_handled: boolean;
}

interface Camera {
  id: number;
  name: string;
  location: string;
  status: string;
  type: string;
}

interface AccessRecord {
  id: number;
  user_name: string;
  card_no: string;
  location: string;
  action: string;
  time: string;
}

const SecurityMonitoringPage = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // Fetch alerts
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      const res = await api.get('/dashboard/alerts');
      return res.data as Alert[];
    },
  });

  // Fetch camera data (simulated)
  const { data: camerasData, isLoading: camerasLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: async () => {
      // Simulated camera data
      return [
        { id: 1, name: '大堂摄像头1', location: '1楼大堂', status: 'online', type: 'face' },
        { id: 2, name: '大堂摄像头2', location: '1楼大堂', status: 'online', type: 'general' },
        { id: 3, name: '电梯摄像头', location: '电梯', status: 'online', type: 'general' },
        { id: 4, name: '楼层摄像头1', location: '2楼走廊', status: 'online', type: 'general' },
        { id: 5, name: '楼层摄像头2', location: '3楼走廊', status: 'offline', type: 'general' },
        { id: 6, name: '后门摄像头', location: '后门', status: 'online', type: 'face' },
      ] as Camera[];
    },
  });

  // Fetch access records
  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: ['access-records'],
    queryFn: async () => {
      // Simulated access records
      return [
        { id: 1, user_name: '张三', card_no: '8801', location: '1楼大堂', action: '进入', time: dayjs().subtract(5, 'minute').toISOString() },
        { id: 2, user_name: '李四', card_no: '8802', location: '电梯', action: '进入', time: dayjs().subtract(10, 'minute').toISOString() },
        { id: 3, user_name: '王五', card_no: '8803', location: '2楼走廊', action: '进入', time: dayjs().subtract(15, 'minute').toISOString() },
        { id: 4, user_name: '访客-001', card_no: 'V001', location: '1楼大堂', action: '进入', time: dayjs().subtract(20, 'minute').toISOString() },
        { id: 5, user_name: '赵六', card_no: '8805', location: '后门', action: '离开', time: dayjs().subtract(25, 'minute').toISOString() },
      ] as AccessRecord[];
    },
  });

  // Statistics
  const stats = {
    totalAlerts: (alertsData || []).length,
    pendingAlerts: (alertsData || []).filter(a => !a.is_handled).length,
    onlineCameras: (camerasData || []).filter(c => c.status === 'online').length,
    totalCameras: (camerasData || []).length,
    todayAccess: (accessData || []).length,
  };

  // Alert columns
  const alertColumns = [
    { 
      title: '时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (val: string) => dayjs(val).format('HH:mm:ss')
    },
    { 
      title: '严重程度', 
      dataIndex: 'severity', 
      key: 'severity',
      render: (sev: string) => {
        const colors: Record<string, string> = {
          high: 'red',
          medium: 'orange',
          low: 'blue'
        };
        const names: Record<string, string> = {
          high: '严重',
          medium: '一般',
          low: '轻微'
        };
        return <Tag color={colors[sev] || 'default'}>{names[sev] || sev}</Tag>;
      }
    },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { title: '消息', dataIndex: 'message', key: 'message' },
    { 
      title: '状态', 
      dataIndex: 'is_handled', 
      key: 'is_handled',
      render: (handled: boolean) => handled ? 
        <Badge status="success" text="已处理" /> : 
        <Badge status="warning" text="待处理" />
    },
  ];

  // Access columns
  const accessColumns = [
    { 
      title: '时间', 
      dataIndex: 'time', 
      key: 'time',
      render: (val: string) => dayjs(val).format('HH:mm')
    },
    { title: '姓名', dataIndex: 'user_name', key: 'user_name' },
    { title: '卡号', dataIndex: 'card_no', key: 'card_no' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { 
      title: '动作', 
      dataIndex: 'action', 
      key: 'action',
      render: (action: string) => (
        <Tag color={action === '进入' ? 'green' : 'blue'}>{action}</Tag>
      )
    },
  ];

  // Camera columns
  const cameraColumns = [
    { title: '摄像头名称', dataIndex: 'name', key: 'name' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: string) => (
        <Tag>{type === 'face' ? '人脸识别' : '普通监控'}</Tag>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        status === 'online' ? 
          <Badge status="success" text="在线" /> : 
          <Badge status="error" text="离线" />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Camera) => (
        <div className="flex gap-2">
          <Button type="link" size="small" icon={<Video size={14} />}>查看</Button>
          <Button type="link" size="small" icon={<Clock size={14} />}>回放</Button>
        </div>
      )
    }
  ];

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span><Shield size={16} /> 监控概览</span>
      ),
      children: (
        <div className="space-y-4">
          {/* Stats */}
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="待处理告警" 
                  value={stats.pendingAlerts} 
                  prefix={<AlertTriangle />}
                  valueStyle={{ color: stats.pendingAlerts > 0 ? '#ff4d4f' : '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="在线摄像头" 
                  value={stats.onlineCameras} 
                  suffix={`/ ${stats.totalCameras}`}
                  prefix={<Camera />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="今日通行" 
                  value={stats.todayAccess} 
                  prefix={<UserCheck />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="告警总数" 
                  value={stats.totalAlerts} 
                  prefix={<Bell />}
                />
              </Card>
            </Col>
          </Row>

          {/* Quick View */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="最新告警" extra={<Button size="small" icon={<RefreshCw size={14}/>} onClick={() => refetchAlerts()}>刷新</Button>}>
                <List
                  loading={alertsLoading}
                  dataSource={(alertsData || []).slice(0, 5)}
                  locale={{ emptyText: '暂无告警' }}
                  renderItem={(item: Alert) => (
                    <List.Item>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} className="text-orange-500" />
                          <span>{item.message}</span>
                        </div>
                        <Tag>{item.location}</Tag>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="实时通行记录">
                <List
                  loading={accessLoading}
                  dataSource={(accessData || []).slice(0, 5)}
                  locale={{ emptyText: '暂无记录' }}
                  renderItem={(item: AccessRecord) => (
                    <List.Item>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <UserCheck size={16} />
                          <span>{item.user_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-500">{item.location}</span>
                          <Tag color={item.action === '进入' ? 'green' : 'blue'}>{item.action}</Tag>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'cameras',
      label: (
        <span><Camera size={16} /> 视频监控</span>
      ),
      children: (
        <Card>
          <Table
            dataSource={camerasData}
            columns={cameraColumns}
            rowKey="id"
            loading={camerasLoading}
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'alerts',
      label: (
        <span><AlertTriangle size={16} /> 告警记录</span>
      ),
      children: (
        <Card>
          <Table
            dataSource={alertsData}
            columns={alertColumns}
            rowKey="id"
            loading={alertsLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'access',
      label: (
        <span><UserCheck size={16} /> 通行记录</span>
      ),
      children: (
        <Card>
          <Table
            dataSource={accessData}
            columns={accessColumns}
            rowKey="id"
            loading={accessLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🛡️ 安防监控中心</h1>
        <Button icon={<RefreshCw size={18} />} onClick={() => refetchAlerts()}>
          刷新
        </Button>
      </div>

      <Tabs 
        activeKey={selectedTab} 
        onChange={setSelectedTab}
        items={tabItems}
      />
    </div>
  );
};

export default SecurityMonitoringPage;
