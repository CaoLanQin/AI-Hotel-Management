import { useState } from 'react';
import { Brain, User, Thermometer, Lightbulb } from 'lucide-react';

export default function RoomControlPreferencesPage() {
  const [preferences] = useState([
    { room: '101', guest: '张先生', temp: 24, light: 80, wakeup: '7:00', stayCount: 5 },
    { room: '102', guest: '李女士', temp: 22, light: 60, wakeup: '6:30', stayCount: 3 },
    { room: '105', guest: '王先生', temp: 26, light: 100, wakeup: '8:00', stayCount: 8 },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">🧠 客人偏好学习</h2>
        <p className="text-gray-500 mt-1">AI学习客人习惯，自动调整客房环境</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><User className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">学习 guests</p><p className="text-2xl font-bold">{preferences.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Thermometer className="text-orange-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">平均温度</p><p className="text-2xl font-bold">24°C</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Lightbulb className="text-yellow-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">学习准确率</p><p className="text-2xl font-bold">92%</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">房间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">客人</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">偏好温度</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">灯光亮度</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">起床时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">入住次数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {preferences.map((pref) => (
                <tr key={pref.room} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{pref.room}</td>
                  <td className="px-4 py-3 text-gray-600">{pref.guest}</td>
                  <td className="px-4 py-3 text-gray-600">{pref.temp}°C</td>
                  <td className="px-4 py-3 text-gray-600">{pref.light}%</td>
                  <td className="px-4 py-3 text-gray-600">{pref.wakeup}</td>
                  <td className="px-4 py-3 text-gray-600">{pref.stayCount} 次</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
