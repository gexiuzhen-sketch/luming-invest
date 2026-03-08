# 鹿鸣智投 - 快速部署参考

## 🚀 一键部署命令（复制粘贴即可）

### 第一步：前端部署

```bash
# 1. 本地构建（已完成 ✅）
cd /Users/a123456/Documents/Claude\ Code/鹿鸣智投/luming-frontend-v2
npm run build

# 2. 上传到服务器
scp -r dist/* root@43.136.38.87:/var/www/luming/

# 3. 设置权限
ssh root@43.136.38.87 "chown -R www-data:www-data /var/www/luming"
```

### 第二步：后端部署

```bash
# 1. 上传后端代码
scp backend/app.py root@43.136.38.87:/opt/luming/backend/

# 2. 安装Python依赖（首次需要）
ssh root@43.136.38.87 "apt install python3-pip -y && pip3 install flask flask-cors requests"

# 3. 创建systemd服务
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

# 4. 启动服务
ssh root@43.136.38.87 "systemctl daemon-reload && systemctl start luming-backend && systemctl enable luming-backend"
```

### 第三步：Nginx配置

```bash
# 1. 创建配置文件
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

# 2. 启用配置
ssh root@43.136.38.87 "ln -sf /etc/nginx/sites-available/luming /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx"
```

### 第四步：验证部署

```bash
# 检查服务状态
ssh root@43.136.38.87 "systemctl status nginx | head -3"
ssh root@43.136.38.87 "systemctl status luming-backend | head -3"

# 测试API
curl http://43.136.38.87/api/health
curl http://43.136.38.87/api/recs?market=A
```

---

## 📋 部署检查清单

- [ ] 前端文件已上传到 `/var/www/luming/`
- [ ] 后端文件已上传到 `/opt/luming/backend/app.py`
- [ ] 后端服务已启动 (`systemctl status luming-backend`)
- [ ] Nginx 配置已启用 (`nginx -t` 通过)
- [ ] 防火墙已开放端口 80 和 443
- [ ] 浏览器访问 http://43.136.38.87 正常

---

## 🔧 常用维护命令

### 查看日志

```bash
# Nginx 访问日志
ssh root@43.136.38.87 "tail -f /var/log/nginx/access.log"

# Nginx 错误日志
ssh root@43.136.38.87 "tail -f /var/log/nginx/error.log"

# 后端服务日志
ssh root@43.136.38.87 "journalctl -u luming-backend -f"
```

### 重启服务

```bash
# 重启 Nginx
ssh root@43.136.38.87 "systemctl reload nginx"

# 重启后端
ssh root@43.136.38.87 "systemctl restart luming-backend"

# 重启所有
ssh root@43.136.38.87 "systemctl reload nginx && systemctl restart luming-backend"
```

### 更新部署

```bash
# 更新前端
npm run build && scp -r dist/* root@43.136.38.87:/var/www/luming/

# 更新后端
scp backend/app.py root@43.136.38.87:/opt/luming/backend/ && ssh root@43.136.38.87 "systemctl restart luming-backend"
```

---

## 📊 服务信息

| 服务 | 地址 | 端口 | 状态命令 |
|------|------|------|----------|
| 前端 | http://43.136.38.87 | 80 | `systemctl status nginx` |
| 后端 | http://localhost:8000 | 8000 | `systemctl status luming-backend` |

---

## 🔑 关键配置

### Tushare API Key
```
17e9e62a75b8d0a3efd3761944b7c8cf10847f94c86152b5258d385a
```

### 环境变量（可选，后端功能需要时配置）
```bash
# 腾讯云短信
TENCENT_SMS_SECRET_ID=xxx
TENCENT_SMS_SECRET_KEY=xxx
TENCENT_SMS_APP_ID=xxx
TENCENT_SMS_TEMPLATE_ID=xxx

# 微信支付
WECHAT_PAY_APPID=xxx
WECHAT_PAY_MCH_ID=xxx
WECHAT_PAY_API_KEY=xxx

# 支付宝
ALIPAY_APPID=xxx
```

---

## 🆘 故障排查

### 网站无法访问
```bash
# 检查 Nginx
ssh root@43.136.38.87 "systemctl status nginx"

# 检查端口
ssh root@43.136.38.87 "netstat -tlnp | grep :80"
```

### API 返回 502
```bash
# 检查后端服务
ssh root@43.136.38.87 "systemctl status luming-backend"

# 查看后端日志
ssh root@43.136.38.87 "journalctl -u luming-backend -n 50"
```

### 数据不显示
```bash
# 测试后端API
curl http://43.136.38.87/api/health
curl http://43.136.38.87/api/recs?market=A
```

---

**快速访问**: http://43.136.38.87
