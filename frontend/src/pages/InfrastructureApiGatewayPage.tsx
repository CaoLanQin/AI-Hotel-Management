import { useState } from 'react';
import { Globe, Shield, Gauge, Clock, RefreshCw } from 'lucide-react';

export default function InfrastructureApiGatewayPage() {
  const [stats] = useState({
    totalRequests: 125680,
    successRate: 99.8,
    avgResponseTime: 45,
    activeRoutes: 24,
  });

  const [routes] = useState([
    { path: '/api/v1/rooms', method: 'GET', requests: 45230, avgTime: 23, status: 'active' },
    { path: '/api/v1/devices', method: 'GET', requests: 32100, avgTime: 18, status: 'active' },
    { path: '/api/v1/procurement/*', method: '*', requests: 28400, avgTime: 35, status: 'active' },
    { path: '/api/v1/auth/*', method: '*', requests: 12300, avgTime: 12, status: 'active' },
    { path: '/api/v1/menu/*', method: '*', requests: 7650, avgTime: 8, status: 'active' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🌍 本地API网关</h2>
          <p className="text-gray-500 mt-1">API路由、认证、限流管理</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <RefreshCw size={20} /> 刷新
        </button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Globe className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">总请求数</p><p className="text-2xl font-bold">{(stats.totalRequests / 1000).toFixed(1)}K</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Shield className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">成功率</p><p className="text-2xl font-bold text-green-600">{stats.successRate}%</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Gauge className="text-purple-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">平均响应</p><p className="text-2xl font-bold">{stats.avgResponseTime} ms</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Clock className="text-orange-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">活跃路由</p><p className="text-2xl font-bold">{stats.activeRoutes}</p></div>
          </div>
        </div>
      </div>

      {/* 路由列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">路由路径</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">方法</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">请求数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">平均响应</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {routes.map((route, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{route.path}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      route.method === 'GET' ? 'bg-green-100 text-green-800' :
                      route.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      route.method === '*' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>{route.method}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{route.requests.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{route.avgTime} ms</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">活跃</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
