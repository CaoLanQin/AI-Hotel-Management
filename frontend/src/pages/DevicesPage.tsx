import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devices, rooms } from '@/lib/api';
import { Power, Fan, Tv, Lightbulb, Blinds, Thermometer, RefreshCw } from 'lucide-react';

const deviceIcons: Record<string, any> = {
  light: Lightbulb,
  curtain: Blinds,
  ac: Thermometer,
  tv: Tv,
  fan: Fan,
};

const DevicesPage = () => {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [roomDevices, setRoomDevices] = useState<any>(null);

  // 获取房间列表
  const { data: roomList } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => rooms.getAll(),
  });

  // 获取房间设备
  const { data: deviceData, isLoading, refetch } = useQuery({
    queryKey: ['room-devices', selectedRoom],
    queryFn: () => selectedRoom ? devices.getByRoom(selectedRoom) : null,
    enabled: !!selectedRoom,
  });

  // 控制设备
  const controlMutation = useMutation({
    mutationFn: ({ deviceId, action }: { deviceId: number; action: string }) =>
      devices.control(deviceId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-devices', selectedRoom] });
    },
  });

  const handleControl = (deviceId: number, action: string) => {
    controlMutation.mutate({ deviceId, action });
  };

  const getDeviceIcon = (type: string) => {
    const Icon = deviceIcons[type] || Power;
    return Icon;
  };

  const getDeviceTypeName = (type: string) => {
    const names: Record<string, string> = {
      light: '💡 照明',
      curtain: '🪟 窗帘',
      ac: '❄️ 空调',
      tv: '📺 电视',
      fan: '🌀 风扇',
    };
    return names[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">🔌 设备控制</h2>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <RefreshCw size={20} />
          刷新状态
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 房间列表 */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-4">选择房间</h3>
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {roomList?.map((room: any) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedRoom === room.id
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{room.number}</span>
                <span className="text-sm text-gray-500 ml-2">{room.room_type?.name}</span>
                {room.status === 'occupied' && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">已入住</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 设备控制面板 */}
        <div className="lg:col-span-3">
          {!selectedRoom ? (
            <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-500">
              请选择一个房间
            </div>
          ) : isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border p-10 text-center">
              加载中...
            </div>
          ) : (
            <div className="space-y-6">
              {/* 房间信息 */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold">
                  {deviceData?.room_number} - 设备控制
                </h3>
              </div>

              {/* 设备列表 */}
              {deviceData?.devices && Object.keys(deviceData.devices).length > 0 ? (
                Object.entries(deviceData.devices).map(([type, typeDevices]: [string, any]) => (
                  <div key={type} className="bg-white rounded-xl shadow-sm border p-4">
                    <h4 className="font-semibold mb-4">
                      {getDeviceTypeName(type)}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {typeDevices.map((device: any) => {
                        const Icon = getDeviceIcon(type);
                        const isOn = device.state?.power === 'on';
                        
                        return (
                          <div
                            key={device.id}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isOn
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <Icon
                                size={32}
                                className={isOn ? 'text-primary-600' : 'text-gray-400'}
                              />
                              <span className={`text-xs px-2 py-1 rounded ${
                                device.status === 'online'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {device.status === 'online' ? '在线' : '离线'}
                              </span>
                            </div>
                            <p className="font-medium text-sm mb-3">{device.device_name}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleControl(device.id, isOn ? 'off' : 'on')}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg transition-colors ${
                                  isOn
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                <Power size={16} />
                                {isOn ? '关闭' : '打开'}
                              </button>
                            </div>
                            {type === 'ac' && isOn && device.state?.temperature && (
                              <p className="text-xs text-center mt-2 text-gray-500">
                                {device.state.temperature}°C
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-500">
                  该房间暂无设备
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevicesPage;
