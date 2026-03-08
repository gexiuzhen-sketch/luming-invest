# 鹿鸣智投前端 - 服务器配置指南

## 服务器信息
- **IP**: 43.136.38.87
- **系统**: Linux (Ubuntu/CentOS)
- **Web服务器**: Nginx

## 1. 服务器准备

### 安装Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 创建网站目录
```bash
sudo mkdir -p /var/www/luming
sudo chown -R $USER:$USER /var/www/luming
```

## 2. Nginx配置

### 创建配置文件
```bash
sudo nano /etc/nginx/sites-available/luming
```

### 配置内容
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

### 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/luming /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

## 3. 部署步骤

### 方式一：使用部署脚本
```bash
# 1. 本地构建
npm run build

# 2. 执行部署脚本
chmod +x deploy.sh
./deploy.sh
```

### 方式二：手动部署
```bash
# 1. 本地构建
npm run build

# 2. 上传到服务器
scp -r dist/* root@43.136.38.87:/var/www/luming/

# 3. 设置权限
ssh root@43.136.38.87 "chown -R www-data:www-data /var/www/luming"
```

## 4. 防火墙配置

### Ubuntu (UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### CentOS (firewalld)
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### iptables
```bash
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo service iptables save
```

## 5. 验证部署

### 检查Nginx状态
```bash
sudo systemctl status nginx
```

### 查看Nginx日志
```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 浏览器访问
```
http://43.136.38.87
```

## 6. HTTPS配置（可选）

### 安装Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 获取SSL证书
```bash
sudo certbot --nginx -d 43.136.38.87
```

### 自动续期
```bash
sudo certbot renew --dry-run
```

## 7. 性能优化

### 启用HTTP/2
```nginx
server {
    listen 443 ssl http2;
    # ... SSL配置
}
```

### 缓存策略
已在Nginx配置中包含静态资源缓存。

### CDN（可选）
可以将静态资源上传到CDN，加速访问。

## 8. 监控

### 设置日志轮转
```bash
sudo nano /etc/logrotate.d/nginx
```

内容：
```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

## 9. 故障排查

### 无法访问网站
```bash
# 检查Nginx是否运行
sudo systemctl status nginx

# 检查端口是否监听
sudo netstat -tlnp | grep :80

# 检查防火墙
sudo ufw status
```

### 502 Bad Gateway
- 检查后端API是否运行
- 检查API代理配置

### 静态资源404
- 检查文件路径
- 检查Nginx root配置
- 检查文件权限

## 10. 更新部署

### 后续更新
```bash
# 1. 本地重新构建
npm run build

# 2. 上传到服务器
scp -r dist/* root@43.136.38.87:/var/www/luming/

# 3. 清除浏览器缓存访问
```

---

**部署完成后访问**: http://43.136.38.87
