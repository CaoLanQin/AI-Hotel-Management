import { useState } from 'react';
import { Link, Layers, Play, Pause, Edit, Trash2, Plus } from 'lucide-react';

export default function RoomControlScenesPage() {
  const [scenes] = useState([
    { id: 1, name: '入住模式', description: '客人入住时自动启用', trigger: '门卡插入', actions: ['打开灯光', '调节空调26°C', '打开窗帘'], enabled: true },
    { id: 2, name: '睡眠模式', description: '夜间休息时启用', trigger: '手动触发', actions: ['关闭所有灯光', '空调调至24°C', '关闭窗帘'], enabled: true },
    { id: 3, name: '退房模式', description: '客人退房后自动执行', trigger: '退房触发', actions: ['关闭所有设备', '空调调至节能模式'], enabled: false },
    { id: 4, name: '清洁模式', description: '客房清洁时使用', trigger: '手动触发', actions: ['打开所有灯光', '关闭空调'], enabled: true },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔗 场景联动配置</h2>
          <p className="text-gray-500 mt-1">配置客房场景与联动规则</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          <Plus size={20} /> 添加场景
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenes.map((scene) => (
          <div key={scene.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="text-blue-600" size={20} />
                <span className="font-semibold">{scene.name}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${scene.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {scene.enabled ? '已启用' : '已禁用'}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">{scene.description}</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500 mb-1">触发条件: {scene.trigger}</p>
              <p className="text-xs text-gray-500">执行动作: {scene.actions.join(' → ')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                <Play size={16} /> 测试
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                <Edit size={16} /> 编辑
              </button>
              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
