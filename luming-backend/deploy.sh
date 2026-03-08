#!/bin/bash
# 后端服务部署脚本

set -e

echo "========================================="
echo "   鹿鸣智投后端服务部署"
echo "========================================="
echo ""

# 服务器信息
SERVER="ubuntu@43.136.38.87"
KEY="~/.ssh/id_ed25519_deploy"
REMOTE_DIR="/opt/luming/backend"
DOMAIN="lumingzt.cn"    # 已备案的域名

# 1. 上传代码
echo "📦 [1/5] 上传后端代码..."
rsync -avz -e "ssh -i $KEY" --exclude='__pycache__' --exclude='*.pyc' --exclude='.env' \
  /Users/a123456/Documents/Claude\ Code/鹿鸣智投/luming-backend/ \
  $SERVER:$REMOTE_DIR/

echo "✅ 代码上传完成"

# 2. 安装Python依赖
echo "📦 [2/5] 安装Python依赖..."
ssh -i $KEY $SERVER << 'ENDSSH'
cd /opt/luming/backend

# 创建虚拟环境
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "✅ 依赖安装完成"
ENDSSH

# 3. 创建数据库表
echo "📦 [3/5] 初始化数据库..."
ssh -i $KEY $SERVER << 'ENDSSH'
cd /opt/luming/backend
source venv/bin/activate
export PYTHONPATH=/opt/luming/backend:$PYTHONPATH
python init_db.py
ENDSSH

# 4. 配置Nginx
echo "📦 [4/5] 配置Nginx..."
ssh -i $KEY $SERVER << ENDSSH
# 创建 luming-backend 内部路由片段（由主站 include）
sudo tee /etc/nginx/snippets/luming-user-data.conf << 'SNIPPET'
    # 用户数据同步 API（路由到 luming-backend 服务 port 8000）
    location /api/user-data/ {
        proxy_pass http://127.0.0.1:8000/api/user-data/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
SNIPPET

# 将主站配置更新为支持新域名 $DOMAIN
# 如果主站配置中还没有 server_name lumingzt.cn，则追加
MAIN_CONF=\$(sudo nginx -T 2>/dev/null | grep -l "lumingzt.cn" | head -1 || echo "")
if [ -z "\$MAIN_CONF" ]; then
    echo "⚠️  提示：请在主站 Nginx 配置中手动添加："
    echo "  server_name 43.136.38.87 ${DOMAIN} www.${DOMAIN};"
    echo "  并添加 include /etc/nginx/snippets/luming-user-data.conf;"
fi

sudo nginx -t && sudo systemctl reload nginx

echo "✅ Nginx配置完成"
ENDSSH

# 5. 启动后端服务
echo "📦 [5/5] 启动后端服务..."
ssh -i $KEY $SERVER << 'ENDSSH'
cd /opt/luming/backend

# 创建systemd服务
sudo tee /etc/systemd/system/luming-api.service << 'SERVICE'
[Unit]
Description=鹿鸣智投API服务
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/luming/backend
Environment="PATH=/opt/luming/backend/venv/bin"
EnvironmentFile=/opt/luming/backend/.env
ExecStart=/opt/luming/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable luming-api
sudo systemctl restart luming-api

echo "✅ 后端服务已启动"
ENDSSH

echo ""
echo "========================================="
echo "   ✅ 部署完成！"
echo "========================================="
echo ""
echo "后端API: http://43.136.38.87:8000 (内部)"
echo "API文档: http://43.136.38.87:8000/docs (内部)"
echo "用户同步: /api/user-data/{username} (通过主站nginx路由)"
echo ""
echo "域名迁移提醒:"
echo "  1. 在主站 nginx server_name 加上 $DOMAIN www.$DOMAIN"
echo "  2. 添加 include /etc/nginx/snippets/luming-user-data.conf;"
echo "  3. 申请 SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "查看日志:"
echo "  ssh $SERVER 'sudo journalctl -u luming-api -f'"
echo ""
