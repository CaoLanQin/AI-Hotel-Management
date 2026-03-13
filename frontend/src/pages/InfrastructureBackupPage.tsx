import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { infrastructure } from '@/lib/api';
import { Database, Download, Upload, RefreshCw, Plus, Clock, CheckCircle } from 'lucide-react';

export default function InfrastructureBackupPage() {
  const queryClient = useQueryClient();
  const [backupType, setBackupType] = useState('full');

  const { data: backups, isLoading, refetch } = useQuery({
    queryKey: ['infrastructure-backups'],
    queryFn: infrastructure.getBackups,
  });

  const createBackupMutation = useMutation({
    mutationFn: () => infrastructure.createBackup(backupType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure-backups'] });
    },
  });

  const stats = {
    total: backups?.length || 0,
    totalSize: backups?.reduce((a: any, b: any) => a + parseFloat(b.size), 0) || 0,
    lastBackup: backups?.[0]?.create_time || '-',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">💾 数据备份与恢复</h2>
          <p className="text-gray-500 mt-1">备份策略配置与数据恢复</p>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Database className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">备份总数</p><p className="text-2xl font-bold">{stats.total}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Database className="text-purple-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">总大小</p><p className="text-2xl font-bold">{stats.totalSize.toFixed(1)}GB</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Clock className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">最近备份</p><p className="text-2xl font-bold text-sm">{stats.lastBackup.slice(0, 10)}</p></div>
          </div>
        </div>
      </div>

      {/* 创建备份 */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">创建新备份</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={backupType}
            onChange={(e) => setBackupType(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="full">全量备份</option>
            <option value="incremental">增量备份</option>
          </select>
          <button
            onClick={() => createBackupMutation.mutate()}
            disabled={createBackupMutation.isPending}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {createBackupMutation.isPending ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
            开始备份
          </button>
        </div>
      </div>

      {/* 备份列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">备份名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">大小</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">创建时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
              ) : backups?.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">暂无备份</td></tr>
              ) : (
                backups?.map((backup: any) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{backup.backup_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        backup.backup_type === 'full' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.backup_type === 'full' ? '全量' : '增量'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{backup.size}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        backup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {backup.status === 'completed' ? <CheckCircle size={12} /> : <RefreshCw size={12} className="animate-spin" />}
                        {backup.status === 'completed' ? '已完成' : '进行中'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{backup.create_time}</td>
                    <td className="px-4 py-3">
                      <button className="text-blue-600 hover:text-blue-800 text-sm mr-3">
                        <Download size={16} />
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        <Upload size={16} />
                      </button>
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
