#!/bin/bash

# 鹿鸣智投前端部署脚本

echo "🔨 开始构建..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ 构建失败"
  exit 1
fi

echo "📤 上传到服务器..."
scp -r -i ~/.ssh/id_ed25519_deploy dist/* ubuntu@43.136.38.87:/tmp/luming-vite-dist/
if [ $? -ne 0 ]; then
  echo "❌ 上传失败"
  exit 1
fi

echo "📦 部署到生产目录..."
ssh -i ~/.ssh/id_ed25519_deploy ubuntu@43.136.38.87 << 'ENDSSH'
sudo cp -r /tmp/luming-vite-dist/* /opt/luming/static/
sudo find /opt/luming/static/ -type d -exec chmod 755 {} \;
sudo find /opt/luming/static/ -type f -exec chmod 644 {} \;
sudo chown -R ubuntu:ubuntu /opt/luming/static/
ENDSSH

echo "🔍 验证部署..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://43.136.38.87/)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 部署成功！网站正常运行"
else
  echo "❌ 部署验证失败，HTTP状态码: $HTTP_CODE"
  exit 1
fi

echo "🎉 部署完成！访问 http://43.136.38.87"
