import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkIn, guests, rooms as roomsApi, bookings as bookingsApi } from '@/lib/api';
import { Plus, Search, UserCheck, UserX, Clock } from 'lucide-react';
import dayjs from 'dayjs';

const CheckInPage = () => {
  const queryClient = useQueryClient();
  const [searchPhone, setSearchPhone] = useState('');
  const [guestData, setGuestData] = useState<any>(null);
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  // 获取当前在店客人
  const { data: checkInList, isLoading } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => checkIn.getAll(),
  });

  // 获取可用的房间列表
  const { data: availableRooms } = useQuery({
    queryKey: ['available-rooms'],
    queryFn: () => roomsApi.getAvailable(),
  });

  // 搜索客人
  const searchGuest = async () => {
    if (!searchPhone) return;
    try {
      const data = await guests.searchByPhone(searchPhone);
      setGuestData(data);
    } catch {
      setGuestData(null);
    }
  };

  // 快速入住
  const checkInMutation = useMutation({
    mutationFn: async (data: any) => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      
      return checkIn.create({
        ...data,
        check_in_time: now.toISOString(),
        check_out_time: tomorrow.toISOString(),
        room_rate: data.room_rate || selectedRoom?.room_type?.base_price || 300,
        deposit: 0,
        pay_method: 'cash',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowQuickCheckIn(false);
      setGuestData(null);
      setSearchPhone('');
      setSelectedRoom(null);
    },
  });

  // 退房
  const checkOutMutation = useMutation({
    mutationFn: (id: number) => checkIn.checkOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">🏨 入住管理</h2>
        <button
          onClick={() => setShowQuickCheckIn(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          快速入住
        </button>
      </div>

      {/* 快速入住弹窗 */}
      {showQuickCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">快速入住</h3>
            
            {/* 手机号搜索 */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="输入客人手机号"
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                onClick={searchGuest}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Search size={20} />
              </button>
            </div>

            {/* 搜索到的客人信息 */}
            {guestData && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <p className="font-medium">{guestData.name}</p>
                <p className="text-sm text-gray-600">手机: {guestData.phone}</p>
                <p className="text-sm text-gray-600">VIP等级: {guestData.vip_level}</p>
              </div>
            )}

            {/* 房间选择 */}
            {guestData && (
              <>
                <p className="text-sm font-medium mb-2">选择房间:</p>
                <div className="grid grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
                  {availableRooms?.map((room: any) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-2 border rounded-lg text-left ${
                        selectedRoom?.id === room.id ? 'border-primary-500 bg-primary-50' : ''
                      }`}
                    >
                      <p className="font-medium">{room.number}</p>
                      <p className="text-xs text-gray-500">{room.room_type?.name}</p>
                      <p className="text-xs text-primary-600">¥{room.room_type?.base_price}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* 确认入住按钮 */}
            {guestData && selectedRoom && (
              <button
                onClick={() => checkInMutation.mutate({
                  guest_id: guestData.id,
                  room_id: selectedRoom.id,
                })}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700"
              >
                确认入住 - {selectedRoom.number}
              </button>
            )}

            <button
              onClick={() => {
                setShowQuickCheckIn(false);
                setGuestData(null);
                setSearchPhone('');
              }}
              className="mt-4 w-full text-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 当前在店客人列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <UserCheck size={20} className="text-green-600" />
            当前在店客人
          </h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">入住编号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客人</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">房间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">入住时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">预计退房</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {checkInList?.filter((c: any) => c.status === 'checked_in').map((checkInData: any) => (
              <tr key={checkInData.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm">{checkInData.check_in_no}</td>
                <td className="px-6 py-4">{checkInData.guest?.name}</td>
                <td className="px-6 py-4">{checkInData.room?.number}</td>
                <td className="px-6 py-4">
                  {checkInData.actual_check_in_time ? dayjs(checkInData.actual_check_in_time).format('MM-DD HH:mm') : '-'}
                </td>
                <td className="px-6 py-4">
                  {dayjs(checkInData.check_out_time).format('MM-DD HH:mm')}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => checkOutMutation.mutate(checkInData.id)}
                    className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-1 rounded"
                  >
                    <UserX size={16} />
                    退房
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

export default CheckInPage;
