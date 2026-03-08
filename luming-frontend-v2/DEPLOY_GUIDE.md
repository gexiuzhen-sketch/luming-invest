# 鹿鸣智投 - 完整部署指南

## 服务器信息
- **IP**: 43.136.38.87
- **前端路径**: /var/www/luming
- **后端路径**: /opt/luming/backend

---

## 📦 部署架构

```
┌─────────────────────────────────────────┐
│         Nginx (端口 80/443)             │
│  ┌──────────────┬──────────────────┐   │
│  │   静态文件    │   API 反向代理    │   │
│  │  /var/www/   │  localhost:8000  │   │
│  │   luming/    │                  │   │
│  └──────────────┴──────────────────┘   │
└─────────────────────────────────────────┘
           │                    │
    前端 (React)        后端 (Flask Python)
```

---

## 一、前端部署步骤

### 1.1 本地构建（已完成）

```bash
cd /Users/a123456/Documents/Claude\ Code/鹿鸣智投/luming-frontend-v2
npm run build
```

构建结果：
- `dist/` 目录已生成
- 文件大小: 308.36 KB (gzip: 94.41 KB)

### 1.2 上传到服务器

**方法一：使用 SCP 命令**

```bash
# 上传前端文件
scp -r dist/* root@43.136.38.87:/var/www/luming/

# 如果需要输入密码，请输入服务器root密码
```

**方法二：使用 SFTP 客户端**

推荐使用 FileZilla、WinSCP 或 Cyberduck：
- 主机: 43.136.38.87
- 用户名: root
- 协议: SFTP
- 端口: 22

将 `dist/` 目录下的所有文件上传到 `/var/www/luming/`

**方法三：使用部署脚本**

```bash
chmod +x deploy.sh
./deploy.sh
```

### 1.3 设置文件权限

```bash
# SSH 登录服务器
ssh root@43.136.38.87

# 设置权限
sudo chown -R www-data:www-data /var/www/luming
sudo chmod -R 755 /var/www/luming
```

---

## 二、后端部署步骤

### 2.1 准备 Python 环境

```bash
# SSH 登录服务器
ssh root@43.136.38.87

# 安装 Python 3 和 pip
sudo apt update
sudo apt install python3 python3-pip -y

# 安装依赖
pip3 install flask flask-cors requests
```

### 2.2 上传后端代码

**方法一：使用 SCP**

```bash
# 本地执行
scp backend/app.py root@43.136.38.87:/opt/luming/backend/
```

**方法二：手动创建**

```bash
# SSH 登录服务器
ssh root@43.136.38.87

# 创建目录
sudo mkdir -p /opt/luming/backend

# 创建 app.py 文件
sudo nano /opt/luming/backend/app.py

# 将 backend/app.py 的内容粘贴进去
# 保存: Ctrl+O, 回车, Ctrl+X
```

### 2.3 配置环境变量（可选）

```bash
# 创建环境变量文件
sudo nano /opt/luming/backend/.env

# 添加以下内容（使用腾讯云短信和支付时填写）
TENCENT_SMS_SECRET_ID=your_secret_id
TENCENT_SMS_SECRET_KEY=your_secret_key
TENCENT_SMS_APP_ID=your_app_id
TENCENT_SMS_TEMPLATE_ID=your_template_id

WECHAT_PAY_APPID=your_wechat_appid
WECHAT_PAY_MCH_ID=your_mch_id
WECHAT_PAY_API_KEY=your_api_key

ALIPAY_APPID=your_alipay_appid
```

### 2.4 启动后端服务

**方法一：直接运行（测试用）**

```bash
cd /opt/luming/backend
python3 app.py
```

服务会运行在 http://localhost:8000

**方法二：使用 systemd（生产推荐）**

```bash
# 创建 systemd 服务文件
sudo nano /etc/systemd/system/luming-backend.service
```

添加以下内容：

```ini
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
```

启动服务：

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start luming-backend

# 设置开机自启
sudo systemctl enable luming-backend

# 查看状态
sudo systemctl status luming-backend
```

### 2.5 验证后端服务

```bash
# 测试健康检查
curl http://localhost:8000/api/health

# 应该返回：
# {"status":"ok","service":"luming-api","version":"1.0.0","timestamp":"..."}
```

---

## 三、Nginx 配置

### 3.1 创建 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/luming
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name 43.136.38.87;

    # 前端静态文件
    location / {
        root /var/www/luming;
        try_files $uri $uri/ /index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # HTML文件不缓存
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # API代理到后端
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS支持
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type, Authorization';

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

### 3.2 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/luming /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 四、防火墙配置

### 4.1 开放必要端口

```bash
# Ubuntu (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw reload

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

---

## 五、验证部署

### 5.1 检查服务状态

```bash
# 检查 Nginx
sudo systemctl status nginx

# 检查后端服务
sudo systemctl status luming-backend

# 查看端口监听
sudo netstat -tlnp | grep -E ':(80|8000)'
```

### 5.2 浏览器访问

```
http://43.136.38.87
```

应该看到鹿鸣智投首页。

### 5.3 API 测试

```bash
# 测试股票推荐API
curl http://43.136.38.87/api/recs?market=A

# 测试健康检查
curl http://43.136.38.87/api/health
```

---

## 六、查看日志

### 6.1 Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 6.2 后端日志

```bash
# systemd 服务日志
sudo journalctl -u luming-backend -f

# 或者查看后端输出
sudo systemctl status luming-backend
```

---

## 七、故障排查

### 7.1 无法访问网站

```bash
# 检查 Nginx 是否运行
sudo systemctl status nginx

# 检查端口是否监听
sudo netstat -tlnp | grep :80

# 检查防火墙
sudo ufw status
```

### 7.2 502 Bad Gateway

- 检查后端API是否运行: `sudo systemctl status luming-backend`
- 检查端口8000是否监听: `sudo netstat -tlnp | grep :8000`
- 检查 API 代理配置

### 7.3 静态资源 404

- 检查文件路径: `ls -la /var/www/luming/`
- 检查 Nginx root 配置
- 检查文件权限: `ls -l /var/www/luming/`

---

## 八、更新部署

### 8.1 更新前端

```bash
# 本地重新构建
npm run build

# 上传到服务器
scp -r dist/* root@43.136.38.87:/var/www/luming/

# 清除浏览器缓存访问
```

### 8.2 更新后端

```bash
# 上传新的 app.py
scp backend/app.py root@43.136.38.87:/opt/luming/backend/

# 重启后端服务
sudo systemctl restart luming-backend
```

---

## 九、HTTPS 配置（推荐）

### 9.1 安装 Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 9.2 获取 SSL 证书

```bash
sudo certbot --nginx -d 43.136.38.87
```

### 9.3 自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# certbot 会自动配置续期任务
```

---

## 十、部署检查清单

- [ ] 前端构建完成
- [ ] 前端文件上传到服务器
- [ ] 文件权限设置正确
- [ ] Python 环境安装
- [ ] 后端代码上传
- [ ] 后端服务启动
- [ ] Nginx 配置完成
- [ ] 防火墙端口开放
- [ ] 浏览器可访问
- [ ] API 接口正常
- [ ] 日志输出正常

---

## 十一、关键信息汇总

### Tushare API
- **API Key**: `17e9e62a75b8d0a3efd3761944b7c8cf10847f94c86152b5258d385a`
- **状态**: 已集成到后端
- **用途**: 获取实时股票数据

### 腾讯云短信
- **状态**: 代码已集成，等待申请完成
- **配置位置**: `/opt/luming/backend/.env`

### 微信支付
- **费率**: 0.6%
- **结算**: T+1
- **状态**: 代码已集成，等待商户申请

### 支付宝
- **费率**: 0.6%
- **结算**: T+1
- **状态**: 代码已集成，等待申请

---

**部署完成后访问**: http://43.136.38.87

如有问题，请检查日志文件或联系技术支持。
