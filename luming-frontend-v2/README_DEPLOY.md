# 鹿鸣智投 - 部署总结

## 📦 部署准备状态

### ✅ 已完成

| 项目 | 状态 | 说明 |
|------|------|------|
| 前端构建 | ✅ | dist/ 目录已生成，308 KB |
| 后端代码 | ✅ | backend/app.py 已准备 |
| Nginx 配置 | ✅ | 配置文件已准备 |
| 部署脚本 | ✅ | deploy.sh 已准备 |
| 部署文档 | ✅ | 4份文档已准备 |

### 📄 文档清单

| 文档 | 用途 |
|------|------|
| `DEPLOY_GUIDE.md` | 完整部署指南（详细版） |
| `DEPLOY_QUICK.md` | 快速部署参考（命令版） |
| `DEPLOY_CHECKLIST.md` | 部署检查清单 |
| `SERVER_SETUP.md` | Nginx 配置详解 |

---

## 🚀 快速开始

### 最简单的方式（推荐新手）

```bash
# 1. 进入项目目录
cd /Users/a123456/Documents/Claude\ Code/鹿鸣智投/luming-frontend-v2

# 2. 给脚本执行权限
chmod +x deploy.sh

# 3. 执行部署
./deploy.sh
```

### 手动方式（推荐有经验用户）

```bash
# 第一步：上传前端
scp -r dist/* root@43.136.38.87:/var/www/luming/

# 第二步：上传后端
scp backend/app.py root@43.136.38.87:/opt/luming/backend/

# 第三步：配置 Nginx（详见 DEPLOY_QUICK.md）
ssh root@43.136.38.87 "cat > /etc/nginx/sites-available/luming << 'EOF'
# ... 粘贴 Nginx 配置 ...
EOF"

# 第四步：启动服务
ssh root@43.136.38.87 "systemctl reload nginx && systemctl start luming-backend"
```

---

## 📋 完整部署步骤（复制粘贴即可）

### 第一步：前端部署

```bash
# 上传前端文件
scp -r dist/* root@43.136.38.87:/var/www/luming/

# 设置权限
ssh root@43.136.38.87 "chown -R www-data:www-data /var/www/luming && chmod -R 755 /var/www/luming"
```

### 第二步：后端部署

```bash
# 创建目录并上传后端
ssh root@43.136.38.87 "mkdir -p /opt/luming/backend"
scp backend/app.py root@43.136.38.87:/opt/luming/backend/

# 安装 Python 依赖（首次需要）
ssh root@43.136.38.87 "pip3 install flask flask-cors requests"

# 创建 systemd 服务
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

# 启动服务
ssh root@43.136.38.87 "systemctl daemon-reload && systemctl start luming-backend && systemctl enable luming-backend"
```

### 第三步：Nginx 配置

```bash
# 创建 Nginx 配置文件
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

# 启用配置
ssh root@43.136.38.87 "ln -sf /etc/nginx/sites-available/luming /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx"
```

### 第四步：验证部署

```bash
# 检查服务状态
ssh root@43.136.38.87 "systemctl status nginx | head -3"
ssh root@43.136.38.87 "systemctl status luming-backend | head -3"

# 测试 API
curl http://43.136.38.87/api/health
```

---

## 🎯 验证部署结果

### 1. 浏览器访问

```
http://43.136.38.87
```

### 2. 功能检查

- [ ] 首页显示股票推荐
- [ ] 市场切换正常（沪深/港股/美股/基金）
- [ ] 点击股票显示详情
- [ ] 详情页显示评分和分析
- [ ] 登录功能正常
- [ ] 自选股功能正常
- [ ] 持仓功能正常
- [ ] 会员功能正常

---

## 📊 系统信息

| 项目 | 值 |
|------|-----|
| 服务器 IP | 43.136.38.87 |
| 访问地址 | http://43.136.38.87 |
| 前端路径 | /var/www/luming |
| 后端路径 | /opt/luming/backend |
| 前端端口 | 80 (Nginx) |
| 后端端口 | 8000 (Flask) |

---

## 📝 Tushare API 信息

```
API Key: 17e9e62a75b8d0a3efd3761944b7c8cf10847f94c86152b5258d385a
```

---

## 🔧 维护命令

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
scp backend/app.py root@43.136.38.87:/opt/luming/backend/ && \
ssh root@43.136.38.87 "systemctl restart luming-backend"
```

---

## 🆘 常见问题

### 问题 1: SSH 连接需要密码

解决：使用 `ssh-copy-id` 配置免密登录

```bash
ssh-copy-id root@43.136.38.87
```

### 问题 2: 502 Bad Gateway

检查后端服务是否运行：

```bash
ssh root@43.136.38.87 "systemctl status luming-backend"
```

### 问题 3: 静态资源 404

检查文件路径和权限：

```bash
ssh root@43.136.38.87 "ls -la /var/www/luming/"
```

---

## 📖 参考文档

- `DEPLOY_GUIDE.md` - 完整部署指南
- `DEPLOY_QUICK.md` - 快速部署命令
- `DEPLOY_CHECKLIST.md` - 部署检查清单
- `SERVER_SETUP.md` - Nginx 配置详解
- `SMS_INTEGRATION.md` - 短信服务集成
- `PAYMENT_INTEGRATION.md` - 支付服务集成

---

## 🎉 部署完成后

1. **访问应用**: http://43.136.38.87
2. **配置 HTTPS**（推荐）: `sudo certbot --nginx -d 43.136.38.87`
3. **配置短信服务**: 参见 `SMS_INTEGRATION.md`
4. **配置支付服务**: 参见 `PAYMENT_INTEGRATION.md`

---

**准备就绪！可以开始部署了。** 🚀
