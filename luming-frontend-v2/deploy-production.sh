#!/bin/bash
# 鹿鸣智投 - 生产环境一键部署脚本
# 使用方法: ./deploy-production.sh

SERVER="43.136.38.87"
FRONTEND_PATH="/var/www/luming"
BACKEND_PATH="/opt/luming/backend"

echo "========================================="
echo "   鹿鸣智投 - 生产环境部署"
echo "========================================="
echo ""

# 检查构建文件
if [ ! -d "dist" ]; then
    echo "❌ 错误: dist 目录不存在，请先运行 npm run build"
    exit 1
fi

echo "✅ 第一步: 上传前端文件"
echo "-----------------------------------------"
echo "正在上传到 ${SERVER}:${FRONTEND_PATH}/"
scp -r dist/* root@${SERVER}:${FRONTEND_PATH}/
if [ $? -eq 0 ]; then
    echo "✅ 前端文件上传成功"
else
    echo "❌ 前端文件上传失败"
    exit 1
fi
echo ""

echo "✅ 第二步: 设置文件权限"
echo "-----------------------------------------"
ssh root@${SERVER} "chown -R www-data:www-data ${FRONTEND_PATH} && chmod -R 755 ${FRONTEND_PATH}"
echo "✅ 权限设置完成"
echo ""

echo "✅ 第三步: 部署后端服务"
echo "-----------------------------------------"
echo "创建后端目录..."
ssh root@${SERVER} "mkdir -p ${BACKEND_PATH}"

echo "上传后端代码..."
scp backend/app.py root@${SERVER}:${BACKEND_PATH}/

echo "安装 Python 依赖..."
ssh root@${SERVER} "pip3 install flask flask-cors requests 2>/dev/null || true"

echo "✅ 后端文件上传完成"
echo ""

echo "✅ 第四步: 配置 systemd 服务"
echo "-----------------------------------------"
ssh root@${SERVER} 'cat > /etc/systemd/system/luming-backend.service << EOF
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

echo "✅ systemd 服务配置完成"
echo ""

echo "✅ 第五步: 启动后端服务"
echo "-----------------------------------------"
ssh root@${SERVER} "systemctl daemon-reload && systemctl stop luming-backend 2>/dev/null; systemctl start luming-backend && systemctl enable luming-backend"
echo "✅ 后端服务已启动"
echo ""

echo "✅ 第六步: 配置 Nginx"
echo "-----------------------------------------"
ssh root@${SERVER} 'cat > /etc/nginx/sites-available/luming << EOF
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

echo "启用 Nginx 配置..."
ssh root@${SERVER} "ln -sf /etc/nginx/sites-available/luming /etc/nginx/sites-enabled/ 2>/dev/null; nginx -t && systemctl reload nginx"
echo "✅ Nginx 配置完成"
echo ""

echo "✅ 第七步: 验证部署"
echo "-----------------------------------------"
echo "检查服务状态..."
ssh root@${SERVER} "echo '=== Nginx 状态 ===' && systemctl status nginx --no-pager | head -3"
ssh root@${SERVER} "echo '=== 后端服务状态 ===' && systemctl status luming-backend --no-pager | head -3"
echo ""

echo "测试 API..."
ssh root@${SERVER} "curl -s http://localhost:8000/api/health | head -100"
echo ""

echo "========================================="
echo "   ✅ 部署完成！"
echo "========================================="
echo ""
echo "🌐 访问地址: http://${SERVER}"
echo ""
echo "📊 后端已集成 Tushare API，使用真实股票数据"
echo ""
echo "🔧 管理命令:"
echo "  查看后端日志: ssh root@${SERVER} 'journalctl -u luming-backend -f'"
echo "  查看Nginx日志: ssh root@${SERVER} 'tail -f /var/log/nginx/access.log'"
echo "  重启服务: ssh root@${SERVER} 'systemctl restart luming-backend && systemctl reload nginx'"
echo ""
