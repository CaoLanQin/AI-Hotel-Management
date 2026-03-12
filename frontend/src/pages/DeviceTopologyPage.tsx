import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Select, Tag, Button, Table, Statistic, Tooltip, Modal, Descriptions } from 'antd';
import { 
  Activity, AlertTriangle, CheckCircle, 
  RefreshCw, LayoutGrid, 
  Thermometer, Lightbulb, Blinds, Lock, Monitor, Power
} from 'lucide-react';
import api from '../lib/api';

const { Option } = Select;

interface Device {
  id: number;
  device_type: string;
  device_name: string;
  device_code: string;
  status: string;
  state: any;
  room_id: number;
  room?: {
    number: string;
    room_type?: {
      name: string;
    };
  };
}

interface Room {
  id: number;
  number: string;
  floor: number;
  status: string;
  room_type?: {
    id: number;
    name: string;
  };
}

const DeviceTopologyPage = () => {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get all rooms
  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data?.rooms || [];
    },
  });

  // Get all devices
  const { data: devicesData, refetch } = useQuery({
    queryKey: ['all-devices'],
    queryFn: async () => {
      const res = await api.get('/devices');
      return res.data || [];
    },
  });

  // Group rooms by floor
  const floors: number[] = [...new Set((roomsData || []).map((r: Room) => r.floor).filter(Boolean) as number[])].sort((a, b) => a - b);

  // Filter rooms by floor
  const filteredRooms = selectedFloor 
    ? (roomsData || []).filter((r: Room) => r.floor === selectedFloor)
    : roomsData || [];

  // Filter devices by room and type
  const roomDevices = (devicesData || []).filter((d: Device) => {
    if (selectedRoom && d.room_id !== selectedRoom) return false;
    if (deviceTypeFilter !== 'all' && d.device_type !== deviceTypeFilter) return false;
    return true;
  });

  // Device statistics
  const stats = {
    total: (devicesData || []).length,
    online: (devicesData || []).filter((d: Device) => d.status === 'online').length,
    offline: (devicesData || []).filter((d: Device) => d.status === 'offline').length,
    warning: (devicesData || []).filter((d: Device) => d.status === 'warning').length,
  };

  // Get device icon
  const getDeviceIcon = (type: string) => {
    const icons: Record<string, any> = {
      ac: Thermometer,
      light: Lightbulb,
      curtain: Blinds,
      lock: Lock,
      tv: Monitor,
      power: Power,
    };
    return icons[type] || Activity;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      online: 'green',
      offline: 'red',
      warning: 'orange',
    };
    return colors[status] || 'default';
  };

  // Device type counts
  const deviceTypeCounts = (devicesData || []).reduce((acc: Record<string, number>, d: Device) => {
    acc[d.device_type] = (acc[d.device_type] || 0) + 1;
    return acc;
  }, {});

  // Columns for device table
  const columns = [
    {
      title: '设备',
      key: 'device',
      render: (_: any, record: Device) => {
        const Icon = getDeviceIcon(record.device_type);
        return (
          <div className="flex items-center gap-2">
            <Icon size={18} />
            <span>{record.device_name}</span>
          </div>
        );
      },
    },
    {
      title: '设备编码',
      dataIndex: 'device_code',
      key: 'device_code',
    },
    {
      title: '类型',
      dataIndex: 'device_type',
      key: 'device_type',
      render: (type: string) => {
        const names: Record<string, string> = {
          ac: '空调',
          light: '照明',
          curtain: '窗帘',
          lock: '门锁',
          tv: '电视',
          power: '电源',
        };
        return names[type] || type;
      },
    },
    {
      title: '房间',
      key: 'room',
      render: (_: any, record: Device) => {
        const room = (roomsData || []).find((r: Room) => r.id === record.room_id);
        return room?.number || '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'online' ? '在线' : status === 'offline' ? '离线' : '告警'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Device) => (
        <Button type="link" onClick={() => {
          setSelectedDevice(record);
          setShowDetailModal(true);
        }}>
          详情
        </Button>
      ),
    },
  ];

  // Render room device grid
  const renderRoomDevices = (room: Room) => {
    const devices = (devicesData || []).filter((d: Device) => d.room_id === room.id);
    if (devices.length === 0) return null;

    return (
      <div 
        key={room.id}
        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
          selectedRoom === room.id 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedRoom(selectedRoom === room.id ? null : room.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold">{room.number}</span>
          <Tag color={room.status === 'occupied' ? 'blue' : room.status === 'available' ? 'green' : 'orange'}>
            {room.status === 'occupied' ? '已入住' : room.status === 'available' ? '空闲' : '维修'}
          </Tag>
        </div>
        <div className="flex flex-wrap gap-1">
          {devices.slice(0, 6).map((dev: Device) => {
            const Icon = getDeviceIcon(dev.device_type);
            return (
              <Tooltip key={dev.id} title={`${dev.device_name} (${dev.status})`}>
                <div className={`w-8 h-8 rounded flex items-center justify-center ${
                  dev.status === 'online' ? 'bg-green-100 text-green-600' : 
                  dev.status === 'offline' ? 'bg-red-100 text-red-600' : 
                  'bg-orange-100 text-orange-600'
                }`}>
                  <Icon size={14} />
                </div>
              </Tooltip>
            );
          })}
          {devices.length > 6 && (
            <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-xs">
              +{devices.length - 6}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🔗 客房设备拓扑</h1>
        <Button icon={<RefreshCw size={18} />} onClick={() => refetch()}>
          刷新
        </Button>
      </div>

      <Row gutter={16}>
        {/* Left Panel - Filters */}
        <Col span={5}>
          <Card title="筛选条件" size="small">
            {/* Floor Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">按楼层筛选</label>
              <Select
                style={{ width: '100%' }}
                placeholder="选择楼层"
                value={selectedFloor}
                onChange={setSelectedFloor}
                allowClear
              >
                {floors.map((floor: number) => (
                  <Option key={floor} value={floor}>
                    {floor}楼
                  </Option>
                ))}
              </Select>
            </div>

            {/* Device Type Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">按设备类型筛选</label>
              <Select
                style={{ width: '100%' }}
                placeholder="设备类型"
                value={deviceTypeFilter}
                onChange={setDeviceTypeFilter}
              >
                <Option value="all">全部设备</Option>
                <Option value="ac">空调</Option>
                <Option value="light">照明</Option>
                <Option value="curtain">窗帘</Option>
                <Option value="lock">门锁</Option>
                <Option value="tv">电视</Option>
              </Select>
            </div>

            {/* Statistics */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">设备统计</label>
              <Row gutter={8}>
                <Col span={12}>
                  <Statistic 
                    title="在线" 
                    value={stats.online} 
                    valueStyle={{ color: '#52c41a', fontSize: 20 }}
                    prefix={<CheckCircle size={14} />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="离线" 
                    value={stats.offline} 
                    valueStyle={{ color: '#ff4d4f', fontSize: 20 }}
                    prefix={<AlertTriangle size={14} />}
                  />
                </Col>
              </Row>
            </div>

            {/* Device Type Counts */}
            <div>
              <label className="block text-sm font-medium mb-2">设备类型分布</label>
              <div className="space-y-1">
                {Object.entries(deviceTypeCounts).map(([type, count]: [string, any]) => {
                  const Icon = getDeviceIcon(type);
                  const names: Record<string, string> = {
                    ac: '空调',
                    light: '照明',
                    curtain: '窗帘',
                    lock: '门锁',
                    tv: '电视',
                  };
                  return (
                    <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Icon size={14} />
                        <span>{names[type] || type}</span>
                      </div>
                      <Tag>{count}</Tag>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </Col>

        {/* Main Content - Topology Grid */}
        <Col span={14}>
          <Card 
            title={
              <div className="flex items-center gap-4">
                <span>设备拓扑图</span>
                <Tag color="blue">{selectedFloor ? `${selectedFloor}楼` : '全部楼层'}</Tag>
                <Tag>{filteredRooms.length} 个房间</Tag>
                <Tag color="purple">{roomDevices.length} 台设备</Tag>
              </div>
            }
            extra={
              <div className="flex gap-2">
                <Tooltip title="选中房间查看详情">
                  <Tag color="blue">● 在线</Tag>
                </Tooltip>
                <Tooltip title="离线设备">
                  <Tag color="red">● 离线</Tag>
                </Tooltip>
                <Tooltip title="告警设备">
                  <Tag color="orange">● 告警</Tag>
                </Tooltip>
              </div>
            }
          >
            {selectedRoom ? (
              // Show devices for selected room
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">
                    房间 {(roomsData || []).find((r: Room) => r.id === selectedRoom)?.number} 的设备
                  </h3>
                  <Button onClick={() => setSelectedRoom(null)}>返回楼视图</Button>
                </div>
                <Table
                  dataSource={roomDevices}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </div>
            ) : (
              // Show room grid
              <div className="grid grid-cols-4 gap-3">
                {filteredRooms.map((room: Room) => renderRoomDevices(room))}
              </div>
            )}
          </Card>
        </Col>

        {/* Right Panel - Device Details */}
        <Col span={5}>
          <Card title="设备详情" size="small">
            {selectedDevice ? (
              <div>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="设备名称">{selectedDevice.device_name}</Descriptions.Item>
                  <Descriptions.Item label="设备编码">{selectedDevice.device_code}</Descriptions.Item>
                  <Descriptions.Item label="设备类型">
                    {selectedDevice.device_type === 'ac' ? '空调' : 
                     selectedDevice.device_type === 'light' ? '照明' :
                     selectedDevice.device_type === 'curtain' ? '窗帘' :
                     selectedDevice.device_type}
                  </Descriptions.Item>
                  <Descriptions.Item label="在线状态">
                    <Tag color={getStatusColor(selectedDevice.status)}>
                      {selectedDevice.status === 'online' ? '在线' : 
                       selectedDevice.status === 'offline' ? '离线' : '告警'}
                    </Tag>
                  </Descriptions.Item>
                  {selectedDevice.state && (
                    <>
                      {selectedDevice.state.power && (
                        <Descriptions.Item label="电源状态">
                          {selectedDevice.state.power === 'on' ? '开启' : '关闭'}
                        </Descriptions.Item>
                      )}
                      {selectedDevice.state.temperature && (
                        <Descriptions.Item label="温度">
                          {selectedDevice.state.temperature}°C
                        </Descriptions.Item>
                      )}
                      {selectedDevice.state.brightness && (
                        <Descriptions.Item label="亮度">
                          {selectedDevice.state.brightness}%
                        </Descriptions.Item>
                      )}
                    </>
                  )}
                </Descriptions>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <LayoutGrid size={48} className="mx-auto mb-2 opacity-50" />
                <p>点击设备查看详情</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Device Detail Modal */}
      <Modal
        title="设备详细信息"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={null}
        width={600}
      >
        {selectedDevice && (
          <Descriptions column={2}>
            <Descriptions.Item label="设备名称" span={2}>
              {selectedDevice.device_name}
            </Descriptions.Item>
            <Descriptions.Item label="设备编码">{selectedDevice.device_code}</Descriptions.Item>
            <Descriptions.Item label="设备类型">
              {selectedDevice.device_type === 'ac' ? '空调' : 
               selectedDevice.device_type === 'light' ? '照明' :
               selectedDevice.device_type === 'curtain' ? '窗帘' :
               selectedDevice.device_type}
            </Descriptions.Item>
            <Descriptions.Item label="在线状态">
              <Tag color={getStatusColor(selectedDevice.status)}>
                {selectedDevice.status === 'online' ? '在线' : 
                 selectedDevice.status === 'offline' ? '离线' : '告警'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所属房间">
              {(roomsData || []).find((r: Room) => r.id === selectedDevice.room_id)?.number}
            </Descriptions.Item>
            <Descriptions.Item label="房型">
              {(roomsData || []).find((r: Room) => r.id === selectedDevice.room_id)?.room_type?.name}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default DeviceTopologyPage;
