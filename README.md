# Hotel Edge System - 酒店边端管理系统

基于 SPECIFICATION.md 开发的酒店边端管理系统

## 📁 项目结构

```
hotel-edge/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/           # API 路由
│   │   ├── core/          # 核心配置
│   │   ├── models/        # 数据模型
│   │   └── schemas/       # Pydantic 验证模型
│   ├── scripts/           # 脚本
│   ├── requirements.txt    # Python 依赖
│   └── Dockerfile
├── frontend/              # React + TypeScript 前端
│   ├── src/
│   │   ├── app/          # 路由
│   │   ├── components/   # 组件
│   │   ├── lib/         # 工具函数
│   │   └── pages/       # 页面
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml     # Docker 编排
└── docs/                 # 文档
```

## 🚀 快速开始

### 1. 使用 Docker 启动（推荐）

```bash
# 克隆项目后，进入目录
cd hotel-edge

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

服务启动后：
- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

### 2. 手动启动（开发模式）

#### 后端
```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 初始化数据库（可选）
python scripts/seed.py

# 启动服务
uvicorn app.main:app --reload
```

#### 前端
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 🔑 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| frontdesk | front123 | 前台 |

## 📋 已实现功能

### 核心功能（TOP 5）
- ✅ 快速入住 (edge-2-2-1)
- ✅ 快速退房 (edge-2-4-1)
- ✅ 客房设备控制 (edge-3-1-2)
- ✅ 实时运营驾驶舱 (edge-1-1-1)
- ✅ 预订录入 (edge-2-1-1)

### 其他功能
- 房间管理（房型、房间 CRUD）
- 客人管理
- 预订管理（确认、取消）
- 设备控制（开/关、场景执行）
- 运营统计（入住率、营收、告警）

## 🛠️ 技术栈

### 后端
- FastAPI
- PostgreSQL 15
- Redis
- MQTT (IoT)
- SQLAlchemy

### 前端
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand
- TanStack Query
- ECharts

## 📝 开发规范

本项目严格遵循 `SPECIFICATION.md` 中的开发规范：
- RESTful API 设计
- JWT 认证
- RBAC 权限控制
- Docker 容器化部署
