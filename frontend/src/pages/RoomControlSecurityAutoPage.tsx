import { useState } from 'react';
import { Shield, AlertTriangle, Bell, Lock } from 'lucide-react';

export default function RoomControlSecurityAutoPage() {
  const [alerts] = useState([
    { id: 1, room: '105', type: '门未关', time: '10:30', status: 'resolved' },
    { id: 2, room: '203', type: '烟雾告警', time: '09:15', status: 'resolved' },
    { id: 3, room: '301', type: '异常进入', time: '08:45', status: 'pending' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">🛡️ 安防自动化</h2>
        <p className="text-gray-500 mt-1">客房安防监控与自动告警</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Shield className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">安防规则</p><p className="text-2xl font-bold">6</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="text-red-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">今日告警</p><p className="text-2xl font-bold text-red-600">3</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Bell className="text-yellow-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">待处理</p><p className="text-2xl font-bold text-yellow-600">1</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Lock className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">门锁异常</p><p className="text-2xl font-bold">0</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold">最近告警记录</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">房间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">告警类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{alert.room}</td>
                  <td className="px-4 py-3 text-gray-600">{alert.type}</td>
                  <td className="px-4 py-3 text-gray-600">{alert.time}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${alert.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {alert.status === 'resolved' ? '已处理' : '待处理'}
                    </span>
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
