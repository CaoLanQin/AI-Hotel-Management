import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Filter, Package } from 'lucide-react';
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
  image_url?: string;
  description?: string;
  status: boolean;
}

interface CartItem {
  product_id: number;
  quantity: number;
}

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'housekeeping', label: '客房用品' },
  { value: 'dining', label: '餐饮用品' },
  { value: 'cleaning', label: '清洁用品' },
  { value: 'engineering', label: '工程物资' },
  { value: 'stationery', label: '办公用品' },
];

export default function ProcurementProductsPage() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'products' | 'compare'>('products');
  const queryClient = useQueryClient();

  // 获取商品列表
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', keyword, category],
    queryFn: async () => {
      const data = await procurement.getProducts({ keyword, category });
      return data as Product[];
    },
  });

  // 获取比价数据
  const { data: compareData = [] } = useQuery({
    queryKey: ['comparePrices', keyword, category],
    queryFn: async () => {
      const data = await procurement.comparePrices({ keyword, category });
      return data as any[];
    },
    enabled: activeTab === 'compare',
  });

  // 获取购物车数量
  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      return await procurement.getCart();
    },
  });

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // 添加到购物车
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, qty }: { productId: number; qty: number }) => {
      await procurement.addToCart({ product_id: productId, quantity: qty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert('已添加到购物车');
    },
  });

  const addToCart = (product: Product, qty: number) => {
    addToCartMutation.mutate({ productId: product.id, qty });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-800">智能采购商城</h1>
            </div>
            {/* Tab切换 */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'products'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                商品浏览
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'compare'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                价格比较
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/procurement/cart" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                <ShoppingCart className="w-5 h-5" />
                <span className="badge">{cartCount}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索商品名称、品牌或规格..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>筛选</span>
            </button>
          </div>

          {/* 分类标签 */}
          <div className="flex items-center space-x-2 mt-4 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  category === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 商品列表 / 价格比较 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'products' ? (
          isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-2">加载中...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 mt-2">暂无商品</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedProduct(product);
                  setQuantity(product.min_order || 1);
                }}
              >
                {/* 商品图片 */}
                <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover rounded-t-lg" />
                  ) : (
                    <Package className="w-12 h-12 text-gray-300" />
                  )}
                </div>

                {/* 商品信息 */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 truncate">{product.product_name}</h3>
                  <p className="text-sm text-gray-500">{product.specification}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-semibold text-blue-600">¥{product.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">/{product.unit}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs ${product.stock > 10 ? 'text-green-500' : product.stock > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {product.stock > 10 ? '库存充足' : product.stock > 0 ? `剩余${product.stock}` : '缺货'}
                    </span>
                    <span className="text-xs text-gray-400">起订: {product.min_order}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
        ) : (
          /* 价格比较视图 */
          compareData.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 mt-2">暂无比价数据</p>
            </div>
          ) : (
            <div className="space-y-4">
              {compareData.map((item: any) => (
                <div key={item.product_id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{item.product_name}</h3>
                      <p className="text-sm text-gray-500">{item.brand} · {item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">参考价</p>
                      <p className="text-lg font-semibold text-gray-400 line-through">¥{item.default_price}</p>
                    </div>
                  </div>
                  
                  {/* 供应商报价列表 */}
                  {item.prices && item.prices.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-600">供应商报价：</p>
                      {item.prices.map((price: any, idx: number) => (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${idx === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <div className="flex items-center space-x-3">
                            {idx === 0 && <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded">最低价</span>}
                            <span className="font-medium">{price.supplier_name}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">起订: {price.min_order_qty}</span>
                            <span className={`text-lg font-bold ${idx === 0 ? 'text-green-600' : 'text-blue-600'}`}>
                              ¥{price.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center text-gray-500">
                      暂无供应商报价
                    </div>
                  )}
                  
                  {item.supplier_count > 0 && (
                    <div className="mt-3 text-sm text-green-600">
                      比参考价低 ¥{(item.default_price - item.lowest_price).toFixed(2)} ({((item.default_price - item.lowest_price) / item.default_price * 100).toFixed(0)}% OFF)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* 商品详情弹窗 */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="flex items-start justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">商品详情</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-4">
              <div className="flex gap-6">
                {/* 图片 */}
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.product_name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package className="w-16 h-16 text-gray-300" />
                  )}
                </div>

                {/* 信息 */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedProduct.product_name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {selectedProduct.brand && <p>品牌: {selectedProduct.brand}</p>}
                    {selectedProduct.specification && <p>规格: {selectedProduct.specification}</p>}
                    <p>单位: {selectedProduct.unit}</p>
                    <p>起订量: {selectedProduct.min_order}{selectedProduct.unit}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-2xl font-bold text-blue-600">¥{selectedProduct.price.toFixed(2)}</p>
                    <p className={`text-sm mt-1 ${selectedProduct.stock > 10 ? 'text-green-500' : 'text-yellow-500'}`}>
                      库存: {selectedProduct.stock} {selectedProduct.unit}
                    </p>
                  </div>
                </div>
              </div>

              {/* 描述 */}
              {selectedProduct.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                </div>
              )}

              {/* 数量选择 */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600">数量:</span>
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={() => setQuantity(Math.max(selectedProduct.min_order, quantity - 1))}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(selectedProduct.min_order, parseInt(e.target.value) || selectedProduct.min_order))}
                      className="w-16 text-center border-x border-gray-300 py-1"
                      min={selectedProduct.min_order}
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">小计</p>
                  <p className="text-xl font-bold text-blue-600">¥{(selectedProduct.price * quantity).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* 弹窗底部按钮 */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={() => {
                  addToCart(selectedProduct, quantity);
                  setSelectedProduct(null);
                }}
                disabled={selectedProduct.stock === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                加入购物车
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
