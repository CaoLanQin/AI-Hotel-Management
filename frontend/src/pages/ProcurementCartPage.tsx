import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Save, Send, ShoppingCart, Package } from 'lucide-react';
import { procurement } from '@/lib/api';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: {
    id: number;
    product_name: string;
    specification?: string;
    unit: string;
    price: number;
    stock: number;
    image_url?: string;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function ProcurementCartPage() {
  const queryClient = useQueryClient();
  const [deptId, setDeptId] = useState<number | null>(null);
  const [expectedDate, setExpectedDate] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [purpose, setPurpose] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // 获取购物车
  const { data: cartItems = [], isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const data = await procurement.getCart();
      return data as CartItem[];
    },
  });

  // 获取部门列表
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const data = await procurement.getDepartments();
      return data as Department[];
    },
  });

  // 删除购物车项
  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await procurement.removeFromCart(itemId);
    },
    onSuccess: () => {
      // 直接更新缓存
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return [];
        return old.filter((item: CartItem) => item.id !== deleteMutation.variables);
      });
    },
  });

  // 清空购物车
  const clearMutation = useMutation({
    mutationFn: async () => {
      await procurement.clearCart();
    },
    onSuccess: () => {
      queryClient.setQueryData(['cart'], []);
      setSelectedItems([]);
    },
  });

  // 更新数量
  const updateMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      await procurement.updateCartItem(itemId, { product_id: 0, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // 计算金额
  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const selectedAmount = cartItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

  // 提交采购申请
  const submitProcurement = async () => {
    if (!deptId || selectedItems.length === 0) {
      alert('请选择部门和商品');
      return;
    }

    const items = cartItems
      .filter(item => selectedItems.includes(item.id))
      .map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

    try {
      // 先创建采购申请
      await procurement.createProcurementRequest({
        dept_id: deptId,
        expected_date: expectedDate || null,
        urgency,
        purpose,
        items,
      });

      alert('采购申请提交成功！');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setSelectedItems([]);
      setPurpose('');
    } catch (error) {
      console.error(error);
      alert('提交失败，请重试');
    }
  };

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">购物车与下单</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 购物车列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold">购物车</h2>
                </div>
                <button
                  onClick={() => clearMutation.mutate()}
                  disabled={cartItems.length === 0}
                  className="flex items-center space-x-1 text-sm text-red-500 hover:text-red-700 disabled:text-gray-300"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>清空购物车</span>
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-gray-500 mt-2">购物车是空的</p>
                </div>
              ) : (
                <div className="divide-y">
                  {/* 全选 */}
                  <div className="p-4 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === cartItems.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">全选</span>
                  </div>

                  {/* 购物车项 */}
                  {cartItems.map(item => (
                    <div key={item.id} className="p-4 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== item.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />

                      <div className="w-16 h-16 bg-gray-100 rounded ml-4 flex items-center justify-center flex-shrink-0">
                        {item.product.image_url ? (
                          <img src={item.product.image_url} alt="" className="w-full h-full object-cover rounded" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300" />
                        )}
                      </div>

                      <div className="ml-4 flex-1">
                        <h3 className="font-medium">{item.product.product_name}</h3>
                        <p className="text-sm text-gray-500">{item.product.specification}</p>
                        <p className="text-sm text-gray-500">¥{item.product.price}/{item.product.unit}</p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() => updateMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>

                        <div className="w-20 text-right font-medium">
                          ¥{(item.product.price * item.quantity).toFixed(2)}
                        </div>

                        <button
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 采购申请单 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-4">
              <div className="p-4 border-b">
                <h2 className="font-semibold flex items-center">
                  <Send className="w-5 h-5 mr-2 text-blue-600" />
                  采购申请单
                </h2>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    申请部门 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={deptId || ''}
                    onChange={e => setDeptId(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">请选择部门</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    期望到货日期
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={e => setExpectedDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    紧急程度
                  </label>
                  <select
                    value={urgency}
                    onChange={e => setUrgency(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="normal">一般</option>
                    <option value="urgent">紧急</option>
                    <option value="critical">特急</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用途说明
                  </label>
                  <textarea
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    rows={3}
                    placeholder="请输入采购用途..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">商品总额:</span>
                    <span className="font-medium">¥{selectedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">运费:</span>
                    <span className="font-medium">¥0.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>合计:</span>
                    <span className="text-blue-600">¥{selectedAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => clearMutation.mutate()}
                    className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>保存草稿</span>
                  </button>
                  <button
                    onClick={submitProcurement}
                    disabled={selectedItems.length === 0 || !deptId}
                    className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    <Send className="w-4 h-4" />
                    <span>提交申请</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
