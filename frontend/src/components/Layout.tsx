import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { 
  LayoutDashboard, 
  DoorOpen, 
  CalendarDays, 
  UserCheck, 
  Settings,
  LogOut,
  ShoppingCart,
  Package,
  Truck,
  AlertTriangle,
  FileText,
  Store,
  Home,
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// 采购管理子菜单配置
const procurementMenuItems = [
  { path: '/procurement/products', label: '商品浏览', icon: Store },
  { path: '/procurement/cart', label: '购物车', icon: ShoppingCart },
  { path: '/procurement/orders', label: '订单跟踪', icon: FileText },
  { path: '/procurement/stock-in', label: '入库管理', icon: Truck },
  { path: '/procurement/stock-out', label: '出库管理', icon: Package },
  { path: '/procurement/inventory', label: '库存预警', icon: AlertTriangle },
];

// 主菜单配置
const menuItems = [
  { path: '/', label: '运营驾驶舱', icon: LayoutDashboard },
  { path: '/rooms', label: '房间管理', icon: DoorOpen },
  { path: '/bookings', label: '预订管理', icon: CalendarDays },
  { path: '/checkin', label: '入住管理', icon: UserCheck },
  { path: '/upgrade', label: '升级降级', icon: FileText },
  { path: '/devices', label: '设备控制', icon: Settings },
  { path: '/room-control', label: '客房智控', icon: Home },
  { path: '/device-topology', label: '设备拓扑', icon: Settings },
  { path: '/scenes', label: '场景管理', icon: Home },
  { path: '/security', label: '安防监控', icon: AlertTriangle },
  { path: '/maintenance', label: '维修管理', icon: Settings },
  { path: '/rules', label: '规则引擎', icon: Zap },
  { path: '/energy', label: '能耗管理', icon: Zap },
];

// 可控的采购管理模块配置（设为 null 则隐藏整个模块）
const procurementConfig = {
  enabled: true,  // 是否显示采购管理模块
  label: '采购管理',
  defaultExpanded: false,  // 默认是否展开子菜单
  items: procurementMenuItems
};

const Layout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // 采购管理子菜单展开状态
  const [procurementExpanded, setProcurementExpanded] = useState(procurementConfig.defaultExpanded);
  
  // 判断当前是否在采购模块下
  const isProcurementModule = location.pathname.startsWith('/procurement');
  
  // 自动展开采购菜单（当进入采购模块时）
  const isInProcurement = location.pathname.startsWith('/procurement');
  const displayProcurementExpanded = procurementExpanded || (procurementConfig.enabled && isInProcurement);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🏨 酒店边端管理系统</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              欢迎，{user?.full_name || user?.username}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
            >
              <LogOut size={16} />
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-56 bg-white border-r min-h-[calc(100vh-64px)]">
          <nav className="p-4">
            {/* 主菜单 */}
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* 采购模块菜单 */}
            {procurementConfig.enabled && (
              <div className="mt-4 pt-4 border-t">
                <div 
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600"
                  onClick={() => setProcurementExpanded(!procurementExpanded)}
                >
                  {procurementExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {procurementConfig.label}
                </div>
                {displayProcurementExpanded && procurementConfig.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mb-0.5 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
