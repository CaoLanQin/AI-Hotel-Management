import { useState } from 'react';
import { Users, Shield, UserPlus, Search } from 'lucide-react';

export default function InfrastructureUsersPage() {
  const [users] = useState([
    { id: 1, username: 'admin', full_name: '系统管理员', role: 'admin', status: 'active', last_login: '2024-02-06 10:30' },
    { id: 2, username: 'manager', full_name: '店经理', role: 'manager', status: 'active', last_login: '2024-02-06 09:15' },
    { id: 3, username: 'staff01', full_name: '前台小李', role: 'staff', status: 'active', last_login: '2024-02-06 08:45' },
    { id: 4, username: 'staff02', full_name: '客房小王', role: 'staff', status: 'inactive', last_login: '2024-02-05 18:30' },
  ]);

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { bg: 'bg-red-100', text: 'text-red-800', label: '管理员' },
      manager: { bg: 'bg-blue-100', text: 'text-blue-800', label: '经理' },
      staff: { bg: 'bg-green-100', text: 'text-green-800', label: '员工' },
    };
    const c = config[role as keyof typeof config] || config.staff;
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">👥 用户与权限</h2>
          <p className="text-gray-500 mt-1">角色管理与权限配置</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          <UserPlus size={20} /> 添加用户
        </button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Users className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">用户总数</p><p className="text-2xl font-bold">{users.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Shield className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">管理员</p><p className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg"><Users className="text-gray-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">在职员工</p><p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</p></div>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">姓名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">角色</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">最后登录</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.username}</td>
                  <td className="px-4 py-3 text-gray-600">{user.full_name}</td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status === 'active' ? '在职' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{user.last_login}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
