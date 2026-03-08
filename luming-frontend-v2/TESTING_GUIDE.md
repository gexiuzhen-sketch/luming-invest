# 鹿鸣智投 - 快速测试指南

## 🚀 快速启动

### 开发环境
```bash
cd "/Users/a123456/Documents/Claude Code/鹿鸣智投/luming-frontend-v2"
npm run dev
```

浏览器访问: http://localhost:5177

---

## 🧪 功能测试流程

### 1️⃣ 引导流程测试
1. 清除浏览器LocalStorage（首次访问模拟）
   ```javascript
   localStorage.clear()
   location.reload()
   ```
2. 预期: 显示引导页（当前为简化版本）

### 2️⃣ 发现好股测试
1. 切换市场标签（A股、港股、美股、基金）
2. 点击行业筛选
3. 滚动查看股票列表
4. 点击任意股票查看详情
5. 测试"加自选"按钮
6. 测试"买卖建议"按钮
7. 第4次点击查看升级弹窗

### 3️⃣ 自选股测试
1. 点击底部导航"自选"
2. 预期: 提示登录
3. 登录后返回自选页
4. 测试搜索功能
5. 测试排序按钮
6. 测试删除自选股

### 4️⃣ 持仓测试
1. 点击底部导航"持仓"
2. 预期: 提示登录
3. 登录后点击"添加持仓"
4. 填写表单：
   - 股票代码: 600519
   - 股票名称: 贵州茅台
   - 市场: 上海
   - 成本价: 1500
   - 持有数量: 100
   - 买入日期: 2024-01-01
5. 提交查看持仓列表
6. 测试删除持仓

### 5️⃣ 会员测试
1. 点击底部导航"会员"
2. 查看当前会员状态
3. 查看特权对比表
4. 免费用户点击"立即升级"
5. 验证升级后状态变化

### 6️⃣ 登录测试
1. 输入11位手机号
2. 点击"获取验证码"
3. 验证60秒倒计时
4. 输入任意验证码
5. 点击登录
6. 验证跳转到发现好股

---

## 🔧 开发者工具

### 查看LocalStorage数据
```javascript
// 控制台执行
console.log('用户:', JSON.parse(localStorage.getItem('lm_user')))
console.log('自选股:', JSON.parse(localStorage.getItem('lm_watchlist')))
console.log('持仓:', JSON.parse(localStorage.getItem('lm_portfolio')))
console.log('引导状态:', localStorage.getItem('lm_onboarding'))
console.log('使用次数:', JSON.parse(localStorage.getItem('lm_usage')))
```

### 重置应用状态
```javascript
localStorage.clear()
location.reload()
```

### 模拟会员升级
```javascript
const user = JSON.parse(localStorage.getItem('lm_user'))
user.membershipLevel = 'premium'
localStorage.setItem('lm_user', JSON.stringify(user))
location.reload()
```

### 重置每日使用次数
```javascript
localStorage.removeItem('lm_usage')
location.reload()
```

---

## 📱 移动端测试

### Chrome DevTools
1. F12打开开发者工具
2. 点击设备工具栏图标（Ctrl+Shift+M）
3. 选择设备：iPhone 12 Pro
4. 测试触摸交互

### 测试要点
- 底部导航是否固定
- 横向滚动是否流畅
- 表单输入是否友好
- 弹窗是否正确显示

---

## 🐛 常见问题

### Q: 页面显示空白
A: 检查控制台是否有JavaScript错误，可能是LocalStorage数据损坏
```javascript
localStorage.clear()
location.reload()
```

### Q: API请求失败
A: 当前后端API可能未运行，前端使用mock数据，这是正常的

### Q: 登录后没有跳转
A: 检查控制台是否有路由错误，确认React Router正常工作

### Q: 样式显示异常
A: 清除浏览器缓存，硬刷新（Ctrl+Shift+R）

---

## ✅ 测试检查清单

### 功能完整性
- [ ] 所有页面可访问
- [ ] 底部导航正常切换
- [ ] 登录/登出正常
- [ ] 自选股增删正常
- [ ] 持仓增删正常
- [ ] 会员升级流程正常

### 数据准确性
- [ ] 持仓收益计算正确
- [ ] 每日使用次数正确
- [ ] LocalStorage持久化正常

### UI/UX
- [ ] 无明显样式错误
- [ ] 移动端显示正常
- [ ] 动画流畅
- [ ] 响应及时

---

**开发服务器**: http://localhost:5177
**生产构建**: `npm run build`
**输出目录**: `dist/`
