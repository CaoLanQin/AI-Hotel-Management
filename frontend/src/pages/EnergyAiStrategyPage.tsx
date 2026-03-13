import { useState } from 'react';
import { Brain, TrendingUp, Target, Clock } from 'lucide-react';

export default function EnergyAiStrategyPage() {
  const [strategies] = useState([
    { id: 1, name: '智能温控', description: '根据室外温度和入住率自动调节', effect: '+5%', accuracy: '95%' },
    { id: 2, name: '用电预测', description: '预测次日用电量，优化供电', effect: '+8%', accuracy: '88%' },
    { id: 3, name: '峰谷调度', description: '在低谷时段运行大功率设备', effect: '+12%', accuracy: '92%' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">🤖 AI节能策略</h2>
        <p className="text-gray-500 mt-1">AI驱动的智能节能优化</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Brain className="text-purple-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">AI策略数</p><p className="text-2xl font-bold">{strategies.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">平均节能</p><p className="text-2xl font-bold text-green-600">8.3%</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Target className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">预测准确率</p><p className="text-2xl font-bold">91.7%</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Clock className="text-orange-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">运行时长</p><p className="text-2xl font-bold">30天</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">策略名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">描述</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">节能效果</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">预测准确率</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {strategies.map((strategy) => (
                <tr key={strategy.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{strategy.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{strategy.description}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{strategy.effect}</td>
                  <td className="px-4 py-3 text-gray-600">{strategy.accuracy}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">运行中</span>
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
