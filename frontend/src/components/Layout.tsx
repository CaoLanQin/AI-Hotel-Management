import React, { useState, useEffect } from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import api, { menu } from '@/lib/api';
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
  ChevronRight,
  HardDrive,
  Cpu,
  Activity,
  Shield,
  Wifi,
  Router,
  Server,
  Network,
  Globe,
  Building,
  Users,
  Database,
  Layers,
  ToggleLeft,
  Library,
  Link,
  Brain,
  BarChart
} from 'lucide-react';

// 图标映射
const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  DoorOpen,
  CalendarDays,
  UserCheck,
  Settings,
  ShoppingCart,
  Package,
  Truck,
  AlertTriangle,
  FileText,
  Store,
  Home,
  Zap,
  HardDrive,
  Cpu,
  Activity,
  Shield,
  Wifi,
  Router,
  Server,
  Network,
  Globe,
  Building,
  Users,
  Database,
  Layers,
  ToggleLeft,
  Library,
  Link,
  Brain,
  BarChart,
};

// 菜单项类型
interface MenuItemData {
  id: number;
  name: string;
  path: string | null;
  icon: string | null;
  sort_order: number;
  parent_id: number | null;
  is_visible: boolean;
  is_expandable: boolean;
  default_expanded: boolean;
  children: MenuItemData[];
}

const Layout = () => {
  const location = useLocation();
  const { user, logout, token } = useAuth();
  
  const [menus, setMenus] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 展开菜单状态（菜单ID -> 是否展开）
  const [expandedMenus, setExpandedMenus] = useState<Record<number, boolean>>({});
  
  // 加载菜单
  useEffect(() => {
    const loadMenus = async () => {
      try {
        if (token) {
          const menuData = await menu.getMenus();
          setMenus(menuData);
          
          // 设置默认展开状态
          const initialExpanded: Record<number, boolean> = {};
          menuData.forEach((item: MenuItemData) => {
            if (item.is_expandable && item.default_expanded) {
              initialExpanded[item.id] = true;
            }
          });
          setExpandedMenus(initialExpanded);
        }
      } catch (error) {
        console.error('加载菜单失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMenus();
  }, [token]);
  
  // 切换菜单展开/折叠
  const toggleMenu = (menuId: number) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // 检查路径是否匹配或包含（用于高亮）
  const isActive = (path: string | null) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname === path + "/";
  };

  // 渲染图标
  const renderIcon = (iconName: string | null) => {
    if (!iconName || !iconMap[iconName]) return <Store size={20} />;
    const Icon = iconMap[iconName];
    return <Icon size={20} />;
  };

  // 渲染菜单项
  const renderMenuItem = (item: MenuItemData, index: number, isSubMenu: boolean = false) => {
    // 可展开的菜单（包含子菜单）
    if (item.is_expandable || (item.children && item.children.length > 0)) {
      const isExpanded = expandedMenus[item.id] ?? item.default_expanded;
      const isCurrentActive = item.children?.some(child => isActive(child.path));
      
      return (
        <div key={`${item.id}-${index}`}>
          <div 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors cursor-pointer ${
              isCurrentActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={(e) => { e.preventDefault(); toggleMenu(item.id); }}
          >
            {renderIcon(item.icon)}
            <span className={`font-medium ${isSubMenu ? 'text-xs' : 'text-sm'} flex-1`}>{item.name}</span>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          {isExpanded && item.children?.map((child, childIndex) => (
            // 如果子菜单也可展开，递归渲染
            (child.is_expandable || (child.children && child.children.length > 0)) ? (
              <div key={child.id}>
                <div 
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-0.5 text-gray-600 hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleMenu(child.id)}
                >
                  {expandedMenus[child.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="text-xs">{child.name}</span>
                </div>
                {expandedMenus[child.id] && child.children?.map((subChild: any) => (
                  <RouterLink
                    key={subChild.id}
                    to={subChild.path || '#'}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg mb-0.5 transition-colors ${
                      isActive(subChild.path)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs ml-6">{subChild.name}</span>
                  </RouterLink>
                ))}
              </div>
            ) : (
              <RouterLink
                key={child.id}
                to={child.path || '#'}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mb-0.5 transition-colors ${
                  isActive(child.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xs ml-7">{child.name}</span>
              </RouterLink>
            )
          ))}
        </div>
      );
    }
    
    // 普通菜单项（如果没有path但有children，应该是可展开的）
    if (!item.path) {
      // 如果有children，渲染为可展开的菜单
      if (item.children && item.children.length > 0) {
        const isExpanded = expandedMenus[item.id] ?? item.default_expanded;
        return (
          <div key={item.id}>
            <div 
              className="flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-gray-600 hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleMenu(item.id)}
            >
              {renderIcon(item.icon)}
              <span className="font-medium text-sm flex-1">{item.name}</span>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {isExpanded && item.children.map((subChild: any) => (
              <RouterLink
                key={subChild.id}
                to={subChild.path || '#'}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg mb-0.5 transition-colors ${
                  isActive(subChild.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className="text-xs ml-6">{subChild.name}</span>
              </RouterLink>
            ))}
          </div>
        );
      }
      return null;
    }
    
    return (
      <RouterLink
        key={item.id}
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
          isActive(item.path)
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {renderIcon(item.icon)}
        <span className={`font-medium ${isSubMenu ? 'text-xs' : 'text-sm'}`}>{item.name}</span>
      </RouterLink>
    );
  };

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
            {loading ? (
              <div className="text-center text-gray-400 py-4">加载中...</div>
            ) : (
              menus.map((item, index) => renderMenuItem(item, index))
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
