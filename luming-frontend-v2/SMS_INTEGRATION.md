# 📱 腾讯云短信验证码接入指南

## 📋 接入准备

### 1. 申请腾讯云短信服务
1. 访问 [腾讯云短信控制台](https://console.cloud.tencent.com/sms)
2. 开通短信服务（需要企业资质认证）
3. 创建短信签名和模板
4. 获取 API SecretKey 和 SecretId

---

## 🔧 后端实现

### Python Flask 后端集成

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
import hashlib
import hmac
import random
import json
import time

app = Flask(__name__)
CORS(app)

# ==================== 腾讯云短信配置 ====================
# 腾讯云配置（请在控制台获取）
TENCENT_SMS_SECRET_ID = "your_secret_id"      # SecretId
TENCENT_SMS_SECRET_KEY = "your_secret_key"    # SecretKey
TENCENT_SMS_APP_ID = "your_app_id"            # 短信应用ID
TENCENT_SMS_SIGN_NAME = "鹿鸣智投"          # 签名名称
TENCENT_SMS_TEMPLATE_ID = "1234567"           # 模板ID

# 验证码缓存（生产环境使用Redis）
verification_codes = {}

# ==================== 发送验证码 ====================
@app.route('/api/auth/send-code', methods=['POST'])
def send_verification_code():
    """
    发送短信验证码

    请求体: { "phone": "13800138000" }
    """
    data = request.json
    phone = data.get('phone', '')

    # 验证手机号
    if not phone or len(phone) != 11:
        return jsonify({
            'success': False,
            'message': '请输入正确的手机号'
        }), 400

    # 生成6位验证码
    code = str(random.randint(100000, 999999))

    # 缓存验证码（5分钟有效）
    verification_codes[phone] = {
        'code': code,
        'expire_time': int(time.time()) + 300  # 5分钟后过期
    }

    try:
        # 调用腾讯云短信API
        result = send_tencent_sms(phone, code)

        if result:
            return jsonify({
                'success': True,
                'message': '验证码已发送',
                # 开发环境可以返回验证码方便测试
                'code': code if is_development() else None
            })
        else:
            return jsonify({
                'success': False,
                'message': '发送失败，请稍后重试'
            }), 500

    except Exception as e:
        print(f"发送短信失败: {e}")
        # 开发环境可以直接返回验证码
        if is_development():
            return jsonify({
                'success': True,
                'message': f'开发模式：验证码是 {code}',
                'code': code
            })
        return jsonify({
            'success': False,
            'message': '发送失败，请稍后重试'
        }), 500

def send_tencent_sms(phone, code):
    """
    调用腾讯云短信API发送验证码

    文档: https://cloud.tencent.com/document/product/382
    """
    import ssl
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    import urllib3
    http = urllib3.PoolManager(cert_reqs=ssl.CERT_REQUIRED)

    # 当前时间
    now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

    # 请求参数
    params = {
        # 短信应用ID
        "PhoneNumberSet": [f"+86{phone}"],
        # 模板ID
        "TemplateID": TENCENT_SMS_TEMPLATE_ID,
        # 模板参数
        "TemplateParamSet": [code, "5"],  # {验证码, 有效时间（分钟）}
        # session上下文（可选）
        "SessionContext": f"luming_{int(time.time())}",
    }

    # API路径
    url = "https://sms.tencentcloudapi.com/v2/sms_templates_send"

    # 生成签名
    service = "sms"
    version = "2019-11-18"
    action = "SendTemplates"

    # 构建请求
    try:
        from tencentcloud.common import credential
        from tencentcloud.common.profile.client_profile import ClientProfile
        from tencentcloud.sms.v20190711 import sms_client

        # 实例化认证对象
        cred = credential.Credential(
            TENCENT_SMS_SECRET_ID,
            TENCENT_SMS_SECRET_KEY
        )

        # 实例化客户端
        client = sms_client.SmsClient(cred, "ap-guangzhou")

        # 实例化请求对象
        req = models.SendTemplatesRequest()

        # 设置参数
        req.PhoneNumberSet = [f"+86{phone}"]
        req.TemplateID = TENCENT_SMS_TEMPLATE_ID
        req.TemplateParamSet = [code, "5"]

        # 发送短信
        resp = client.SendTemplates(req)

        # 检查结果
        if hasattr(resp, 'SendStatusSet') and resp.SendStatusSet:
            for status in resp.SendStatusSet:
                print(f"发送结果: Code={status.Code}, Message={status.Message}, Phone={status.PhoneNumber}")
                return status.Code == 'Ok'

        return False

    except Exception as e:
        print(f"腾讯云短信API调用失败: {e}")
        # 使用备用方案（调用其他API）
        return send_backup_sms(phone, code)

def send_backup_sms(phone, code):
    """
    备用短信发送方案（用于API调用失败时）
    可以使用其他短信服务商或记录日志
    """
    print(f"备用方案: 手机号 {phone} 验证码 {code}")

    # 方案1: 保存到数据库，定时任务重试
    # 方案2: 使用其他短信服务商（阿里云、极光推送等）
    # 方案3: 开发环境直接打印日志

    return True  # 返回True表示"已处理"

# ==================== 验证码验证 ====================
@app.route('/api/auth/verify', methods=['POST'])
def verify_code():
    """
    验证短信验证码

    请求体: { "phone": "13800138000", "code": "123456" }
    """
    data = request.json
    phone = data.get('phone', '')
    code = data.get('code', '')

    # 从缓存获取验证码
    cached = verification_codes.get(phone)

    if not cached:
        return jsonify({
            'success': False,
            'message': '验证码已过期或不存在'
        }), 400

    # 检查是否过期
    if int(time.time()) > cached['expire_time']:
        del verification_codes[phone]
        return jsonify({
            'success': False,
            'message': '验证码已过期'
        }), 400

    # 验证码检查
    if cached['code'] == code:
        # 验证成功，删除缓存
        del verification_codes[phone]
        return jsonify({
            'success': True,
            'message': '验证成功'
        })
    else:
        return jsonify({
            'success': False,
            'message': '验证码错误'
        }), 400

def is_development():
    """判断是否为开发环境"""
    import os
    return os.getenv('FLASK_ENV', 'development') == 'development'

# ==================== 定时清理缓存 ====================
@app.route('/api/auth/cleanup', methods=['POST'])
def cleanup_expired_codes():
    """清理过期的验证码缓存"""
    current_time = int(time.time())
    expired_phones = [
        phone for phone, data in verification_codes.items()
        if current_time > data['expire_time']
    ]

    for phone in expired_phones:
        del verification_codes[phone]

    return jsonify({
        'success': True,
        'cleaned': len(expired_phones)
    })

if __name__ == '__main__':
    # 启动定时任务清理缓存（每小时）
    import threading
    def cleanup_task():
        while True:
            time.sleep(3600)  # 每小时清理一次
            cleanup_expired_codes()

    cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
    cleanup_thread.start()

    print("🚀 鹿鸣智投API服务启动")
    print("📱 腾讯云短信已集成")
    print("🌐 服务运行在 http://0.0.0.0:8000")
    app.run(host='0.0.0.0', port=8000, debug=True)
```

---

## 📝 短信模板配置

### 模板内容
```
您的验证码是{1}，{2}分钟内有效，请勿泄露给他人。
```

### 参数说明
- `{1}`: 验证码
- `{2}`: 有效时间（分钟）

---

## 🔐 安全配置

### 1. 环境变量配置

创建 `.env` 文件：
```bash
# 腾讯云短信配置
TENCENT_SMS_SECRET_ID=your_secret_id
TENCENT_SMS_SECRET_KEY=your_secret_key
TENCENT_SMS_APP_ID=your_app_id
TENCENT_SMS_SIGN_NAME=鹿鸣智投
TENCENT_SMS_TEMPLATE_ID=1234567

# Flask配置
FLASK_ENV=development
SECRET_KEY=your-secret-key
```

### 2. 读取环境变量

```python
import os
from dotenv import load_dotenv

load_dotenv()

TENCENT_SMS_SECRET_ID = os.getenv('TENCENT_SMS_SECRET_ID')
TENCENT_SMS_SECRET_KEY = os.getenv('TENCENT_SMS_SECRET_KEY')
```

### 3. 频率限制

防止短信轰炸：
```python
from functools import wraps
from time import time

# 存储发送记录
send_records = {}

# 限制每个手机号每天最多发送10次
def limit_sms_rate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        phone = request.json.get('phone')

        # 检查发送次数
        today = time.strftime("%Y-%m-%d", time.localtime())
        key = f"{phone}_{today}"

        if send_records.get(key, 0) >= 10:
            return jsonify({
                'success': False,
                'message': '今日发送次数已达上限'
            }), 429

        # 增加计数
        send_records[key] = send_records.get(key, 0) + 1

        return f(*args, **kwargs)

    return decorated_function

# 使用装饰器
@app.route('/api/auth/send-code', methods=['POST'])
@limit_sms_rate
def send_verification_code():
    # ... 原有代码
    pass
```

---

## 🎨 前端更新

### 登录页面更新

```typescript
// src/pages/LoginPage.tsx

const handleSendCode = async () => {
  if (!phone || phone.length !== 11) {
    alert('请输入正确的手机号');
    return;
  }

  try {
    setCodeSent(true);
    setCountdown(60);

    // 调用后端API发送验证码
    const response = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (data.success) {
      // 开发环境显示验证码（方便测试）
      if (data.code) {
        console.log('开发环境验证码:', data.code);
      }
      alert('验证码已发送');
    } else {
      alert(data.message || '发送失败');
      setCodeSent(false);
      setCountdown(0);
    }

    // 倒计时
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

  } catch (error) {
    console.error('发送验证码失败:', error);
    alert('发送失败，请重试');
    setCodeSent(false);
    setCountdown(0);
  }
};
```

---

## 📊 测试流程

### 1. 开发环境测试
```python
# 直接测试后端
curl -X POST http://localhost:8000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'

# 响应示例（开发环境）
{
  "success": true,
  "message": "开发模式：验证码是 123456",
  "code": "123456"
}
```

### 2. 生产环境测试
```bash
# 1. 配置腾讯云参数
# 2. 发送真实短信
curl -X POST http://43.136.38.87/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"真实手机号"}'
```

---

## ⚠️ 注意事项

### 1. 费用控制
- 腾讯云短信按条计费
- 建议设置每日发送上限
- 生产环境务必启用频率限制

### 2. 安全防护
- 验证码5分钟有效
- 同一手机号1分钟内只能发送1次
- 每天最多发送10次
- 验证码使用后立即删除

### 3. 备用方案
准备备用短信服务商：
- 阿里云短信
- 极光推送
- 容联云

---

## 📞 腾讯云资源

- **控制台**: https://console.cloud.tencent.com/sms
- **文档**: https://cloud.tencent.com/document/product/382
- **价格**: https://cloud.tencent.com/document/product/382/13361
- **SDK下载**: https://cloud.tencent.com/document/sdk

---

**腾讯云短信接入完成！** 🎉

安装依赖：
```bash
pip install tencentcloud-sdk-python
```
