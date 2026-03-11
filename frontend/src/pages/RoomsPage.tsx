import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rooms, roomTypes } from '@/lib/api';
import { Plus, Search, Edit, RefreshCw } from 'lucide-react';

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-red-100 text-red-800',
  cleaning: 'bg-yellow-100 text-yellow-800',
};

const RoomsPage = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const { data: roomList, isLoading } = useQuery({
    queryKey: ['rooms', filterStatus],
    queryFn: () => rooms.getAll(filterStatus ? { status: filterStatus } : undefined),
  });

  const { data: types } = useQuery({
    queryKey: ['room-types'],
    queryFn: roomTypes.getAll,
  });

  if (isLoading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">🏠 房间管理</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          添加房间
        </button>
      </div>

      {/* 筛选 */}
      <div className="flex gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">全部状态</option>
          <option value="available">可用</option>
          <option value="occupied">已入住</option>
          <option value="maintenance">维修中</option>
          <option value="cleaning">清洁中</option>
        </select>
      </div>

      {/* 房间列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">房号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">楼层</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">房型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roomList?.map((room: any) => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{room.number}</td>
                <td className="px-6 py-4">{room.floor}楼</td>
                <td className="px-6 py-4">{room.room_type?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[room.status] || 'bg-gray-100'}`}>
                    {room.status === 'available' ? '可用' : 
                     room.status === 'occupied' ? '已入住' :
                     room.status === 'maintenance' ? '维修中' : '清洁中'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-primary-600 hover:text-primary-800 mr-3">
                    <Edit size={18} />
                  </button>
                  <button className="text-gray-600 hover:text-gray-800">
                    <RefreshCw size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomsPage;
