#!/bin/bash
# 鹿鸣智投 - 自动部署脚本（使用 ubuntu 用户 + sudo）
# 使用方法: ./deploy-auto.sh

set -e

SERVER="luming"  # 使用 SSH 配置中的主机名
FRONTEND_PATH="/var/www/luming"
BACKEND_PATH="/opt/luming/backend"

echo "========================================="
echo "   鹿鸣智投 - 生产环境自动部署"
echo "   服务器: 43.136.38.87 (ubuntu 用户)"
echo "========================================="
echo ""

# 检查构建文件
if [ ! -d "dist" ]; then
    echo "❌ 错误: dist 目录不存在，正在构建..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ 构建失败"
        exit 1
    fi
fi

echo "✅ 第一步: 上传前端文件"
echo "-----------------------------------------"
echo "正在上传到 ${SERVER}:${FRONTEND_PATH}/"
scp -r dist/* ${SERVER}:${FRONTEND_PATH}/
if [ $? -eq 0 ]; then
    echo "✅ 前端文件上传成功"
else
    echo "❌ 前端文件上传失败"
    exit 1
fi
echo ""

echo "✅ 第二步: 设置文件权限"
echo "-----------------------------------------"
ssh ${SERVER} "sudo chown -R www-data:www-data ${FRONTEND_PATH} && sudo chmod -R 755 ${FRONTEND_PATH}"
echo "✅ 权限设置完成"
echo ""

echo "✅ 第三步: 部署后端服务"
echo "-----------------------------------------"
echo "创建后端目录..."
ssh ${SERVER} "sudo mkdir -p ${BACKEND_PATH}"

echo "上传后端代码..."
scp backend/app.py ${SERVER}:${BACKEND_PATH}/

echo "安装 Python 依赖..."
ssh ${SERVER} "sudo pip3 install flask flask-cors requests 2>/dev/null || true"

echo "✅ 后端文件上传完成"
echo ""

echo "✅ 第四步: 配置 systemd 服务"
echo "-----------------------------------------"
ssh ${SERVER} 'sudo bash -c "cat > /etc/systemd/system/luming-backend.service << EOF
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
EOF"'

echo "✅ systemd 服务配置完成"
echo ""

echo "✅ 第五步: 启动后端服务"
echo "-----------------------------------------"
ssh ${SERVER} "sudo systemctl daemon-reload && sudo systemctl stop luming-backend 2>/dev/null; sudo systemctl start luming-backend && sudo systemctl enable luming-backend"
echo "✅ 后端服务已启动"
echo ""

echo "✅ 第六步: 配置 Nginx"
echo "-----------------------------------------"
ssh ${SERVER} 'sudo bash -c "cat > /etc/nginx/sites-available/luming << EOF
server {
    listen 80;
    server_name 43.136.38.87;

    location / {
        root /var/www/luming;
        try_files \\\$uri \\\$uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;

        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods \"GET, POST, OPTIONS\";
        add_header Access-Control-Allow-Headers \"Content-Type, Authorization\";

        if (\\\$request_method = OPTIONS) {
            return 204;
        }
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json;
}
EOF"'

echo "启用 Nginx 配置..."
ssh ${SERVER} "sudo ln -sf /etc/nginx/sites-available/luming /etc/nginx/sites-enabled/ 2>/dev/null; sudo nginx -t && sudo systemctl reload nginx"
echo "✅ Nginx 配置完成"
echo ""

echo "✅ 第七步: 验证部署"
echo "-----------------------------------------"
echo "检查服务状态..."
ssh ${SERVER} "echo '=== Nginx 状态 ===' && sudo systemctl status nginx --no-pager | head -3"
ssh ${SERVER} "echo '=== 后端服务状态 ===' && sudo systemctl status luming-backend --no-pager | head -3"
echo ""

echo "测试 API..."
ssh ${SERVER} "curl -s http://localhost:8000/api/health"
echo ""
echo ""

echo "========================================="
echo "   ✅ 部署完成！"
echo "========================================="
echo ""
echo "🌐 访问地址: http://43.136.38.87"
echo ""
echo "📊 后端已集成 Tushare API，使用真实股票数据"
echo ""
echo "🔧 管理命令:"
echo "  查看后端日志: ssh ${SERVER} 'sudo journalctl -u luming-backend -f'"
echo "  查看Nginx日志: ssh ${SERVER} 'sudo tail -f /var/log/nginx/access.log'"
echo "  重启服务: ssh ${SERVER} 'sudo systemctl restart luming-backend && sudo systemctl reload nginx'"
echo ""
