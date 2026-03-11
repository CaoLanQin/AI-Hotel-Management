import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { procurement, purchase } from '@/lib/api';

interface StockOut {
  id: number;
  out_code: string;
  out_type: string;
  total_qty: number;
  total_amount: number;
  status: string;
  out_date: string;
  created_at: string;
  department?: { name: string };
  warehouse?: { name: string };
  applicant?: { username: string };
  items: any[];
}

interface Product {
  id: number;
  product_name: string;
  specification?: string;
  unit: string;
  price: number;
}

interface Warehouse {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

const OUT_TYPE_MAP: Record<string, string> = {
  consume: '领用出库',
  transfer: '调拨出库',
  damage: '报损出库',
  return: '退货出库',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已审核', color: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
};

export default function ProcurementStockOutPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    out_type: 'consume',
    department_id: null as number | null,
    warehouse_id: null as number | null,
    out_date: '',
    remark: '',
    items: [] as { product_id: number; quantity: number; unit_price: number }[],
  });

  const { data: stockOuts = [], isLoading } = useQuery({
    queryKey: ['stock-out'],
    queryFn: async () => {
      return await procurement.getStockOuts() as StockOut[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      return await procurement.getProducts() as Product[];
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      return await purchase.getWarehouses() as Warehouse[];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      return await procurement.getDepartments() as Department[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...formData,
        out_date: formData.out_date || new Date().toISOString(),
      };
      await procurement.createStockOut(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-out'] });
      setShowModal(false);
      resetForm();
      alert('出库单创建成功');
    },
  });

  const resetForm = () => {
    setFormData({
      out_type: 'consume',
      department_id: null,
      warehouse_id: null,
      out_date: '',
      remark: '',
      items: [],
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: 0, quantity: 1, unit_price: 0 }],
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const totalAmount = formData.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">出库管理</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>新建出库</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-500">今日出库</p>
            <p className="text-2xl font-bold text-blue-600">{stockOuts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-500">出库数量</p>
            <p className="text-2xl font-bold">
              {stockOuts.reduce((sum, s) => sum + (s.total_qty || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-500">出库金额</p>
            <p className="text-2xl font-bold text-orange-600">
              ¥{stockOuts.reduce((sum, s) => sum + (s.total_amount || 0), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-500">待审核</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stockOuts.filter(s => s.status === 'pending').length}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">出库单号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">类型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">领用部门</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">仓库</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">数量</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">金额</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stockOuts.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{item.out_code}</td>
                    <td className="px-4 py-3 text-sm">{OUT_TYPE_MAP[item.out_type] || item.out_type}</td>
                    <td className="px-4 py-3 text-sm">{item.department?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.warehouse?.name || '-'}</td>
                    <td className="px-4 py-3 text-right">{item.total_qty || 0}</td>
                    <td className="px-4 py-3 text-right">¥{(item.total_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${STATUS_MAP[item.status]?.color || 'bg-gray-100'}`}>
                        {STATUS_MAP[item.status]?.label || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">新建出库单</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">出库类型</label>
                    <select
                      value={formData.out_type}
                      onChange={e => setFormData({ ...formData, out_type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="consume">领用出库</option>
                      <option value="transfer">调拨出库</option>
                      <option value="damage">报损出库</option>
                      <option value="return">退货出库</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">仓库</label>
                    <select
                      value={formData.warehouse_id || ''}
                      onChange={e => setFormData({ ...formData, warehouse_id: Number(e.target.value) || null })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">请选择仓库</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">领用部门</label>
                    <select
                      value={formData.department_id || ''}
                      onChange={e => setFormData({ ...formData, department_id: Number(e.target.value) || null })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">请选择部门</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">出库日期</label>
                    <input
                      type="date"
                      value={formData.out_date}
                      onChange={e => setFormData({ ...formData, out_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">出库明细</label>
                    <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800">+ 添加商品</button>
                  </div>
                  <table className="w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-sm">商品</th>
                        <th className="px-2 py-2 text-right text-sm">数量</th>
                        <th className="px-2 py-2 text-right text-sm">单价</th>
                        <th className="px-2 py-2 text-right text-sm">金额</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-2 py-2">
                            <select
                              value={item.product_id}
                              onChange={e => updateItem(idx, 'product_id', Number(e.target.value))}
                              className="w-full border rounded px-2 py-1"
                            >
                              <option value={0}>请选择</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.product_name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full border rounded px-2 py-1 text-right"
                              min={1}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                              className="w-full border rounded px-2 py-1 text-right"
                              min={0}
                              step={0.01}
                            />
                          </td>
                          <td className="px-2 py-2 text-right">
                            ¥{(item.quantity * item.unit_price).toFixed(2)}
                          </td>
                          <td className="px-2 py-2">
                            <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-2 py-2 text-right font-medium">合计:</td>
                        <td className="px-2 py-2 text-right font-bold">¥{totalAmount.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    value={formData.remark}
                    onChange={e => setFormData({ ...formData, remark: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!formData.warehouse_id || formData.items.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  提交审核
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
