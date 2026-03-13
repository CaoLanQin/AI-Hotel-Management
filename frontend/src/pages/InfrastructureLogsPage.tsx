import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { infrastructure } from '@/lib/api';
import { FileText, Search, Download, Filter } from 'lucide-react';

export default function InfrastructureLogsPage() {
  const [filters, setFilters] = useState({ user: '', module: '', action: '' });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['infrastructure-logs', filters],
    queryFn: () => infrastructure.getLogs(filters),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📋 日志审计</h2>
          <p className="text-gray-500 mt-1">操作日志查询与导出</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Download size={20} /> 导出日志
        </button>
      </div>

      {/* 筛选 */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <input
              type="text"
              placeholder="搜索用户..."
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filters.module}
            onChange={(e) => setFilters({ ...filters, module: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">全部模块</option>
            <option value="系统">系统</option>
            <option value="设备管理">设备管理</option>
            <option value="采购管理">采购管理</option>
            <option value="客房管理">客房管理</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Search size={20} /> 查询
          </button>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">模块</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">详情</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">IP地址</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
              ) : logs?.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">暂无日志</td></tr>
              ) : (
                logs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{log.create_time}</td>
                    <td className="px-4 py-3 font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-gray-600">{log.user}</td>
                    <td className="px-4 py-3 text-gray-600">{log.module}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">{log.detail}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{log.ip_address}</td>
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
