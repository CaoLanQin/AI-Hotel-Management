import { useState } from 'react';
import { Zap, Power, Clock, Shield } from 'lucide-react';

export default function RoomControlEnergyAutoPage() {
  const [rules] = useState([
    { id: 1, name: '无人节电', description: '房间无人时自动关闭灯光和空调', enabled: true, saved: '15%' },
    { id: 2, name: '开门节电', description: '开门超过5分钟未入住时关闭空调', enabled: true, saved: '8%' },
    { id: 3, name: '夜间节能', description: '23:00-06:00 统一调整空调温度', enabled: true, saved: '12%' },
    { id: 4, name: '退房节能', description: '检测到退房后立即进入节能模式', enabled: false, saved: '5%' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">⚡ 节能自动化</h2>
        <p className="text-gray-500 mt-1">自动节能策略配置与效果监控</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Zap className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">本月节省</p><p className="text-2xl font-bold text-green-600">18.5%</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Power className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">节能规则</p><p className="text-2xl font-bold">{rules.filter(r => r.enabled).length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Clock className="text-orange-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">运行时长</p><p className="text-2xl font-bold">720h</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Shield className="text-purple-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">拦截次数</p><p className="text-2xl font-bold">1,234</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">规则名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">描述</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">节能效果</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{rule.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{rule.description}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{rule.saved}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {rule.enabled ? '已启用' : '已禁用'}
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
