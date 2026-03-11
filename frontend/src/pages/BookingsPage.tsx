import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookings, guests, roomTypes, rooms } from '@/lib/api';
import { Plus, Search, Check, X, Eye } from 'lucide-react';
import dayjs from 'dayjs';

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已确认', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800' },
  checked_in: { label: '已入住', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-purple-100 text-purple-800' },
};

const BookingsPage = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [guestData, setGuestData] = useState<any>(null);

  const { data: bookingList, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookings.getAll(),
  });

  const { data: types } = useQuery({
    queryKey: ['room-types'],
    queryFn: roomTypes.getAll,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => bookings.confirm(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => bookings.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const searchGuest = async () => {
    if (!searchPhone) return;
    try {
      const data = await guests.searchByPhone(searchPhone);
      setGuestData(data);
    } catch {
      setGuestData(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">📅 预订管理</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          新增预订
        </button>
      </div>

      {/* 预订列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">预订编号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客人姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">房型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">入住日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">晚数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookingList?.map((booking: any) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm">{booking.booking_no}</td>
                <td className="px-6 py-4">{booking.guest?.name || '-'}</td>
                <td className="px-6 py-4">{booking.room_type?.name || '-'}</td>
                <td className="px-6 py-4">
                  {dayjs(booking.check_in_date).format('MM-DD')} ~ {dayjs(booking.check_out_date).format('MM-DD')}
                </td>
                <td className="px-6 py-4">{booking.nights}晚</td>
                <td className="px-6 py-4">¥{booking.total_amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusMap[booking.status]?.color || 'bg-gray-100'}`}>
                    {statusMap[booking.status]?.label || booking.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => confirmMutation.mutate(booking.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="确认"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => cancelMutation.mutate(booking.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="取消"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                    <button className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="查看">
                      <Eye size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingsPage;
