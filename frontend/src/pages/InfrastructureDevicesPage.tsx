import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { infrastructure } from '@/lib/api';
import { 
  Server, 
  Wifi, 
  Gauge, 
  Activity, 
  Power,
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit,
  Search,
  Filter
} from 'lucide-react';

const deviceTypeNames: Record<string, string> = {
  edge_server: '边缘服务器',
  switch: '交换机',
  ap: '无线AP',
  sensor: '传感器',
  meter: '电表',
  router: '路由器',
  gateway: '网关',
};

const deviceTypeIcons: Record<string, any> = {
  edge_server: Server,
  switch: Activity,
  ap: Wifi,
  sensor: Gauge,
  meter: Power,
};

export default function InfrastructureDevicesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);

  // 获取设备列表
  const { data: devices, isLoading, refetch } = useQuery({
    queryKey: ['infrastructure-devices', typeFilter, statusFilter, searchTerm],
    queryFn: () => infrastructure.getDevices({ 
      device_type: typeFilter || undefined, 
      status: statusFilter || undefined,
      search: searchTerm || undefined
    }),
  });

  // 删除设备
  const deleteMutation = useMutation({
    mutationFn: (id: number) => infrastructure.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure-devices'] });
    },
  });

  // 重启设备
  const restartMutation = useMutation({
    mutationFn: (id: number) => infrastructure.restartDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure-devices'] });
    },
  });

  const getDeviceIcon = (type: string) => {
    const Icon = deviceTypeIcons[type] || Server;
    return Icon;
  };

  const handleDelete = (id: number) => {
    if (confirm('确定要删除这个设备吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleRestart = (id: number) => {
    if (confirm('确定要重启这个设备吗？')) {
      restartMutation.mutate(id);
    }
  };

  // 统计数据
  const stats = {
    total: devices?.length || 0,
    online: devices?.filter((d: any) => d.status === 'online').length || 0,
    offline: devices?.filter((d: any) => d.status === 'offline').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔧 设备配置管理</h2>
          <p className="text-gray-500 mt-1">基础设施设备的配置与监控</p>
        </div>
        <button
          onClick={() => { setEditingDevice(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          添加设备
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">设备总数</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">在线设备</p>
              <p className="text-2xl font-bold text-green-600">{stats.online}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Power className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">离线设备</p>
              <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Gauge className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">在线率</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选条件 */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索设备名称或位置..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部类型</option>
            <option value="edge_server">边缘服务器</option>
            <option value="switch">交换机</option>
            <option value="ap">无线AP</option>
            <option value="sensor">传感器</option>
            <option value="meter">电表</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部状态</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
          </select>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={20} />
            刷新
          </button>
        </div>
      </div>

      {/* 设备列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">设备名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">位置</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">IP地址</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">MAC地址</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : devices?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    暂无设备数据
                  </td>
                </tr>
              ) : (
                devices?.map((device: any) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = getDeviceIcon(device.device_type);
                          return <Icon className="text-gray-400" size={20} />;
                        })()}
                        <span className="font-medium">{device.device_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {deviceTypeNames[device.device_type] || device.device_type}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{device.location || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{device.ip_address || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{device.mac_address || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        device.status === 'online' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {device.status === 'online' ? '🟢 在线' : '🔴 离线'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestart(device.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="重启"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          onClick={() => { setEditingDevice(device); setShowModal(true); }}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                          title="编辑"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(device.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="删除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 添加/编辑设备弹窗 */}
      {showModal && (
        <DeviceModal
          device={editingDevice}
          onClose={() => { setShowModal(false); setEditingDevice(null); }}
          onSuccess={() => { 
            setShowModal(false); 
            setEditingDevice(null);
            queryClient.invalidateQueries({ queryKey: ['infrastructure-devices'] });
          }}
        />
      )}
    </div>
  );
}

// 设备弹窗组件
function DeviceModal({ device, onClose, onSuccess }: { device?: any; onClose: () => void; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    device_name: device?.device_name || '',
    device_type: device?.device_type || 'edge_server',
    location: device?.location || '',
    ip_address: device?.ip_address || '',
    mac_address: device?.mac_address || '',
  });

  const isEditing = !!device;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await infrastructure.updateDevice(device.id, formData);
      } else {
        await infrastructure.createDevice(formData);
      }
      onSuccess();
    } catch (error) {
      alert('操作失败');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? '编辑设备' : '添加设备'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备名称</label>
            <input
              type="text"
              required
              value={formData.device_name}
              onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备类型</label>
            <select
              value={formData.device_type}
              onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="edge_server">边缘服务器</option>
              <option value="switch">交换机</option>
              <option value="ap">无线AP</option>
              <option value="sensor">传感器</option>
              <option value="meter">电表</option>
              <option value="router">路由器</option>
              <option value="gateway">网关</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IP地址</label>
            <input
              type="text"
              value={formData.ip_address}
              onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MAC地址</label>
            <input
              type="text"
              value={formData.mac_address}
              onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {isEditing ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
