import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { infrastructure } from '@/lib/api';
import { Wifi, Search, CheckCircle, XCircle, Loader, RefreshCw, Plus } from 'lucide-react';

export default function InfrastructureOnboardingPage() {
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);

  // 获取入网任务
  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['infrastructure-onboarding'],
    queryFn: () => infrastructure.getOnboardingTasks(),
  });

  // 扫描设备
  const scanMutation = useMutation({
    mutationFn: () => infrastructure.startScan(),
    onSuccess: () => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['infrastructure-onboarding'] });
    },
  });

  // 批准入网
  const approveMutation = useMutation({
    mutationFn: (taskId: number) => infrastructure.approveOnboarding(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure-onboarding'] });
    },
  });

  const getStatusBadge = (status: string) => {
    const config = {
      success: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅ 已入网' },
      running: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔄 入网中' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳ 待审批' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌ 失败' },
    };
    const c = config[status as keyof typeof config] || config.pending;
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.icon}</span>;
  };

  const stats = {
    total: tasks?.length || 0,
    success: tasks?.filter((t: any) => t.status === 'success').length || 0,
    running: tasks?.filter((t: any) => t.status === 'running').length || 0,
    pending: tasks?.filter((t: any) => t.status === 'pending').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📡 零接触入网</h2>
          <p className="text-gray-500 mt-1">设备自动发现与入网配置</p>
        </div>
        <button
          onClick={() => scanMutation.mutate()}
          disabled={isScanning}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {isScanning ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
          {isScanning ? '扫描中...' : '扫描新设备'}
        </button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Wifi className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">入网任务</p><p className="text-2xl font-bold">{stats.total}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">已入网</p><p className="text-2xl font-bold text-green-600">{stats.success}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Loader className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">入网中</p><p className="text-2xl font-bold text-blue-600">{stats.running}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><XCircle className="text-yellow-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">待审批</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></div>
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">设备名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">设备类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">MAC地址</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">信号强度</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">进度</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
              ) : tasks?.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">暂无入网任务</td></tr>
              ) : (
                tasks?.map((task: any) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{task.device_name}</td>
                    <td className="px-4 py-3 text-gray-600">{task.device_type}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{task.device_mac}</td>
                    <td className="px-4 py-3 text-gray-600">{task.signal_strength} dBm</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-sm">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(task.status)}</td>
                    <td className="px-4 py-3">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => approveMutation.mutate(task.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          批准入网
                        </button>
                      )}
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
