import React from 'react';
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
  Zap
} from 'lucide-react';

const menuItems = [
  { path: '/', label: '运营驾驶舱', icon: LayoutDashboard },
  { path: '/rooms', label: '房间管理', icon: DoorOpen },
  { path: '/bookings', label: '预订管理', icon: CalendarDays },
  { path: '/checkin', label: '入住管理', icon: UserCheck },
  { path: '/devices', label: '设备控制', icon: Settings },
  { path: '/room-control', label: '客房智控', icon: Home },
  { path: '/energy', label: '能耗管理', icon: Zap },
];

const procurementMenuItems = [
  { path: '/procurement/products', label: '商品浏览', icon: Store },
  { path: '/procurement/cart', label: '购物车', icon: ShoppingCart },
  { path: '/procurement/orders', label: '订单跟踪', icon: FileText },
  { path: '/procurement/stock-in', label: '入库管理', icon: Truck },
  { path: '/procurement/stock-out', label: '出库管理', icon: Package },
  { path: '/procurement/inventory', label: '库存预警', icon: AlertTriangle },
];

const Layout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // 判断是否在采购模块
  const isProcurementModule = location.pathname.startsWith('/procurement');

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
            <div className="mt-4 pt-4 border-t">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                采购管理
              </div>
              {procurementMenuItems.map((item) => {
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
