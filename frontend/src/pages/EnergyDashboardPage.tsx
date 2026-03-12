import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, DatePicker } from 'antd';
import ReactECharts from 'echarts-for-react';
import { 
  Zap,
  Gauge,
  AlertTriangle,
  TrendingDown,
  Home
} from 'lucide-react';
import api from '../lib/api';

const { RangePicker } = DatePicker;

const EnergyDashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({
    total_consumption: 1250,
    today_consumption: 85,
    cost: 1560,
    avg_daily: 42,
  });

  // 能耗趋势图配置
  const getTrendChartOption = () => ({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
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
        data: [12, 15, 18, 25, 22, 18, 15],
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(102, 126, 234, 0.2)' },
        lineStyle: { color: '#667eea', width: 2 },
        itemStyle: { color: '#667eea' }
      }
    ],
    grid: { left: 40, right: 20, top: 30, bottom: 30 }
  });

  // 能耗占比图配置
  const getPieChartOption = () => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { color: '#666' } },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: [
          { value: 45, name: '空调', itemStyle: { color: '#667eea' } },
          { value: 25, name: '照明', itemStyle: { color: '#fbbf24' } },
          { value: 15, name: '电视', itemStyle: { color: '#4ade80' } },
          { value: 15, name: '其他', itemStyle: { color: '#a78bfa' } }
        ]
      }
    ]
  });

  // 用电记录
  const records = [
    { id: 1, time: '2026-03-12 10:00', type: '用电', amount: 12.5, cost: 15.6 },
    { id: 2, time: '2026-03-12 09:00', type: '用电', amount: 15.2, cost: 19.0 },
    { id: 3, time: '2026-03-12 08:00', type: '用电', amount: 10.8, cost: 13.5 },
    { id: 4, time: '2026-03-12 07:00', type: '用电', amount: 8.5, cost: 10.6 },
  ];

  const columns = [
    { title: '时间', dataIndex: 'time', key: 'time' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '用量(kWh)', dataIndex: 'amount', key: 'amount' },
    { title: '费用(¥)', dataIndex: 'cost', key: 'cost' },
  ];

  return (
    <div className="p-6" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#fff' }}>能耗管理</h1>
      
      {/* 统计卡片 */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card>
            <Statistic 
              title="今日用电" 
              value={stats.today_consumption} 
              suffix="kWh"
              prefix={<Zap />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="本月累计" 
              value={stats.total_consumption} 
              suffix="kWh"
              prefix={<Gauge />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="本月费用" 
              value={stats.cost} 
              suffix="¥"
              prefix={<TrendingDown />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="日均用电" 
              value={stats.avg_daily} 
              suffix="kWh"
              prefix={<Home />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} className="mb-4">
        <Col span={16}>
          <Card title="能耗趋势" extra={<RangePicker />}>
            <ReactECharts option={getTrendChartOption()} style={{ height: '300px' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="能耗占比">
            <ReactECharts option={getPieChartOption()} style={{ height: '300px' }} />
          </Card>
        </Col>
      </Row>

      {/* 用电记录 */}
      <Row>
        <Col span={24}>
          <Card title="用电记录">
            <Table 
              dataSource={records} 
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EnergyDashboardPage;
