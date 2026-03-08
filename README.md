# 鹿鸣智投 - 开发与部署指南

> 基于多因子量化模型的智能选股平台

## 📋 目录
1. [快速开始](#快速开始)
2. [开发流程](#开发流程)
3. [备份与恢复](#备份与恢复)
4. [部署流程](#部署流程)
5. [功能验证](#功能验证)
6. [常见问题](#常见问题)

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.12+
- PostgreSQL 14+
- SSH 访问权限

### 本地开发
```bash
# 前端
cd luming-vite
npm install
npm run dev

# 后端
cd /opt/luming
source venv/bin/activate
uvicorn app.main:app --reload
```

---

## 🔄 开发流程

### ⚠️ 重要：Chrome MCP 验证要求

**每次部署后必须使用Chrome MCP验证！**

详细验证流程请查看: [Chrome MCP 验证标准流程](./CHROME_MCP_VERIFICATION.md)

**简要步骤:**
1. 连接Chrome MCP扩展
2. 导航到 http://43.136.38.87
3. 验证所有修改点
4. 检查控制台无错误
5. 截图保存验证结果

---

### 标准开发流程

#### 1. 备份当前版本 ⚠️ **重要**
```bash
# 运行备份脚本
./backup.sh
```

**备份内容:**
- ✓ 本地前端代码
- ✓ 服务器静态文件
- ✓ 数据库数据

**备份保留:** 最近7天的备份

#### 2. 本地开发
```bash
# 修改代码
cd luming-vite
vim src/App.jsx

# 本地测试
npm run build
npm run preview
```

#### 3. 部署到服务器
```bash
# 构建前端
cd luming-vite
npm run build

# 上传到服务器
scp -r -i ~/.ssh/id_ed25519_deploy dist/* ubuntu@43.136.38.87:/tmp/luming-vite-dist/

# 部署到生产目录
ssh -i ~/.ssh/id_ed25519_deploy ubuntu@43.136.38.87 "sudo cp -r /tmp/luming-vite-dist/* /opt/luming/static/"
```

#### 4. Chrome MCP 验证 ⚠️ **必须执行**

**连接Chrome MCP:**
1. 打开Chrome浏览器
2. 确保Chrome MCP扩展已安装并启用
3. 点击扩展图标选择"Connect"
4. 或在Claude Code中提示需要验证

**验证步骤:**
```javascript
// 获取标签页
tabs_context_mcp({createIfEmpty: true})

// 导航到网站
navigate({url: "http://43.136.38.87", tabId: <tab_id>})

// 等待加载
{action: "wait", duration: 3, tabId: <tab_id>}

// 截图验证
{screenshot: tabId: <tab_id>}

// 检查控制台
read_console_messages({tabId: <tab_id>, limit: 20})
```

**验证清单:**
- [ ] 页面正常加载
- [ ] 无404错误
- [ ] 无JavaScript错误
- [ ] 所有修改点验证通过
- [ ] 保存验证截图

**详细流程:** 参见 [Chrome MCP 验证标准流程](./CHROME_MCP_VERIFICATION.md)

#### 5. 更新文档
记录本次修改的内容和验证结果

---

## 💾 备份与恢复

### 自动备份脚本

**位置:** `~/鹿鸣智投/backup.sh`

**使用方法:**
```bash
./backup.sh
```

**备份内容:**

| 类型 | 路径 | 说明 |
|------|------|------|
| 本地 | `~/鹿鸣智投/backups/` | 前端代码 tar.gz |
| 服务器 | `/tmp/luming-backups/` | 静态文件 tar.gz |
| 数据库 | `/tmp/luming-backups/` | PostgreSQL SQL.gz |

### 恢复备份

**本地恢复:**
```bash
cd ~/Documents/Claude\ Code/
tar -xzf ~/鹿鸣智投/backups/luming-vite-backup-YYYYMMDD_HHMMSS.tar.gz
```

**服务器恢复:**
```bash
ssh -i ~/.ssh/id_ed25519_deploy ubuntu@43.136.38.87 \
  "sudo tar -xzf /tmp/luming-backups/luming-static-backup-YYYYMMDD_HHMMSS.tar.gz -C /opt/luming"
```

**数据库恢复:**
```bash
ssh -i ~/.ssh/id_ed25519_deploy ubuntu@43.136.38.87 \
  "gunzip -c /tmp/luming-backups/luming-db-backup-YYYYMMDD_HHMMSS.sql.gz | sudo -u postgres psql luming_db"
```

---

## 📦 部署流程

### 前端部署

```bash
# 1. 构建
cd luming-vite
npm run build

# 2. 上传
scp -r -i ~/.ssh/id_ed25519_deploy dist/* ubuntu@43.136.38.87:/tmp/luming-vite-dist/

# 3. 部署
ssh -i ~/.ssh/id_ed25519_deploy ubuntu@43.136.38.87 << 'ENDSSH'
  sudo cp -r /tmp/luming-vite-dist/* /opt/luming/static/
  sudo chmod 644 /opt/luming/static/*
  sudo chmod 644 /opt/luming/static/assets/*
  sudo chown -R ubuntu:ubuntu /opt/luming/static
ENDSSH
```

### 后端部署

```bash
ssh -i ~/.ssh/id_ed25519_deploy ubuntu@43.136.38.87 << 'ENDSSH'
  cd /opt/luming
  source venv/bin/activate
  git pull
  pip install -r requirements.txt
  sudo pkill -HUP uvicorn
ENDSSH
```

### 数据库更新

```bash
# 方式1: SQL 脚本
ssh -i ~/.ssh/id_ed25519_deploy ubuntu@43.136.38.87 \
  "sudo -u postgres psql -d luming_db -f /path/to/script.sql"

# 方式2: Python 脚本
ssh -i ~/.ssh/id_ed25519_deploy ubuntu@43.136.38.87 \
  "cd /opt/luming && source venv/bin/activate && python script.py"
```

---

## ✅ 功能验证

### 使用 Chrome MCP 验证

**步骤:**
1. 打开 Chrome MCP 连接
2. 导航到 `http://43.136.38.87`
3. 截图验证修改点
4. 测试交互功能
5. 检查控制台错误

### 验证清单

#### 基础功能
- [ ] 页面正常加载
- [ ] 无控制台错误
- [ ] 所有链接可点击
- [ ] 图片正常显示

#### 搜索功能
- [ ] 沪深股票搜索
- [ ] 港股搜索
- [ ] 美股搜索
- [ ] 基金搜索

#### 用户交互
- [ ] 登录/注册
- [ ] 添加持仓
- [ ] 自选股管理
- [ ] AI 分析

---

## 🔧 常见问题

### 404 错误 - 静态文件加载失败

**症状:**
```
Failed to load resource: the server responded with a status of 404
index-xxxxx.js:1
```

**原因:**
文件权限不正确

**解决:**
```bash
ssh -i ~/.ssh/id_ed25519_deploy ubuntu@43.136.38.87 \
  "sudo chmod -R 755 /opt/luming/static/ && sudo chmod -R 644 /opt/luming/static/assets/*"
```

### 数据库连接失败

**症状:**
```
connection to server on socket failed
FATAL: Peer authentication failed
```

**解决:**
```bash
# 使用 postgres 用户
sudo -u postgres psql -d luming_db
```

### 前端构建错误

**症状:**
```
Syntax error at line xxxx
```

**常见原因:**
1. JSX 语法错误
2. 样式属性中的数值未用引号包裹

**解决:**
```jsx
// ❌ 错误
<div style={{padding: 16px}}>

// ✅ 正确
<div style={{padding: '16px'}}>
```

---

## 📊 当前数据统计

### 股票数据库
| 市场 | 数量 |
|------|------|
| A股 | 5,298 |
| 港股 | 2,489 |
| 美股 | 77 |
| 基金 | 61 |
| **总计** | **7,925** |

### API 端点
- `/api/stocks/search-new` - 全市场搜索
- `/api/ai/analyze-new` - AI 分析
- `/api/stocks/holding` - 持仓管理
- `/api/stocks/watchlist` - 自选股管理

---

## 📝 更新日志

### 2025-02-21 - 全市场搜索 v1.3
- ✅ 新增77只美股（覆盖标普500主要成分股）
- ✅ 新增61只基金（17只ETF + 44只开放式基金）
- ✅ 修复静态文件权限问题
- ✅ 建立自动备份机制
- ✅ 完善开发流程文档
- ✅ 股票数据库总数: 7,925只

### 2025-02-20 - AI 分析 v1.2
- ✅ DeepSeek 集成
- ✅ Kimi 备份引擎
- ✅ 本地量化分析

### 2025-02-19 - 基础功能 v1.1
- ✅ 用户认证
- ✅ 持仓管理
- ✅ 自选股功能

---

## 👥 开发团队

**技术栈:**
- 前端: React 18 + Vite 7
- 后端: FastAPI + Python 3.12
- 数据库: PostgreSQL 14
- 部署: Ubuntu + Nginx

**联系方式:**
- 项目地址: `~/鹿鸣智投/`
- 服务器: 43.136.38.87
- SSH Key: `~/.ssh/id_ed25519_deploy`

---

**最后更新:** 2025-02-21 23:10
**版本:** v1.3.2
**状态:** ✅ 生产环境运行中
