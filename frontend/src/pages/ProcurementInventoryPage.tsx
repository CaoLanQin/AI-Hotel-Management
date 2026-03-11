import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, Package, Check } from 'lucide-react';
import { procurement } from '@/lib/api';

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  category: string;
  brand?: string;
  specification?: string;
  unit: string;
  price: number;
  stock: number;
  min_order: number;
}

interface StockAlert {
  id: number;
  alert_type: string;
  current_qty: number;
  threshold: number;
  status: string;
  product?: Product;
}

const CATEGORY_MAP: Record<string, string> = {
  housekeeping: '客房用品',
  dining: '餐饮用品',
  cleaning: '清洁用品',
  engineering: '工程物资',
  stationery: '办公用品',
  other: '其他',
};

export default function ProcurementInventoryPage() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['inventory-products', keyword, category],
    queryFn: async () => {
      return await procurement.getProducts() as Product[];
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      return await procurement.getStockAlerts() as StockAlert[];
    },
  });

  const filteredProducts = products.filter(p => {
    if (keyword && !p.product_name.toLowerCase().includes(keyword.toLowerCase()) && 
        !p.product_code.toLowerCase().includes(keyword.toLowerCase())) return false;
    if (category && p.category !== category) return false;
    return true;
  });

  const totalItems = filteredProducts.length;
  const lowStockItems = filteredProducts.filter(p => p.stock > 0 && p.stock < 10).length;
  const outOfStockItems = filteredProducts.filter(p => p.stock === 0).length;
  const totalValue = filteredProducts.reduce((sum, p) => sum + p.price * p.stock, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">库存查询与预警</h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">商品种类</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">库存总值</p>
                <p className="text-2xl font-bold text-green-600">¥{totalValue.toFixed(2)}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">库存不足</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已缺货</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'inventory'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              库存查询
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'alerts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              库存预警
              {alerts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {alerts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 搜索筛选 */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索商品名称、编码..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部分类</option>
                <option value="housekeeping">客房用品</option>
                <option value="dining">餐饮用品</option>
                <option value="cleaning">清洁用品</option>
                <option value="engineering">工程物资</option>
                <option value="stationery">办公用品</option>
              </select>
            </div>
          </div>
        )}

        {/* 库存列表 */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">商品编码</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">商品名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">分类</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">规格</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">库存</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">单价</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">库存价值</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm">{product.product_code}</td>
                      <td className="px-4 py-3">{product.product_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {CATEGORY_MAP[product.category] || product.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.specification || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {product.stock} {product.unit}
                      </td>
                      <td className="px-4 py-3 text-right">¥{product.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">¥{(product.price * product.stock).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        {product.stock === 0 ? (
                          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                            缺货
                          </span>
                        ) : product.stock < 10 ? (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                            库存不足
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            正常
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 预警列表 */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {alerts.length === 0 ? (
              <div className="p-12 text-center">
                <Check className="w-12 h-12 text-green-300 mx-auto" />
                <p className="text-gray-500 mt-2">暂无预警</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">商品</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">预警类型</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">当前库存</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">阈值</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">状态</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {alerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{alert.product?.product_name}</div>
                        <div className="text-sm text-gray-500">{alert.product?.product_code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          alert.alert_type === 'low_stock' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {alert.alert_type === 'low_stock' ? '库存不足' : '库存预警'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {alert.current_qty}
                      </td>
                      <td className="px-4 py-3 text-right">{alert.threshold}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                          {alert.status === 'pending' ? '待处理' : '已处理'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          立即补货
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
