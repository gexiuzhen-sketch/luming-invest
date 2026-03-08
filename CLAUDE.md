# 鹿鸣智投 - Claude 工作指南

## 项目概述

A股/港股/美股 AI 智能投资平台，前端 React+TypeScript，后端 FastAPI+PostgreSQL。

**生产服务器**: `ubuntu@43.136.38.87`
**本地前端路径**: `/Users/a123456/Documents/Claude Code/鹿鸣智投/luming-frontend-v2/`
**生产前端路径**: `/opt/luming/static/`
**生产后端路径**: `/opt/luming/app/main.py`

---

## ⚠️ 架构关键说明

### 后端：只有一个生产后端

**✅ 生产后端（FastAPI）**: `/opt/luming/app/main.py`
**❌ 废弃文件（Flask）**: `/opt/luming/backend/app.py` → 不要修改，不运行

**修改后端前必须先确认运行架构**：
```bash
ps aux | grep -E '(uvicorn|gunicorn|python.*main.py)' | grep -v grep
netstat -tlnp | grep python
```

### 前端：luming-frontend-v2 是当前版本

- `luming-frontend-v2/` ✅ 当前开发版本
- `luming-frontend/` ❌ 旧版本，不要修改
- 根目录 `index.html` ❌ 废弃，不要修改

---

## Testing & Verification

### 修复股票数据后的验证流程

1. **API测试**（含边界情况）：
   - 5位港股代码：`01919`（中远海控）、`00700`（腾讯）
   - 带点美股代码：`BRK.B`
   - A股6位代码：`600519`、`000001`

2. **本地可视化验证**：
   ```bash
   cd /Users/a123456/Documents/Claude\ Code/鹿鸣智投/luming-frontend-v2
   npm run dev
   # 打开 http://localhost:5173 检查显示
   ```

3. **生产验证**：用无痕模式（绕过缓存）访问 `http://43.136.38.87/`

### 关闭任务前的3步检查

- [ ] API 直接测试通过
- [ ] 本地 dev server 视觉确认
- [ ] 生产部署后无痕模式确认

---

## Backend Architecture - Stock Data APIs

### API 优先级与 Fallback 链

**设计原则：永远不依赖单一 API 源，必须实现 fallback 链**

```
A股数据：  腾讯财经 → 新浪财经 → 本地缓存 → Mock数据
港股数据：  腾讯财经 → 本地缓存 → Mock数据
美股数据：  Twelve Data → Yahoo Finance → 本地缓存 → Mock数据
```

**每个 fallback 步骤必须记录日志**：
```typescript
try {
  const data = await primaryAPI(code);
  return data;
} catch (err) {
  console.warn(`[${new Date().toISOString()}] Primary API failed for ${code}:`, err);
  try {
    const data = await secondaryAPI(code);
    console.log(`[Fallback] Used secondary API for ${code}`);
    return data;
  } catch (err2) {
    console.warn(`[${new Date().toISOString()}] Secondary API failed:`, err2);
    return getCachedData(code) ?? getMockData(code);
  }
}
```

### 已知 API 问题

- Yahoo Finance：频繁 403 错误，不作为主要源
- Twelve Data：需要有效 API key，key 失效时切换
- TuShare：权限受限，仅用于特定数据
- 腾讯财经：当前最稳定的 A股/港股源

---

## Deployment - Frontend

### 标准部署步骤（每次必须）

```bash
cd /Users/a123456/Documents/Claude\ Code/鹿鸣智投/luming-frontend-v2

# 1. 类型检查（必须 0 错误）
npm run type-check

# 2. Lint 检查（必须 0 错误）
npm run lint

# 3. 构建
npm run build

# 4. 部署到生产
rsync -avz --delete dist/ ubuntu@43.136.38.87:/opt/luming/static/

# 5. 生产验证（无痕模式）
# 访问 http://43.136.38.87/ 并强制刷新 (Cmd+Shift+R)
```

### 部署后看不到更新

```bash
# 服务器端清理 nginx 缓存
ssh ubuntu@43.136.38.87 "systemctl reload nginx"
```

### 版本管理

版本号在 `src/version.ts` 中维护，每次部署增加 patch 版本。

---

## 常见股票代码格式

| 市场 | 格式 | 示例 |
|------|------|------|
| A股沪市 | 6位数字 | `600519` |
| A股深市 | 6位数字 | `000858`, `300750` |
| 港股 | 5位数字（补零） | `01919`, `00700` |
| 美股 | 字母+可能含点 | `AAPL`, `BRK.B` |
| 基金 | 6位数字 | `000001` |

**股票代码验证函数**必须支持 `.` 和非纯字母代码（BRK.B 问题）。

---

## 批量 UI 变更原则

修改 UI 时，先问：**还有哪些相关变更可以一起做？**

例如改导航栏 → 同时检查：移动端响应式、颜色一致性、图标统一性、动画效果。

一次实现，一次测试，一次部署。避免多次小改导致多次部署开销。

---

## 开发工具

### 已配置的 Hooks（settings.json）

- `preDeploy`：自动运行 type-check + lint
- `preSave`：文件保存通知

### 可用 Skills

- `/stock-fix-verify`：股票数据修复完整验证流程
- `/xhs-cover`：小红书封面生成
- `/deploy-safe`：六阶段安全部署流程
