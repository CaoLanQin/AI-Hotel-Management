import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Table, Tag, DatePicker, Select, Button, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import { 
  Zap,
  Gauge,
  TrendingDown,
  Home,
  RefreshCw
} from 'lucide-react';
import api from '../lib/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface EnergyData {
  total_energy: number;
  device_breakdown: Record<string, number>;
  trend: Array<{ date: string; energy: number }>;
}

interface Alert {
  id: number;
  type: string;
  message: string;
  room_id: number;
  severity: string;
  created_at: string;
}

const EnergyDashboardPage = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(7, 'day'), dayjs()]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  // Fetch energy dashboard data
  const { data: energyData, isLoading: energyLoading, refetch: refetchEnergy } = useQuery({
    queryKey: ['energy-dashboard', dateRange],
    queryFn: async () => {
      const res = await api.get('/devices/energy/dashboard');
      return res.data as EnergyData;
    },
  });

  // Fetch energy alerts
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['energy-alerts'],
    queryFn: async () => {
      const res = await api.get('/devices/energy/alerts');
      return res.data as Alert[];
    },
  });

  // Fetch rooms for filter
  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data?.rooms || res.data || [];
    },
  });

  // Fetch room energy if selected
  const { data: roomEnergyData, isLoading: roomEnergyLoading } = useQuery({
    queryKey: ['room-energy', selectedRoom],
    queryFn: async () => {
      if (!selectedRoom) return null;
      const res = await api.get(`/devices/energy/room/${selectedRoom}`);
      return res.data;
    },
    enabled: !!selectedRoom,
  });

  // Calculate stats from real data
  const stats = {
    today_consumption: energyData?.trend?.[energyData.trend?.length - 1]?.energy || 0,
    total_consumption: energyData?.total_energy || 0,
    cost: (energyData?.total_energy || 0) * 1.2, // Assuming 1.2 RMB per kWh
    avg_daily: energyData?.trend?.length ? energyData.trend.reduce((sum, t) => sum + t.energy, 0) / energyData.trend.length : 0,
  };

  // 能耗趋势图配置
  const getTrendChartOption = () => {
    const dates = energyData?.trend?.map(t => t.date.slice(5)) || [];
    const values = energyData?.trend?.map(t => t.energy) || [];
    
    return {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: dates.length ? dates : ['暂无数据'],
        axisLine: { lineStyle: { color: '#999' } },
        axisLabel: { color: '#666' }
      },
      yAxis: {
        type: 'value',
        name: 'kWh',
        axisLine: { lineStyle: { color: '#999' } },
        axisLabel: { color: '#666' },
        splitLine: { lineStyle: { color: '#eee' } }
      },
      series: [
        {
          data: values.length ? values : [0],
          type: 'line',
          smooth: true,
          areaStyle: { color: 'rgba(102, 126, 234, 0.2)' },
          lineStyle: { color: '#667eea', width: 2 },
          itemStyle: { color: '#667eea' }
        }
      ],
      grid: { left: 40, right: 20, top: 30, bottom: 30 }
    };
  };

  // 能耗占比图配置
  const getPieChartOption = () => {
    const breakdown = energyData?.device_breakdown || {};
    
    const colors: Record<string, string> = {
      ac: '#667eea',
      light: '#fbbf24',
      tv: '#4ade80',
      curtain: '#f472b6',
      fan: '#a78bfa',
      other: '#94a3b8'
    };
    
    const deviceNames: Record<string, string> = {
      ac: '空调',
      light: '照明',
      tv: '电视',
      curtain: '窗帘',
      fan: '风扇',
      other: '其他'
    };
    
    const pieData = Object.entries(breakdown).map(([key, value]) => ({
      value: value as number,
      name: deviceNames[key] || key,
      itemStyle: { color: colors[key] || colors.other }
    }));
    
    if (pieData.length === 0) {
      pieData.push({ value: 1, name: '暂无数据', itemStyle: { color: '#e5e7eb' } });
    }
    
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} kWh ({d}%)' },
      legend: { bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { color: '#666' } },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: pieData
        }
      ]
    };
  };

  // Alert columns
  const alertColumns = [
    { 
      title: '时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (val: string) => dayjs(val).format('MM-DD HH:mm')
    },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: string) => {
        const typeNames: Record<string, string> = {
          high_consumption: '高能耗',
          anomaly: '异常',
          offline: '离线'
        };
        return <Tag color={type === 'high_consumption' ? 'orange' : 'red'}>{typeNames[type] || type}</Tag>;
      }
    },
    { title: '消息', dataIndex: 'message', key: 'message' },
  ];

  // Room energy columns
  const roomColumns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', render: (val: string) => val ? dayjs(val).format('MM-DD HH:mm') : '-' },
    { title: '设备类型', dataIndex: 'device_type', key: 'device_type' },
    { title: '能耗(kWh)', dataIndex: 'energy', key: 'energy' },
  ];

  return (
    <div className="p-6" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>⚡ 能耗管理</h1>
        <div className="flex gap-2">
          <Button icon={<RefreshCw />} onClick={() => { refetchEnergy(); refetchAlerts(); }}>
            刷新数据
          </Button>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card>
            <Spin spinning={energyLoading}>
              <Statistic 
                title="今日用电" 
                value={stats.today_consumption} 
                suffix="kWh"
                prefix={<Zap />}
                precision={1}
              />
            </Spin>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Spin spinning={energyLoading}>
              <Statistic 
                title="本月累计" 
                value={stats.total_consumption} 
                suffix="kWh"
                prefix={<Gauge />}
                precision={1}
              />
            </Spin>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Spin spinning={energyLoading}>
              <Statistic 
                title="本月费用" 
                value={stats.cost} 
                suffix="¥"
                prefix={<TrendingDown />}
                precision={2}
              />
            </Spin>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Spin spinning={energyLoading}>
              <Statistic 
                title="日均用电" 
                value={stats.avg_daily} 
                suffix="kWh"
                prefix={<Home />}
                precision={1}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} className="mb-4">
        <Col span={16}>
          <Card title="能耗趋势" extra={
            <RangePicker 
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
            />
          }>
            <ReactECharts option={getTrendChartOption()} style={{ height: '300px' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="能耗占比">
            <ReactECharts option={getPieChartOption()} style={{ height: '300px' }} />
          </Card>
        </Col>
      </Row>

      {/* Room filter and details */}
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card title="房间能耗查询">
            <Select
              style={{ width: '100%' }}
              placeholder="选择房间查看能耗"
              value={selectedRoom}
              onChange={setSelectedRoom}
              allowClear
            >
              {(roomsData || []).map((room: any) => (
                <Option key={room.id} value={room.id}>
                  {room.number} - {room.room_type?.name || '未知房型'}
                </Option>
              ))}
            </Select>
            {selectedRoom && roomEnergyData && (
              <div className="mt-4">
                <Statistic 
                  title="房间总能耗" 
                  value={roomEnergyData.total_energy || 0} 
                  suffix="kWh"
                  prefix={<Zap />}
                />
              </div>
            )}
          </Card>
        </Col>
        <Col span={16}>
          <Card title="能耗告警" extra={<Tag color="red">{alertsData?.length || 0} 条</Tag>}>
            <Spin spinning={alertsLoading}>
              <Table 
                dataSource={alertsData?.slice(0, 5) || []} 
                columns={alertColumns}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无告警' }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Room energy details */}
      {selectedRoom && (
        <Row>
          <Col span={24}>
            <Card title={`房间 ${(roomsData || []).find((r: any) => r.id === selectedRoom)?.number || ''} 能耗明细`}>
              <Spin spinning={roomEnergyLoading}>
                <Table 
                  dataSource={roomEnergyData?.records || []} 
                  columns={roomColumns}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: '暂无数据' }}
                />
              </Spin>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default EnergyDashboardPage;
