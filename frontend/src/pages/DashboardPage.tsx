import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboard } from '@/lib/api';
import { 
  Users, 
  DoorOpen, 
  AlertTriangle, 
  DollarSign,
  TrendingUp,
  BedDouble
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      </div>
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon size={24} style={{ color }} />
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboard.getStats,
    refetchInterval: 30000, // 每30秒刷新
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: dashboard.getAlerts,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">📊 运营驾驶舱</h2>
        <span className="text-sm text-gray-500">实时更新</span>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="今日入住"
          value={stats?.today_check_in || 0}
          icon={Users}
          color="#10b981"
        />
        <StatCard
          title="今日退房"
          value={stats?.today_check_out || 0}
          icon={DoorOpen}
          color="#f59e0b"
        />
        <StatCard
          title="在住房"
          value={`${stats?.occupied_rooms || 0} / ${stats?.total_rooms || 0}`}
          icon={BedDouble}
          color="#3b82f6"
        />
        <StatCard
          title="今日营收"
          value={`¥${(stats?.today_revenue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="#8b5cf6"
        />
      </div>

      {/* 房间状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">房间状态</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats?.available_rooms || 0}</p>
              <p className="text-sm text-gray-600">可预订</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats?.occupied_rooms || 0}</p>
              <p className="text-sm text-gray-600">已入住</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{stats?.maintenance_rooms || 0}</p>
              <p className="text-sm text-gray-600">维护中</p>
            </div>
          </div>
          
          {/* 入住率进度条 */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">入住率</span>
              <span className="font-medium">{stats?.occupancy_rate || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${stats?.occupancy_rate || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* 告警中心 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-500" />
            实时告警
          </h3>
          <div className="space-y-3">
            {alerts?.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无告警</p>
            ) : (
              alerts?.map((alert: any, index: number) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg ${
                    alert.level === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                  } border`}
                >
                  <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
