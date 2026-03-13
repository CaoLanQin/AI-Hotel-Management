import { useQuery } from '@tanstack/react-query';
import { infrastructure } from '@/lib/api';
import { Router, Cpu, HardDrive, Signal, RefreshCw, AlertTriangle } from 'lucide-react';

export default function InfrastructureGatewaysPage() {
  const { data: gateways, isLoading, refetch } = useQuery({
    queryKey: ['infrastructure-gateways'],
    queryFn: infrastructure.getGateways,
  });

  const getStatusBadge = (status: string) => {
    const config = {
      online: { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢 在线' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡 警告' },
      offline: { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴 离线' },
    };
    const c = config[status as keyof typeof config] || config.offline;
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.icon}</span>;
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 80) return 'text-red-600';
    if (usage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📟 网关管理</h2>
          <p className="text-gray-500 mt-1">物联网关监控与管理</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <RefreshCw size={20} /> 刷新
        </button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Router className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">网关总数</p><p className="text-2xl font-bold">{gateways?.length || 0}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Signal className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">在线</p><p className="text-2xl font-bold text-green-600">{gateways?.filter((g: any) => g.status === 'online').length || 0}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><AlertTriangle className="text-yellow-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">警告</p><p className="text-2xl font-bold text-yellow-600">{gateways?.filter((g: any) => g.status === 'warning').length || 0}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Cpu className="text-purple-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">接入设备</p><p className="text-2xl font-bold">{gateways?.reduce((a: any, b: any) => a + b.device_count, 0) || 0}</p></div>
          </div>
        </div>
      </div>

      {/* 网关列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-gray-500">加载中...</div>
        ) : gateways?.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">暂无网关数据</div>
        ) : (
          gateways?.map((gateway: any) => (
            <div key={gateway.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Router className="text-gray-400" size={24} />
                  <span className="font-semibold">{gateway.gateway_name}</span>
                </div>
                {getStatusBadge(gateway.status)}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">类型</span>
                  <span>{gateway.gateway_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">位置</span>
                  <span>{gateway.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IP地址</span>
                  <span className="font-mono">{gateway.ip_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">固件版本</span>
                  <span>{gateway.firmware_version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">接入设备</span>
                  <span>{gateway.device_count} 台</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">CPU使用率</span>
                    <span className={getUsageColor(gateway.cpu_usage)}>{gateway.cpu_usage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${gateway.cpu_usage >= 80 ? 'bg-red-500' : gateway.cpu_usage >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${gateway.cpu_usage}%` }}
                    />
                  </div>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">内存使用</span>
                    <span className={getUsageColor(gateway.memory_usage)}>{gateway.memory_usage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${gateway.memory_usage >= 80 ? 'bg-red-500' : gateway.memory_usage >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${gateway.memory_usage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
