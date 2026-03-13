import { useState } from 'react';
import { Network, Download, Upload, Signal, Clock, RefreshCw } from 'lucide-react';

export default function InfrastructureNetworkPage() {
  const [timeRange, setTimeRange] = useState('24h');

  // 模拟网络数据
  const networkData = {
    latency: 12,
    jitter: 2,
    packetLoss: 0.1,
    bandwidth: { up: 45.2, down: 128.5 },
    quality: 98,
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'text-green-600';
    if (quality >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🌐 网络质量监控</h2>
          <p className="text-gray-500 mt-1">网络延迟、带宽、丢包率监控</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="1h">最近1小时</option>
            <option value="24h">最近24小时</option>
            <option value="7d">最近7天</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <RefreshCw size={20} /> 刷新
          </button>
        </div>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Signal className="text-blue-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">网络质量</p>
              <p className={`text-2xl font-bold ${getQualityColor(networkData.quality)}`}>{networkData.quality}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Clock className="text-purple-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">平均延迟</p>
              <p className="text-2xl font-bold">{networkData.latency} ms</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Download className="text-green-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">下行带宽</p>
              <p className="text-2xl font-bold">{networkData.bandwidth.down} Mbps</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Upload className="text-orange-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">上行带宽</p>
              <p className="text-2xl font-bold">{networkData.bandwidth.up} Mbps</p>
            </div>
          </div>
        </div>
      </div>

      {/* 网络详情 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-4">网络状态详情</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">延迟抖动</span>
              <span className="font-medium">{networkData.jitter} ms</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">丢包率</span>
              <span className="font-medium">{networkData.packetLoss}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">DNS解析</span>
              <span className="font-medium text-green-600">正常</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">连接状态</span>
              <span className="font-medium text-green-600">已连接</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-4">最近告警</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-600">网络状态正常，无告警</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
