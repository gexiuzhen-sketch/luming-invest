#!/bin/bash
set -e

echo "========================================="
echo "   鹿鸣智投 - 一键部署到生产服务器"
echo "========================================="
echo ""

SERVER="43.136.38.87"

# 第一步：前端部署
echo "📦 [1/5] 构建前端..."
npm run build > /dev/null 2>&1
echo "✅ 构建完成"

echo "📤 [2/5] 上传前端文件..."
scp -r dist/* root@${SERVER}:/var/www/luming/
echo "✅ 前端上传完成"

echo "🔧 [3/5] 设置权限..."
ssh root@${SERVER} "chown -R www-data:www-data /var/www/luming && chmod -R 755 /var/www/luming"
echo "✅ 权限设置完成"

echo "🐍 [4/5] 部署后端服务..."
ssh root@${SERVER} "mkdir -p /opt/luming/backend"
scp backend/app.py root@${SERVER}:/opt/luming/backend/

ssh root@${SERVER} "cat > /etc/systemd/system/luming-backend.service << 'SYSEOF'
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
SYSEOF"

ssh root@${SERVER} "pip3 install flask flask-cors requests 2>/dev/null || true"
ssh root@${SERVER} "systemctl daemon-reload && systemctl restart luming-backend && systemctl enable luming-backend"
echo "✅ 后端部署完成"

echo "🌐 [5/5] 配置 Nginx..."
ssh root@${SERVER} 'cat > /etc/nginx/sites-available/luming << NGINXEOF
server {
    listen 80;
    server_name 43.136.38.87;

    location / {
        root /var/www/luming;
        try_files $uri $uri/ /index.html;
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header Access-Control-Allow-Origin *;
    }

    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/json;
}
NGINXEOF'

ssh root@${SERVER} "ln -sf /etc/nginx/sites-available/luming /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx"
echo "✅ Nginx 配置完成"

echo ""
echo "========================================="
echo "   ✅ 部署成功！"
echo "========================================="
echo ""
echo "🌐 访问地址: http://${SERVER}"
echo ""
echo "🔍 验证部署:"
echo "  curl http://${SERVER}/api/health"
echo "  curl http://${SERVER}/api/recs?market=A"
echo ""
echo "📊 后端已集成 Tushare API，使用真实股票数据"
echo ""
