import { useQuery } from '@tanstack/react-query';
import { infrastructure } from '@/lib/api';
import { Building, Home, Layers, MapPin, RefreshCw } from 'lucide-react';

export default function InfrastructureStoreConfigPage() {
  const { data: buildings, isLoading } = useQuery({
    queryKey: ['infrastructure-buildings'],
    queryFn: infrastructure.getBuildings,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await fetch('/api/v1/rooms', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🏢 门店基础配置</h2>
          <p className="text-gray-500 mt-1">组织架构、房间档案、房型配置</p>
        </div>
      </div>

      {/* 楼栋统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Building className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">楼栋数量</p><p className="text-2xl font-bold">{buildings?.length || 0}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Home className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">房间总数</p><p className="text-2xl font-bold">{rooms?.length || 0}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Layers className="text-purple-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">楼层数量</p><p className="text-2xl font-bold">{buildings?.reduce((a: any, b: any) => a + b.floor_count, 0) || 0}</p></div>
          </div>
        </div>
      </div>

      {/* 楼栋列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold">楼栋信息</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">楼栋名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">楼栋编码</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">楼层数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">房间数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
              ) : buildings?.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">暂无数据</td></tr>
              ) : (
                buildings?.map((building: any) => (
                  <tr key={building.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{building.building_name}</td>
                    <td className="px-4 py-3 text-gray-600">{building.building_code}</td>
                    <td className="px-4 py-3 text-gray-600">{building.floor_count}</td>
                    <td className="px-4 py-3 text-gray-600">{building.room_count}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">正常</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 房间列表预览 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold">房间档案预览</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {rooms?.slice(0, 20).map((room: any) => (
              <div key={room.id} className={`p-2 rounded text-center text-sm ${
                room.status === 'available' ? 'bg-green-100 text-green-800' :
                room.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {room.number}
              </div>
            ))}
          </div>
          {rooms?.length > 20 && (
            <p className="text-center text-gray-500 text-sm mt-2">还有 {rooms.length - 20} 间房间...</p>
          )}
        </div>
      </div>
    </div>
  );
}
