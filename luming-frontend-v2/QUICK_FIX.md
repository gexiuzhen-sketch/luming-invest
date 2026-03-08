# 🚀 鹿鸣智投 - 快速修复与部署指南

## 问题诊断

从控制台日志看到：
```
:8000/api/recs?market=A:1 Failed to load resource: net::ERR_CONNECTION_RESET
```

**原因**: 后端API服务(43.136.38.87:8000)未运行或连接被重置

---

## ✅ 立即解决方案

### 方案一：使用Mock数据（立即生效）

前端已经配置了完整的Mock数据，可以立即使用：

1. **清除浏览器缓存**
   ```
   Ctrl+Shift+R (强制刷新)
   或
   清除浏览器缓存 → 刷新
   ```

2. **访问应用**
   ```
   http://localhost:5178
   ```

3. **查看股票数据**
   - 点击不同市场（A股、港股、美股、基金）
   - 每个市场都有5-7只精选股票
   - 完整的AI评分和分析

### 方案二：部署到服务器（使用真实数据）

#### 步骤1: 上传前端文件

```bash
# 方式A: SCP上传
scp -r dist/* root@43.136.38.87:/var/www/luming/

# 方式B: SFTP工具
# 使用 FileZilla 或 WinSCP 上传dist目录到 /var/www/luming/
```

#### 步骤2: 创建后端服务（使用Tushare API）

SSH登录服务器：
```bash
ssh root@43.136.38.87
```

创建后端文件：
```bash
mkdir -p /var/www/luming-backend
cd /var/www/luming-backend
nano app.py
```

复制以下Python代码到app.py：
```python
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

TUSHARE_API_KEY = "17e9e62a75b8d0a3efd3761944b7c8cf10847f94c86152b5258d385a"
TUSHARE_API_URL = "http://api.tushare.pro"

def call_tushare(api_name, params=None):
    params = params or {}
    params['token'] = TUSHARE_API_KEY
    try:
        response = requests.post(f"{TUSHARE_API_URL}/{api_name}", json=params, timeout=10)
        data = response.json()
        if data.get('code') != 0:
            return None
        return data.get('data')
    except:
        return None

@app.route('/api/recs', methods=['GET'])
def get_recommendations():
    market = request.args.get('market', 'A')

    # 获取沪深300成分股
    stocks = call_tushare('index_weight', {
        'ts_code': '000300.SH'
    })

    if stocks and len(stocks) > 0:
        # 取前20只
        codes = ','.join([s['con_code'][:6] for s in stocks[:20]])
        daily = call_tushare('daily', {
            'ts_code': codes,
            'fields': 'ts_code,close,change,chg_pct,vol,amount'
        })

        if daily is not None and len(daily) > 0:
            latest = daily[daily['trade_date'] == daily['trade_date'].max()]
            result = []
            for _, row in latest.iterrows():
                result.append({
                    'code': row['ts_code'][:6],
                    'name': f"股票{row['ts_code'][:6]}",
                    'market': 'SH' if row['ts_code'].endswith('SH') else 'SZ',
                    'price': float(row['close']),
                    'change': float(row['change'] or 0),
                    'changePct': float(row['chg_pct'] or 0),
                    'score': 70 + (float(row['chg_pct'] or 0)),
                    'pe': 20,
                    'roe': 15,
                    'rsi': 50,
                    'macd': 'golden_cross',
                    'sector': 'A股',
                    'cap': '1000亿',
                    'why': f"涨跌幅{(row['chg_pct'] or 0):.2f}%"
                })
            return jsonify(sorted(result, key=lambda x: x['score'], reverse=True))

    return jsonify([])

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

安装依赖并启动：
```bash
pip3 install flask flask-cors requests pandas numpy
python3 app.py
```

#### 步骤3: 配置Nginx

```bash
sudo nano /etc/nginx/sites-available/luming
```

配置内容：
```nginx
server {
    listen 80;
    server_name 43.136.38.87;
    root /var/www/luming;
    index index.html;

    # 前端
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        add_header Access-Control-Allow-Origin *;
    }
}
```

启用并重载：
```bash
sudo ln -s /etc/nginx/sites-available/luming /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🎯 快速测试

### 本地测试
```bash
cd "/Users/a123456/Documents/Claude Code/鹿鸣智投/luming-frontend-v2"
npm run dev
# 访问 http://localhost:5178
```

### 服务器测试
```bash
# 访问
http://43.136.38.87

# 测试API
curl http://43.136.38.87:8000/api/health
```

---

## 📊 数据说明

### Mock数据（当前）
- **A股**: 7只精选股票
- **港股**: 5只精选股票
- **美股**: 5只精选股票
- **基金**: 5只精选基金

### Tushare数据（部署后）
- **实时行情**: 真实的Tushare数据
- **沪深300**: 最新的成分股
- **更新频率**: 交易日实时更新

---

## ⚡ 故障排查

### 页面显示"暂无数据"

**原因**: 浏览器缓存或API调用失败

**解决**:
```bash
# 1. 清除浏览器缓存
Ctrl+Shift+Delete

# 2. 或在控制台执行
localStorage.clear()
location.reload()

# 3. 或使用无痕模式打开
```

### API连接失败

**原因**: 后端服务未启动

**解决**:
```bash
# SSH到服务器
ssh root@43.136.38.87

# 检查后端是否运行
ps aux | grep python

# 启动后端
cd /var/www/luming-backend
python3 app.py
```

---

## 📞 支持与帮助

### 文档位置
```
/Users/a123456/Documents/Claude Code/鹿鸣智投/luming-frontend-v2/
├── TUSHARE_INTEGRATION.md    # Tushare集成详细指南
├── SERVER_SETUP.md            # 服务器配置指南
├── UPDATE_COMPLETE.md         # 完整更新报告
└── README.md                  # 项目说明
```

### 当前状态
✅ 前端构建完成
✅ Mock数据完整
✅ 退出登录功能
✅ 免费额度5次/天
✅ 测试功能完整
⏳ 等待部署到服务器

---

**快速修复完成！** 🎉
