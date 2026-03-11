# 采购模块合并方案

## 一、当前模型分析

### 供应链采购模块 (原有)
- `Supplier` - 供应商 ✅
- `Warehouse` - 仓库 ✅
- `InventoryItem` - 库存物品（基于库存）
- `PurchaseOrder` - 采购订单
- `StockRecord` - 库存记录

### 智能采购商城模块 (原有)
- `Product` - 商品（基于商城）
- `ShoppingCart` - 购物车
- `ProcurementRequest` - 采购申请
- `PurchaseOrderNew` - 订单
- `Department` - 部门 ✅

## 二、合并策略

### 1. 统一商品模型 (方案A)
保留 `InventoryItem` 和 `Product` 两个表，通过外键关联：
- `Product` 包含：商品信息、价格、供应商
- `InventoryItem` 包含：库存信息、预警设置
- 两者通过 `product_id` 关联

### 2. 统一订单模型
保留双模式流程：
- 采购申请模式：`ProcurementRequest` → `PurchaseOrderNew`
- 商城购物流程：直接 `ShoppingCart` → `PurchaseOrderNew`

### 3. 统一库存模型
- 入库：`StockIn` / `StockInItem`（基于 Product）
- 出库：`StockOut` / `StockOutItem`（基于 Product）
- 预警：`StockAlert`（基于 Product）

## 三、待开发功能清单

### 后端 API
- [ ] 统一供应商 CRUD
- [ ] 统一仓库 CRUD  
- [ ] 统一商品 CRUD (整合 InventoryItem + Product)
- [ ] 统一购物车
- [ ] 统一采购申请
- [ ] 统一订单管理
- [ ] 统一入库管理
- [ ] 统一出库管理
- [ ] 库存预警
- [ ] 统计数据

### 前端页面
- [ ] 商品浏览与搜索 (edge-6-1-1)
- [ ] 购物车与下单 (edge-6-1-2)
- [ ] 订单跟踪 (edge-6-1-3)
- [ ] 入库管理 (edge-6-2-1)
- [ ] 出库管理 (edge-6-2-2)
- [ ] 库存查询与预警 (edge-6-2-3)
- [ ] 供应商管理
- [ ] 仓库管理
- [ ] 部门管理

## 四、页面布局参考

详见需求文档：
- `/usr/projects/客房酒店管理系统需求/边端-本地供应链与采购-edge-6-1-1-商品浏览与搜索.md`
- `/usr/projects/客房酒店管理系统需求/边端-本地供应链与采购-edge-6-1-2-购物车与下单.md`
- `/usr/projects/客房酒店管理系统需求/边端-本地供应链与采购-edge-6-2-1-入库管理.md`
- `/usr/projects/客房酒店管理系统需求/边端-本地供应链与采购-edge-6-2-2-出库管理.md`
