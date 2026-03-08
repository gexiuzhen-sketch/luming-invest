#!/bin/bash
# 自动备份脚本
# 使用方法: ./backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/Users/a123456/Documents/Claude Code/backups"
PROJECT_DIR="/Users/a123456/Documents/Claude Code/鹿鸣智投/luming-frontend-v2"

echo "========================================="
echo "   鹿鸣智投 - 自动备份"
echo "   时间: ${TIMESTAMP}"
echo "========================================="
echo ""

# 1. 本地备份
echo "📦 [1/2] 本地备份..."
mkdir -p "${BACKUP_DIR}"
cp -r "${PROJECT_DIR}" "${BACKUP_DIR}/luming_backup_${TIMESTAMP}/"
echo "✅ 本地备份完成: ${BACKUP_DIR}/luming_backup_${TIMESTAMP}/"

# 2. 服务器备份
echo "📦 [2/2] 服务器备份..."
ssh luming "sudo mkdir -p /opt/backups && \
sudo cp -r /opt/luming/backend /opt/backups/backend_${TIMESTAMP}/ && \
sudo cp -r /var/www/luming /opt/backups/frontend_${TIMESTAMP}/"
echo "✅ 服务器备份完成"

echo ""
echo "========================================="
echo "   ✅ 备份完成！"
echo "========================================="
echo ""
echo "本地备份: ${BACKUP_DIR}/luming_backup_${TIMESTAMP}/"
echo "服务器备份: /opt/backups/backend_${TIMESTAMP}/"
echo "             /opt/backups/frontend_${TIMESTAMP}/"
echo ""

# 清理旧备份（保留最近5个）
echo "🧹 清理旧备份（保留最近5个）..."
cd "${BACKUP_DIR}"
ls -t | grep "luming_backup_" | tail -n +6 | xargs rm -rf
echo "✅ 清理完成"
echo ""
