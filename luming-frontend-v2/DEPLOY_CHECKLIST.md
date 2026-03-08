# 鹿鸣智投 - 部署前检查清单

## ✅ 构建状态

- 前端构建: **成功** ✅
- 构建大小: 308.36 KB (gzip: 94.41 KB)
- 构建时间: 1.16s
- 构建目录: `dist/`

---

## 📁 文件清单

### 前端文件 (需上传到 `/var/www/luming/`)

```
dist/
├── index.html                    (0.49 kB)
├── assets/
│   ├── index-DBxhu0Sm.css        (0.39 kB)
│   └── index-IQgChAnE.js         (308.36 kB)
```

### 后端文件 (需上传到 `/opt/luming/backend/`)

```
backend/
└── app.py                        (Flask 后端服务)
```

---

## 🔧 配置检查

### 前端配置

| 配置项 | 值 | 状态 |
|--------|-----|------|
| API Base URL | `/api` | ✅ 正确 |
| 构建模式 | Production | ✅ 正确 |
| 静态资源 | Hashed 命名 | ✅ 正确 |

### 后端配置

| 配置项 | 值 | 状态 |
|--------|-----|------|
| 监听端口 | 8000 | ✅ 正确 |
| 监听地址 | 0.0.0.0 | ✅ 正确 |
| Tushare API Key | 已配置 | ✅ 正确 |
| CORS | 已启用 | ✅ 正确 |

---

## 🚀 快速部署步骤

### 方式一：使用 SCP 命令部署

```bash
# ===== 第一步：前端部署 =====

# 1. 上传前端文件
scp -r dist/* root@43.136.38.87:/var/www/luming/

# 2. 设置权限
ssh root@43.136.38.87 "chown -R www-data:www-data /var/www/luming && chmod -R 755 /var/www/luming"

# ===== 第二步：后端部署 =====

# 3. 创建后端目录
ssh root@43.136.38.87 "mkdir -p /opt/luming/backend"

# 4. 上传后端文件
scp backend/app.py root@43.136.38.87:/opt/luming/backend/

# 5. 安装 Python 依赖（首次需要）
ssh root@43.136.38.87 "pip3 install flask flask-cors requests"

# 6. 测试启动后端
ssh root@43.136.38.87 "cd /opt/luming/backend && python3 app.py"

# 看到 "Running on http://0.0.0.0:8000" 表示启动成功
# 按 Ctrl+C 停止，然后继续配置 systemd

# ===== 第三步：配置 systemd 服务 =====

# 7. 创建 systemd 服务文件
ssh root@43.136.38.87 'cat > /etc/systemd/system/luming-backend.service << EOF
[Unit]
Description=鹿鸣智投后端API服务
After=network.target

[Service]
User=root
WorkingDirectory=/opt/luming/backend
ExecStart=/usr/bin/python3 /opt/luming/backend/app.py
Restart=always
RestartSec=10
Environment=FLASK_ENV=production

[Install]
WantedBy=multi-user.target
EOF'

# 8. 启动后端服务
ssh root@43.136.38.87 "systemctl daemon-reload && systemctl start luming-backend && systemctl enable luming-backend"

# ===== 第四步：配置 Nginx =====

# 9. 创建 Nginx 配置
ssh root@43.136.38.87 'cat > /etc/nginx/sites-available/luming << EOF
server {
    listen 80;
    server_name 43.136.38.87;

    location / {
        root /var/www/luming;
        try_files \$uri \$uri/ /index.html;
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";

        if (\$request_method = OPTIONS) {
            return 204;
        }
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json;
}
EOF'

# 10. 启用 Nginx 配置
ssh root@43.136.38.87 "ln -sf /etc/nginx/sites-available/luming /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx"

# ===== 第五步：验证部署 =====

# 11. 检查服务状态
ssh root@43.136.38.87 "systemctl status nginx | head -3"
ssh root@43.136.38.87 "systemctl status luming-backend | head -3"

# 12. 测试 API
curl http://43.136.38.87/api/health

# 应该返回: {"status":"ok","service":"luming-api","version":"1.0.0","timestamp":"..."}

# 13. 浏览器访问
# 打开浏览器访问: http://43.136.38.87
```

### 方式二：使用部署脚本

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

---

## 🔍 验证部署

### 1. 检查服务状态

```bash
# SSH 登录服务器
ssh root@43.136.38.87

# 检查 Nginx
systemctl status nginx

# 检查后端服务
systemctl status luming-backend

# 检查端口监听
netstat -tlnp | grep -E ':(80|8000)'
```

### 2. 浏览器测试

访问: http://43.136.38.87

**期望结果**:
- 看到鹿鸣智投首页
- 可以切换市场（沪深/港股/美股/基金）
- 可以查看股票详情

### 3. API 测试

```bash
# 健康检查
curl http://43.136.38.87/api/health

# A股推荐
curl http://43.136.38.87/api/recs?market=A

# 港股推荐
curl http://43.136.38.87/api/recs?market=HK
```

---

## 📋 功能检查清单

### 核心功能

- [ ] 首页显示股票推荐列表
- [ ] 市场切换（沪深/港股/美股/基金）正常
- [ ] 点击股票显示详情弹窗
- [ ] 详情页显示评分和推荐理由
- [ ] 可以添加自选股（需登录）
- [ ] 可以添加持仓（需登录）
- [ ] 会员页面正常显示

### 用户系统

- [ ] 未登录状态访问受限功能显示登录弹窗
- [ ] 登录功能正常（开发模式：任意验证码）
- [ ] 退出登录功能正常

### 会员功能

- [ ] 免费用户每日 5 次查看限制
- [ ] 测试功能页面可重置次数
- [ ] 升级会员功能正常

---

## 🆘 故障排查

### 问题 1: 网站无法访问

**检查**:
```bash
# Nginx 是否运行
systemctl status nginx

# 端口是否监听
netstat -tlnp | grep :80

# 文件是否存在
ls -la /var/www/luming/
```

**解决**:
```bash
# 启动 Nginx
systemctl start nginx

# 检查配置
nginx -t

# 重载配置
systemctl reload nginx
```

### 问题 2: API 返回 502

**检查**:
```bash
# 后端服务是否运行
systemctl status luming-backend

# 查看后端日志
journalctl -u luming-backend -n 50
```

**解决**:
```bash
# 启动后端服务
systemctl start luming-backend

# 或手动启动测试
cd /opt/luming/backend
python3 app.py
```

### 问题 3: 数据不显示

**检查**:
```bash
# 测试后端 API
curl http://localhost:8000/api/health
curl http://localhost:8000/api/recs?market=A
```

**检查浏览器控制台**:
- F12 打开开发者工具
- 查看 Console 选项卡
- 查看 Network 选项卡

---

## 📊 部署信息汇总

| 项目 | 值 |
|------|-----|
| 服务器 IP | 43.136.38.87 |
| 前端路径 | /var/www/luming |
| 后端路径 | /opt/luming/backend |
| 前端端口 | 80 |
| 后端端口 | 8000 |
| 访问地址 | http://43.136.38.87 |

---

## 🎯 下一步

部署完成后：

1. **配置 HTTPS** (可选但推荐)
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d 43.136.38.87
   ```

2. **配置短信服务** (需要腾讯云账号)
   - 申请腾讯云短信服务
   - 获取 SecretId, SecretKey, AppId, TemplateId
   - 更新后端环境变量

3. **配置支付服务** (需要企业资质)
   - 申请微信支付商户号
   - 申请支付宝开放平台
   - 更新后端配置

---

**部署准备完成！可以开始部署了。**
