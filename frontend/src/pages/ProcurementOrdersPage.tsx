import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Search, X, Check, Ban, Trash2, Send, Eye } from 'lucide-react';
import { procurement } from '@/lib/api';

interface Order {
  id: number;
  request_no: string;
  order_no?: string;
  total_amount: number;
  freight: number;
  status: string;
  created_at: string;
  purpose?: string;
  expected_date?: string;
  urgency?: string;
  department?: { name: string };
  applicant?: { username: string; full_name?: string };
  items: {
    id?: number;
    product?: { product_name: string; specification?: string; unit?: string };
    product_id: number;
    quantity: number;
    unit_price: number;
    total_amount?: number;
  }[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: '已发货', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: '已送达', color: 'bg-green-100 text-green-800' },
  completed: { label: '已完成', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
};

const URGENCY_MAP: Record<string, string> = {
  low: '低',
  normal: '普通',
  high: '紧急',
  urgent: '加急',
};

export default function ProcurementOrdersPage() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', keyword, status],
    queryFn: async () => {
      return await procurement.getProcurementRequests() as Order[];
    },
  });

  const filteredOrders = orders.filter(order => {
    const orderNo = order.request_no || order.order_no || '';
    if (keyword && !orderNo.toLowerCase().includes(keyword.toLowerCase())) return false;
    if (status && order.status !== status) return false;
    return true;
  });

  // 提交审批
  const submitMutation = useMutation({
    mutationFn: async (id: number) => {
      return await procurement.submitProcurementRequest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      alert('提交成功');
    },
  });

  // 审批通过
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await procurement.approveProcurementRequest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      alert('审批通过');
    },
  });

  // 审批拒绝
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      return await procurement.rejectProcurementRequest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      alert('已拒绝');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">订单跟踪</h1>

        {/* 搜索筛选 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>

        {/* 订单列表 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-2">暂无订单</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* 订单头部 */}
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-medium">{order.request_no || order.order_no}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${STATUS_MAP[order.status]?.color || 'bg-gray-100'}`}>
                    {STATUS_MAP[order.status]?.label || order.status}
                  </span>
                </div>

                {/* 订单内容 */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">部门: {order.department?.name || '-'}</p>
                      <p className="text-sm text-gray-500">用途: {order.purpose || '-'}</p>
                      <p className="text-sm text-gray-500">紧急程度: {URGENCY_MAP[order.urgency || 'normal'] || '普通'}</p>
                      <div className="mt-2 space-y-1">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <p key={idx} className="text-sm text-gray-500">
                            {item.product?.product_name || '商品'} x {item.quantity} - ¥{(item.unit_price * item.quantity).toFixed(2)}
                          </p>
                        ))}
                        {order.items?.length > 3 && (
                          <p className="text-sm text-gray-400">...还有 {order.items.length - 3} 项商品</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">订单金额</p>
                      <p className="text-xl font-bold text-blue-600">¥{order.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* 订单操作 */}
                <div className="p-4 border-t flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* 状态操作按钮 */}
                    {order.status === 'draft' && (
                      <button
                        onClick={() => submitMutation.mutate(order.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                        <span>提交审批</span>
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(order.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                          <span>审批通过</span>
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(order.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          <Ban className="w-4 h-4" />
                          <span>审批拒绝</span>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center space-x-1 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="w-4 h-4" />
                      <span>查看详情</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 详情弹窗 */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">订单详情</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">订单号</p>
                    <p className="font-mono">{selectedOrder.request_no}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">状态</p>
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_MAP[selectedOrder.status]?.color || 'bg-gray-100'}`}>
                      {STATUS_MAP[selectedOrder.status]?.label || selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">申请人</p>
                    <p>{selectedOrder.applicant?.full_name || selectedOrder.applicant?.username || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">部门</p>
                    <p>{selectedOrder.department?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">期望日期</p>
                    <p>{selectedOrder.expected_date ? new Date(selectedOrder.expected_date).toLocaleDateString('zh-CN') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">紧急程度</p>
                    <p>{URGENCY_MAP[selectedOrder.urgency || 'normal'] || '普通'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">用途</p>
                    <p>{selectedOrder.purpose || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">商品明细</p>
                  <table className="w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm">商品</th>
                        <th className="px-3 py-2 text-right text-sm">数量</th>
                        <th className="px-3 py-2 text-right text-sm">单价</th>
                        <th className="px-3 py-2 text-right text-sm">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">
                            <p className="text-sm">{item.product?.product_name || '商品'}</p>
                            <p className="text-xs text-gray-400">{item.product?.specification}</p>
                          </td>
                          <td className="px-3 py-2 text-right">{item.quantity} {item.product?.unit || '件'}</td>
                          <td className="px-3 py-2 text-right">¥{item.unit_price.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">¥{(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right font-medium">合计:</td>
                        <td className="px-3 py-2 text-right font-bold">¥{selectedOrder.total_amount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
