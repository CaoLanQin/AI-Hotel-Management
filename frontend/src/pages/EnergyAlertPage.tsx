import { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Thermometer,
  Moon,
  Home,
  Settings
} from 'lucide-react';

// 模拟告警数据
const mockAlerts = [
  {
    id: 'ALM_ENERGY_20260206143215001',
    type: 'SPIKE',
    typeName: '能耗突增',
    level: 'URGENT',
    levelName: '紧急',
    roomNo: '12F-1205',
    roomType: '豪华套房',
    status: 'PENDING',
    statusName: '待处理',
    alertTime: '2026-02-06 14:32:15',
    duration: 45,
    currentValue: 15.8,
    normalValue: 5.2,
    deviationRate: 204,
    rootCause: '温度设定过低导致空调持续制冷',
    suggestions: ['远程查看设备状态', '远程调节温度设定', '现场检查'],
    deviceId: 'AC-1205-01',
    deviceName: '空调控制器'
  },
  {
    id: 'ALM_ENERGY_20260206131530002',
    type: 'NIGHT',
    typeName: '夜间异常用电',
    level: 'HIGH',
    levelName: '重要',
    roomNo: '8F-0803',
    roomType: '标准大床房',
    status: 'PROCESSING',
    statusName: '处理中',
    alertTime: '2026-02-06 13:15:30',
    duration: 120,
    currentValue: 3.8,
    normalValue: 1.0,
    deviationRate: 280,
    rootCause: '客人夜间使用大功率电器',
    suggestions: ['联系客人提醒', '检查用电设备'],
    deviceId: 'PLUG-0803-01',
    deviceName: '智能插座'
  },
  {
    id: 'ALM_ENERGY_20260206082500003',
    type: 'VACANT',
    typeName: '空闲耗电',
    level: 'NORMAL',
    levelName: '一般',
    roomNo: '5F-0508',
    roomType: '标准双床房',
    status: 'RESOLVED',
    statusName: '已解决',
    alertTime: '2026-02-06 08:25:00',
    duration: 30,
    currentValue: 0.8,
    normalValue: 0.1,
    deviationRate: 700,
    rootCause: '空调未关闭',
    suggestions: ['远程关闭设备'],
    deviceId: 'AC-0508-01',
    deviceName: '空调控制器',
    handlerName: '张工',
    handleTime: '2026-02-06 08:55:00',
    handleResult: '已远程关闭空调'
  },
  {
    id: 'ALM_ENERGY_20260206021000004',
    type: 'THRESHOLD',
    typeName: '单房超标',
    level: 'HIGH',
    levelName: '重要',
    roomNo: '15F-1502',
    roomType: '豪华大床房',
    status: 'IGNORED',
    statusName: '已忽略',
    alertTime: '2026-02-06 02:10:00',
    duration: 0,
    currentValue: 28.5,
    normalValue: 20.0,
    deviationRate: 42,
    rootCause: '住客连续使用大功率电器',
    suggestions: [],
    deviceId: 'PLUG-1502-02',
    deviceName: '智能插座'
  },
  {
    id: 'ALM_ENERGY_20260205194500005',
    type: 'DEVICE',
    typeName: '设备异常',
    level: 'URGENT',
    levelName: '紧急',
    roomNo: '10F-1006',
    roomType: '商务套房',
    status: 'FALSE',
    statusName: '误报',
    alertTime: '2026-02-05 19:45:00',
    duration: 15,
    currentValue: 4.2,
    normalValue: 1.5,
    deviationRate: 180,
    rootCause: '设备校准问题',
    suggestions: ['校准设备'],
    deviceId: 'AC-1006-01',
    deviceName: '空调控制器',
    handlerName: '李工',
    handleTime: '2026-02-05 20:00:00',
    handleResult: '标记为误报，已校准设备'
  }
];

const levelColors = {
  URGENT: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  NORMAL: 'bg-blue-100 text-blue-700 border-blue-200'
};

const levelDotColors = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-yellow-500',
  NORMAL: 'bg-blue-500'
};

const typeIcons = {
  SPIKE: Zap,
  NIGHT: Moon,
  VACANT: Home,
  THRESHOLD: Thermometer,
  DEVICE: Settings
};

export default function EnergyAlertPage() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    dateRange: 'today',
    level: 'all',
    type: 'all',
    status: 'all',
    room: 'all',
    search: ''
  });

  // 统计数据
  const stats = {
    todayTotal: 12,
    pending: 3,
    resolved: 156,
    processingRate: 98.1,
    avgHandleTime: 15
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleAlertExpand = (alertId: string) => {
    setExpandedAlert(prev => prev === alertId ? null : alertId);
  };

  const handleBatchProcess = (action: string) => {
    console.log('Batch action:', action, selectedAlerts);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.level !== 'all' && alert.level !== filters.level) return false;
    if (filters.type !== 'all' && alert.type !== filters.type) return false;
    if (filters.status !== 'all' && alert.status !== filters.status) return false;
    if (filters.search && !alert.roomNo.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">能耗异常告警</h1>
          <p className="text-gray-500 text-sm mt-1">实时监测酒店能耗数据，自动识别异常模式</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <RefreshCw size={16} />
            刷新
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <Download size={16} />
            导出告警
          </button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">今日告警</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.todayTotal}</p>
            </div>
            <AlertTriangle className="text-orange-500" size={24} />
          </div>
          <p className="text-xs text-green-600 mt-2">↑2起 较昨日</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">待处理告警</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
          <p className="text-xs text-orange-600 mt-2">⚠️ 需要及时处理</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">已处理告警</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">处理率</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.processingRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold">{stats.processingRate}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">平均处理时长</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.avgHandleTime}分钟</p>
            </div>
            <Clock className="text-gray-400" size={24} />
          </div>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">时间:</span>
            <select 
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">级别:</span>
            <select 
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="all">全部</option>
              <option value="URGENT">紧急</option>
              <option value="HIGH">重要</option>
              <option value="NORMAL">一般</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">类型:</span>
            <select 
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">全部</option>
              <option value="SPIKE">能耗突增</option>
              <option value="NIGHT">夜间异常</option>
              <option value="VACANT">空闲耗电</option>
              <option value="THRESHOLD">单房超标</option>
              <option value="DEVICE">设备异常</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">状态:</span>
            <select 
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">全部</option>
              <option value="PENDING">待处理</option>
              <option value="PROCESSING">处理中</option>
              <option value="RESOLVED">已解决</option>
              <option value="IGNORED">已忽略</option>
              <option value="FALSE">误报</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">房间:</span>
            <select 
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              value={filters.room}
              onChange={(e) => handleFilterChange('room', e.target.value)}
            >
              <option value="all">全部</option>
              <option value="12F">12楼</option>
              <option value="8F">8楼</option>
              <option value="5F">5楼</option>
            </select>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="搜索房间/设备..."
                className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              筛选
            </button>
            <div className="relative group">
              <button className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm flex items-center gap-1">
                批量操作
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-10">
                <button 
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => handleBatchProcess('assign')}
                >
                  批量分派
                </button>
                <button 
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => handleBatchProcess('resolve')}
                >
                  批量标记已处理
                </button>
                <button 
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => handleBatchProcess('ignore')}
                >
                  批量忽略
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 告警列表 */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => {
          const TypeIcon = typeIcons[alert.type as keyof typeof typeIcons] || AlertTriangle;
          const isExpanded = expandedAlert === alert.id;
          
          return (
            <div 
              key={alert.id}
              className={`bg-white rounded-xl border overflow-hidden ${
                alert.status === 'PENDING' ? 'border-l-4 border-l-orange-400' : ''
              }`}
            >
              {/* 告警头部 */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleAlertExpand(alert.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${levelDotColors[alert.level as keyof typeof levelDotColors]}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${levelColors[alert.level as keyof typeof levelColors]}`}>
                          {alert.levelName}
                        </span>
                        <span className="text-sm text-gray-500">{alert.statusName}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm">
                        <span className="font-medium text-gray-800">{alert.typeName}</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-600">房间: {alert.roomNo}</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-600">房型: {alert.roomType}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        告警时间: {alert.alertTime} · 持续 {alert.duration} 分钟
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-xs text-gray-500">当前值 / 正常值</p>
                      <p className="text-sm font-medium text-orange-600">
                        {alert.currentValue} / {alert.normalValue} kWh
                      </p>
                      <p className="text-xs text-red-500">+{alert.deviationRate}%</p>
                    </div>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </div>
              </div>

              {/* 告警详情 */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-6">
                    {/* 异常详情 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-3">异常详情</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">异常设备:</span>
                          <span className="text-gray-800">{alert.deviceName} ({alert.deviceId})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">偏差率:</span>
                          <span className="text-red-600 font-medium">+{alert.deviationRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">根因分析:</span>
                          <span className="text-gray-800">{alert.rootCause}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 处理建议 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-3">处理建议</h4>
                      <div className="space-y-2">
                        {alert.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                              {idx + 1}
                            </span>
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 处理历史 */}
                  {alert.handlerName && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-800 mb-2">处理记录</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">处理人: {alert.handlerName}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-600">处理时间: {alert.handleTime}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-600">处理结果: {alert.handleResult}</span>
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="mt-4 flex gap-2">
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      远程诊断
                    </button>
                    <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                      远程调节
                    </button>
                    <button className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700">
                      联系客人
                    </button>
                    <button className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
                      生成工单
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100">
                      标记误报
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100">
                      忽略告警
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">共 {filteredAlerts.length} 条告警记录</p>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50">
            上一页
          </button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
            2
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
            3
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
