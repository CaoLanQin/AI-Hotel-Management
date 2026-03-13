import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理401错误
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // 刷新失败，跳转登录
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const auth = {
  login: async (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
};

// Room API
export const rooms = {
  getAll: async (params?: { status?: string; room_type_id?: number }) => {
    const response = await api.get('/rooms', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },
  
  getAvailable: async (params?: { room_type_id?: number }) => {
    const response = await api.get('/rooms/available/list', { params });
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/rooms', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data;
  },
};

// Room Type API
export const roomTypes = {
  getAll: async () => {
    const response = await api.get('/rooms/types');
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/rooms/types', data);
    return response.data;
  },
};

// Booking API
export const bookings = {
  getAll: async (params?: { status?: string }) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/bookings', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/bookings/${id}`, data);
    return response.data;
  },
  
  confirm: async (id: number) => {
    const response = await api.post(`/bookings/${id}/confirm`);
    return response.data;
  },
  
  cancel: async (id: number) => {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data;
  },
};

// Check-In API
export const checkIn = {
  getAll: async (params?: { status?: string }) => {
    const response = await api.get('/checkin', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/checkin/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/checkin', data);
    return response.data;
  },
  
  checkOut: async (id: number) => {
    const response = await api.post(`/checkin/${id}/check-out`);
    return response.data;
  },
  
  extend: async (id: number, newCheckOutTime: string) => {
    const response = await api.post(`/checkin/${id}/extend?new_check_out_time=${newCheckOutTime}`);
    return response.data;
  },
};

// Guest API
export const guests = {
  getAll: async (params?: { phone?: string; name?: string }) => {
    const response = await api.get('/guests', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/guests/${id}`);
    return response.data;
  },
  
  searchByPhone: async (phone: string) => {
    const response = await api.get(`/guests/search/by-phone/${phone}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/guests', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/guests/${id}`, data);
    return response.data;
  },
};

// Device API
export const devices = {
  getAll: async (params?: { room_id?: number; device_type?: string }) => {
    const response = await api.get('/devices', { params });
    return response.data;
  },
  
  getByRoom: async (roomId: number) => {
    const response = await api.get(`/devices/room/${roomId}`);
    return response.data;
  },
  
  control: async (deviceId: number, action: string, value?: any) => {
    const response = await api.post('/devices/control', {
      device_id: deviceId,
      action,
      value,
    });
    return response.data;
  },
  
  executeScene: async (sceneId: number) => {
    const response = await api.post(`/devices/scene/${sceneId}/execute`);
    return response.data;
  },
  
  // Scenes
  getScenes: async () => {
    const response = await api.get('/devices/scenes');
    return response.data;
  },
  
  getScenesByRoom: async (roomId: number) => {
    const response = await api.get(`/devices/scenes?room_id=${roomId}`);
    return response.data;
  },
  
  // Energy
  getEnergyDashboard: async () => {
    const response = await api.get('/devices/energy/dashboard');
    return response.data;
  },
  
  getRoomEnergy: async (roomId: number) => {
    const response = await api.get(`/devices/energy/room/${roomId}`);
    return response.data;
  },
  
  getEnergyAlerts: async () => {
    const response = await api.get('/devices/energy/alerts');
    return response.data;
  },
};

// Dashboard API
export const dashboard = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  
  getRoomStatus: async () => {
    const response = await api.get('/dashboard/room-status');
    return response.data;
  },
  
  getTodayRevenue: async () => {
    const response = await api.get('/dashboard/revenue/today');
    return response.data;
  },
  
  getAlerts: async () => {
    const response = await api.get('/dashboard/alerts');
    return response.data;
  },
};

// Purchase & Supply Chain API
export const purchase = {
  // Suppliers
  getSuppliers: async () => {
    const response = await api.get('/procurement/suppliers');
    return response.data;
  },
  
  getSupplier: async (id: number) => {
    const response = await api.get(`/purchase/suppliers/${id}`);
    return response.data;
  },
  
  createSupplier: async (data: any) => {
    const response = await api.post('/procurement/suppliers', data);
    return response.data;
  },
  
  updateSupplier: async (id: number, data: any) => {
    const response = await api.put(`/purchase/suppliers/${id}`, data);
    return response.data;
  },
  
  deleteSupplier: async (id: number) => {
    const response = await api.delete(`/purchase/suppliers/${id}`);
    return response.data;
  },
  
  // Warehouses
  getWarehouses: async () => {
    const response = await api.get('/procurement/warehouses');
    return response.data;
  },
  
  createWarehouse: async (data: any) => {
    const response = await api.post('/procurement/warehouses', data);
    return response.data;
  },
  
  // Inventory
  getInventory: async () => {
    const response = await api.get('/procurement/inventory');
    return response.data;
  },
  
  createInventoryItem: async (data: any) => {
    const response = await api.post('/procurement/inventory', data);
    return response.data;
  },
  
  getLowStockItems: async () => {
    const response = await api.get('/procurement/inventory/low-stock/list');
    return response.data;
  },
  
  // Purchase Orders
  getPurchaseOrders: async () => {
    const response = await api.get('/procurement/purchase-orders');
    return response.data;
  },
  
  getPurchaseOrder: async (id: number) => {
    const response = await api.get(`/purchase/purchase-orders/${id}`);
    return response.data;
  },
  
  createPurchaseOrder: async (data: any) => {
    const response = await api.post('/procurement/purchase-orders', data);
    return response.data;
  },
  
  submitPurchaseOrder: async (id: number) => {
    const response = await api.put(`/purchase/purchase-orders/${id}/submit`);
    return response.data;
  },
  
  approvePurchaseOrder: async (id: number) => {
    const response = await api.put(`/purchase/purchase-orders/${id}/approve`);
    return response.data;
  },
  
  rejectPurchaseOrder: async (id: number) => {
    const response = await api.put(`/purchase/purchase-orders/${id}/reject`);
    return response.data;
  },
  
  orderPurchaseOrder: async (id: number) => {
    const response = await api.put(`/purchase/purchase-orders/${id}/order`);
    return response.data;
  },
  
  receivePurchaseOrder: async (id: number) => {
    const response = await api.put(`/purchase/purchase-orders/${id}/receive`);
    return response.data;
  },
  
  deletePurchaseOrder: async (id: number) => {
    const response = await api.delete(`/purchase/purchase-orders/${id}/delete`);
    return response.data;
  },
  
  // Stock Records
  getStockRecords: async () => {
    const response = await api.get('/procurement/stock-records');
    return response.data;
  },
  
  createStockRecord: async (data: any) => {
    const response = await api.post('/procurement/stock-records', data);
    return response.data;
  },
  
  // Statistics
  getPurchaseStats: async () => {
    const response = await api.get('/procurement/purchase-statistics');
    return response.data;
  },
  
  getInventoryStats: async () => {
    const response = await api.get('/procurement/inventory-statistics');
    return response.data;
  },
};

// Procurement Mall API (智能采购商城)
export const procurement = {
  // Departments
  getDepartments: async () => {
    const response = await api.get('/procurement/departments');
    return response.data;
  },
  
  // Products
  getProducts: async (params?: { keyword?: string; category?: string }) => {
    const response = await api.get('/procurement/products', { params });
    return response.data;
  },
  
  getProduct: async (id: number) => {
    const response = await api.get(`/procurement/products/${id}`);
    return response.data;
  },
  
  // 价格比较
  comparePrices: async (params?: { keyword?: string; category?: string }) => {
    const response = await api.get('/procurement/products/compare-prices', { params });
    return response.data;
  },
  
  // 供应商报价
  getSupplierPrices: async (productId: number) => {
    const response = await api.get(`/procurement/products/${productId}/supplier-prices`);
    return response.data;
  },
  
  addSupplierPrice: async (data: { product_id: number; supplier_id: number; price: number; min_order_qty: number }) => {
    const response = await api.post('/procurement/supplier-prices', data);
    return response.data;
  },
  
  // Cart
  getCart: async () => {
    const response = await api.get('/procurement/cart');
    return response.data;
  },
  
  addToCart: async (data: { product_id: number; quantity: number }) => {
    const response = await api.post('/procurement/cart', data);
    return response.data;
  },
  
  updateCartItem: async (itemId: number, data: { product_id: number; quantity: number }) => {
    const response = await api.put(`/procurement/cart/${itemId}`, data);
    return response.data;
  },
  
  removeFromCart: async (itemId: number) => {
    const response = await api.delete(`/procurement/cart/${itemId}`);
    return response.data;
  },
  
  clearCart: async () => {
    const response = await api.delete('/procurement/cart');
    return response.data;
  },
  
  // Procurement Requests
  getProcurementRequests: async () => {
    const response = await api.get('/procurement/procurement-requests');
    return response.data;
  },
  
  createProcurementRequest: async (data: any) => {
    const response = await api.post('/procurement/procurement-requests', data);
    return response.data;
  },
  
  submitProcurementRequest: async (id: number) => {
    const response = await api.put(`/procurement/procurement-requests/${id}/submit`);
    return response.data;
  },
  
  approveProcurementRequest: async (id: number) => {
    const response = await api.put(`/procurement/procurement-requests/${id}/approve`);
    return response.data;
  },
  
  rejectProcurementRequest: async (id: number) => {
    const response = await api.put(`/procurement/procurement-requests/${id}/reject`);
    return response.data;
  },
  
  // Orders
  getOrders: async () => {
    const response = await api.get('/procurement/orders');
    return response.data;
  },
  
  createOrder: async (data: any) => {
    const response = await api.post('/procurement/orders', data);
    return response.data;
  },
  
  confirmOrder: async (id: number) => {
    const response = await api.put(`/procurement/orders/${id}/confirm`);
    return response.data;
  },
  
  shipOrder: async (id: number, logistics_no?: string) => {
    const response = await api.put(`/procurement/orders/${id}/ship?logistics_no=${logistics_no || ''}`);
    return response.data;
  },
  
  deliverOrder: async (id: number) => {
    const response = await api.put(`/procurement/orders/${id}/deliver`);
    return response.data;
  },
  
  completeOrder: async (id: number) => {
    const response = await api.put(`/procurement/orders/${id}/complete`);
    return response.data;
  },
  
  // Stock In
  getStockIns: async () => {
    const response = await api.get('/procurement/stock-in');
    return response.data;
  },
  
  createStockIn: async (data: any) => {
    const response = await api.post('/procurement/stock-in', data);
    return response.data;
  },
  
  approveStockIn: async (id: number) => {
    const response = await api.put(`/procurement/stock-in/${id}/approve`);
    return response.data;
  },
  
  // Stock Out
  getStockOuts: async () => {
    const response = await api.get('/procurement/stock-out');
    return response.data;
  },
  
  createStockOut: async (data: any) => {
    const response = await api.post('/procurement/stock-out', data);
    return response.data;
  },
  
  approveStockOut: async (id: number) => {
    const response = await api.put(`/procurement/stock-out/${id}/approve`);
    return response.data;
  },
  
  // Stock Alerts
  getStockAlerts: async () => {
    const response = await api.get('/procurement/stock-alerts');
    return response.data;
  },
  
  resolveStockAlert: async (id: number) => {
    const response = await api.put(`/procurement/stock-alerts/${id}/resolve`);
    return response.data;
  },
  
  // Statistics
  getProcurementStats: async () => {
    const response = await api.get('/procurement/procurement/statistics');
    return response.data;
  },

  // Menu
  getMenus: async () => {
    const response = await api.get('/menu/');
    return response.data;
  },
  getMenuTree: async () => {
    const response = await api.get('/menu/tree');
    return response.data;
  },
  initMenus: async () => {
    const response = await api.post('/menu/init');
    return response.data;
  },
};

export const menu = {
  getMenus: async () => {
    const response = await api.get('/menu/');
    return response.data;
  },
  getMenuTree: async () => {
    const response = await api.get('/menu/tree');
    return response.data;
  },
  initMenus: async () => {
    const response = await api.post('/menu/init');
    return response.data;
  },
};

// Infrastructure - 基建与系统管理
export const infrastructure = {
  // 设备配置管理
  getDevices: async (params?: { device_type?: string; status?: string; search?: string }) => {
    const response = await api.get('/infrastructure/devices', { params });
    return response.data;
  },
  getDevice: async (id: number) => {
    const response = await api.get(`/infrastructure/devices/${id}`);
    return response.data;
  },
  createDevice: async (data: any) => {
    const response = await api.post('/infrastructure/devices', data);
    return response.data;
  },
  updateDevice: async (id: number, data: any) => {
    const response = await api.put(`/infrastructure/devices/${id}`, data);
    return response.data;
  },
  deleteDevice: async (id: number) => {
    const response = await api.delete(`/infrastructure/devices/${id}`);
    return response.data;
  },
  restartDevice: async (id: number) => {
    const response = await api.post(`/infrastructure/devices/${id}/restart`);
    return response.data;
  },

  // 网关管理
  getGateways: async () => {
    const response = await api.get('/infrastructure/gateways');
    return response.data;
  },
  getGateway: async (id: number) => {
    const response = await api.get(`/infrastructure/gateways/${id}`);
    return response.data;
  },

  // 边缘服务器监控
  getServers: async () => {
    const response = await api.get('/infrastructure/servers');
    return response.data;
  },
  getServer: async (id: number) => {
    const response = await api.get(`/infrastructure/servers/${id}`);
    return response.data;
  },

  // 零接触入网
  getOnboardingTasks: async (status?: string) => {
    const response = await api.get('/infrastructure/onboarding/tasks', { params: { status } });
    return response.data;
  },
  startScan: async () => {
    const response = await api.post('/infrastructure/onboarding/scan');
    return response.data;
  },
  approveOnboarding: async (taskId: number) => {
    const response = await api.post(`/infrastructure/onboarding/tasks/${taskId}/approve`);
    return response.data;
  },

  // 门店基础配置
  getBuildings: async () => {
    const response = await api.get('/infrastructure/buildings');
    return response.data;
  },

  // 日志审计
  getLogs: async (params?: { user?: string; module?: string; action?: string; limit?: number }) => {
    const response = await api.get('/infrastructure/logs', { params });
    return response.data;
  },

  // 数据备份
  getBackups: async () => {
    const response = await api.get('/infrastructure/backups');
    return response.data;
  },
  createBackup: async (backupType: string = 'full') => {
    const response = await api.post('/infrastructure/backups', null, { params: { backup_type: backupType } });
    return response.data;
  },
};
