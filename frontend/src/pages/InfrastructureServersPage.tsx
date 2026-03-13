import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { infrastructure } from '@/lib/api';
import { Server, Cpu, HardDrive, Wifi, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

export default function InfrastructureServersPage() {
  const [selectedServer, setSelectedServer] = useState<number | null>(null);

  const { data: servers, isLoading, refetch } = useQuery({
    queryKey: ['infrastructure-servers'],
    queryFn: infrastructure.getServers,
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}天 ${hours}小时`;
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB/s';
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'text-green-600' : 'text-red-600';
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
          <h2 className="text-2xl font-bold text-gray-800">🖥️ 边缘服务器监控</h2>
          <p className="text-gray-500 mt-1">边缘计算节点实时监控与运维</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <RefreshCw size={20} />
          刷新
        </button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">服务器总数</p>
              <p className="text-2xl font-bold">{servers?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Cpu className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">平均CPU</p>
              <p className="text-2xl font-bold">{servers ? (servers.reduce((a: any, b: any) => a + b.cpu_usage, 0) / servers.length).toFixed(1) : 0}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HardDrive className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">平均内存</p>
              <p className="text-2xl font-bold">{servers ? (servers.reduce((a: any, b: any) => a + b.memory_usage, 0) / servers.length).toFixed(1) : 0}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">运行时长</p>
              <p className="text-2xl font-bold">{servers ? formatUptime(servers[0]?.uptime || 0) : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 服务器列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">服务器名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">IP地址</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">CPU使用率</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">内存使用</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">磁盘使用</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">网络流量</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : (
                servers?.map((server: any) => (
                  <tr key={server.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Server className="text-gray-400" size={20} />
                        <span className="font-medium">{server.server_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{server.ip_address}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${server.cpu_usage >= 80 ? 'bg-red-500' : server.cpu_usage >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${server.cpu_usage}%` }}
                          />
                        </div>
                        <span className={getUsageColor(server.cpu_usage)}>{server.cpu_usage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getUsageColor(server.memory_usage)}>{server.memory_usage}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getUsageColor(server.disk_usage)}>{server.disk_usage}%</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>↑ {formatBytes(server.network_out)}</div>
                      <div>↓ {formatBytes(server.network_in)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        server.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {server.status === 'online' ? '🟢 在线' : '🔴 离线'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
