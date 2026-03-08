# 💳 会员支付接入指南 - 微信支付 + 支付宝

## 📋 支付方式说明

| 支付方式 | 适用场景 | 费率 | 结算周期 |
|---------|---------|------|---------|
| 微信支付 | 移动端、小程序 | 0.6% | T+1 |
| 支付宝 | 移动端、网页 | 0.6% | T+1 |

---

## 🔑 前置条件

### 1. 企业资质要求
- **营业执照** - 必须有合法的企业资质
- **ICP备案** - 域名需要ICP备案
- **对公账户** - 用于结算收款

### 2. 申请入口
- **微信支付**: https://pay.weixin.qq.com/
- **支付宝**: https://open.alipay.com/

---

## 📱 微信支付接入

### 步骤1: 注册微信支付商户号

1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 注册并提交企业资质
3. 等待审核（通常1-3个工作日）

### 步骤2: 获取API参数

审核通过后，商户平台上可以获取：
- **商户号(mchid)**: 商户唯一标识
- **API密钥(APIv2 Key)**: 签名用
- **APPID**: 公众号或小程序APPID
- **API证书**: 商户证书（apiclient_cert.pem、apiclient_key.pem）

### 步骤3: Python后端实现

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
import hashlib
import random
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ==================== 微信支付配置 ====================
WECHAT_PAY_CONFIG = {
    'appid': 'your_appid',                  # 公众号APPID
    'mch_id': 'your_mch_id',                  # 商户号
    'api_key': 'your_api_key_v2',            # APIv2密钥
    'notify_url': 'https://your-domain.com/api/payment/wechat/callback',  # 回调地址
    'order_prefix': 'LM',                    # 订单前缀
}

# ==================== 创建支付订单 ====================
@app.route('/api/payment/create-order', methods=['POST'])
def create_wechat_order():
    """
    创建微信支付订单

    请求体: {
        "plan": "monthly",      # 套餐类型: monthly, quarterly, yearly
        "amount": 29800       # 金额（分）
    }
    """
    data = request.json
    user_id = request.headers.get('X-User-ID', 'test_user')
    plan = data.get('plan', 'monthly')

    # 套餐配置
    PLANS = {
        'monthly': {'name': '月度会员', 'amount': 29800, 'duration': 30},
        'quarterly': {'name': '季度会员', 'amount': 79800, 'duration': 90},
        'yearly': {'name': '年度会员', 'amount': 26800, 'duration': 365}
    }

    plan_config = PLANS.get(plan)
    if not plan_config:
        return jsonify({'success': False, 'message': '无效的套餐'}), 400

    # 生成订单号
    order_no = f"{WECHAT_PAY_CONFIG['order_prefix']}{int(time.time())}{random.randint(1000, 9999)}"

    # 创建订单记录
    order = {
        'order_no': order_no,
        'user_id': user_id,
        'plan': plan,
        'amount': plan_config['amount'],
        'status': 'pending',
        'create_time': datetime.now().isoformat()
    }

    # TODO: 保存订单到数据库

    # 调用微信支付统一下单API
    try:
        wxpay_params = create_wechat_unifiedorder(order_no, plan_config, user_id)
        return jsonify({
            'success': True,
            'data': wxpay_params
        })
    except Exception as e:
        print(f"创建微信支付订单失败: {e}")
        return jsonify({
            'success': False,
            'message': '创建订单失败'
        }), 500

def create_wechat_unifiedorder(order_no, plan_config, user_id):
    """
    调用微信支付统一下单API

    文档: https://pay.weixin.qq.com/wiki/doc/api/index.html
    """
    # 构造请求参数
    params = {
        'appid': WECHAT_PAY_CONFIG['appid'],
        'mch_id': WECHAT_PAY_CONFIG['mch_id'],
        'nonce_str': random_string(32),
        'body': f"鹿鸣智投-{plan_config['name']}",
        'out_trade_no': order_no,
        'total_fee': plan_config['amount'],
        'spbill_create_ip': '127.0.0.1',
        'notify_url': WECHAT_PAY_CONFIG['notify_url'],
        'trade_type': 'APP',  # APP支付
        'openid': get_user_openid(user_id)  # 用户的openid
    }

    # 生成签名
    string_sign_temp = '&'.join([f"{k}={params[k]}" for k in sorted(params.keys())])
    string_sign_temp = f"{string_sign_temp}&key={WECHAT_PAY_CONFIG['api_key']}"
    sign = hashlib.md5(string_sign_temp.encode('utf-8')).hexdigest()
    params['sign'] = sign

    # 调用微信支付API
    import requests
    url = 'https://api.mch.weixin.qq.com/pay/unifiedorder'
    response = requests.post(url, data=xmlto_dict(params), cert=('./apiclient_cert.pem', key='./apiclient_key.pem'))

    # 解析响应
    result = dictto_xml(response.content)

    if result.get('return_code') == 'SUCCESS' and result.get('result_code') == 'SUCCESS':
        return {
            'prepay_id': result.get('prepay_id'),
            'order_no': order_no,
            'amount': plan_config['amount']
        }
    else:
        raise Exception(f"微信支付下单失败: {result}")

# ==================== 微信支付回调 ====================
@app.route('/api/payment/wechat/callback', methods=['POST'])
def wechat_callback():
    """
    微信支付回调通知

    处理支付成功后的业务逻辑
    """
    # 解析回调数据
    result = dictto_xml(request.data)

    # 验证签名
    if not verify_wechat_sign(result):
        return '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名验证失败]]></return_msg></xml>'

    # 检查订单状态
    out_trade_no = result.get('out_trade_no')
    transaction_id = result.get('transaction_id')
    total_fee = result.get('total_fee')

    if result.get('return_code') == 'SUCCESS' and result.get('result_code') == 'SUCCESS':
        # 支付成功
        # TODO: 更新订单状态
        # TODO: 开通用户会员权限
        # TODO: 记录支付日志

        print(f"订单 {out_trade_no} 支付成功，金额: {total_fee}")

        # 返回成功响应
        return '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'
    else:
        # 支付失败
        print(f"订单 {out_trade_no} 支付失败")
        return '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理失败]]></return_msg></xml>'

# ==================== 查询订单状态 ====================
@app.route('/api/payment/query-order', methods=['POST'])
def query_order():
    """
    查询订单状态

    请求体: { "order_no": "LM1234567890" }
    """
    data = request.json
    order_no = data.get('order_no')

    # 调用微信支付查询订单API
    params = {
        'appid': WECHAT_PAY_CONFIG['appid'],
        'mch_id': WECHAT_PAY_CONFIG['mch_id'],
        'out_trade_no': order_no,
        'nonce_str': random_string(32)
    }

    # 签名
    string_sign_temp = '&'.join([f"{k}={params[k]}" for k in sorted(params.keys())])
    string_sign_temp = f"{string_sign_temp}&key={WECHAT_PAY_CONFIG['api_key']}"
    params['sign'] = hashlib.md5(string_sign_temp.encode('utf-8')).hexdigest()

    # 调用查询API
    import requests
    url = 'https://api.mch.weixin.qq.com/pay/orderquery'
    response = requests.post(url, data=xmlto_dict(params))

    result = dictto_xml(response.content)

    return jsonify({
        'success': True,
        'data': {
            'order_no': order_no,
            'status': result.get('trade_state', 'NOTPAY'),
            'transaction_id': result.get('transaction_id')
        }
    })

# ==================== 辅助函数 ====================
def random_string(length):
    """生成随机字符串"""
    return ''.join(random.choice('0123456789abcdefghijklmnopqrstuvwxyz') for _ in range(length))

def xmlto_dict(data):
    """XML转字典"""
    import xml.etree.ElementTree as ET
    root = ET.fromstring(data)
    return {child.tag: child.text for child in root}

def dictto_xml(data):
    """字典转XML"""
    xml_data = '<xml>'
    for key, value in data.items():
        xml_data += f"<{key}><
![CDATA[{value}]]></{key}>"
    xml_data += '</xml>'
    return xml_data

def get_user_openid(user_id):
    """获取用户的openid（需要微信授权）"""
    # TODO: 实现微信OAuth获取openid
    # 或者从小程序前端直接传入openid
    return 'test_openid'

def verify_wechat_sign(data):
    """验证微信支付签名"""
    # TODO: 实现签名验证
    return True
```

---

## 💰 支付宝接入

### 步骤1: 注册支付宝开放平台

1. 访问 [支付宝开放平台](https://open.alipay.com/)
2. 创建应用并选择支付能力
3. 签约并上传应用
4. 等待审核

### 步骤2: 获取API参数

审核通过后获取：
- **APPID**: 应用ID
- **应用私钥**: RSA私钥
- **支付宝公钥**: 用于验证支付宝响应

### 步骤3: 生成密钥

```bash
# 生成RSA密钥对
openssl genrsa -out app_private_key.pem 2048
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem

# 上传公钥到支付宝平台
# 下载支付宝公钥保存为 alipay_public_key.pem
```

### 步骤4: Python后端实现

```python
from alipay import AliPay
from alipay.utils import AliPayConfig
from flask import Flask, jsonify, request

app = Flask(__name__)

# ==================== 支付宝配置 ====================
ALIPAY_CONFIG = {
    'appid': 'your_appid',
    'app_notify_url': 'https://your-domain.com/api/payment/alipay/callback',
    'app_private_key_path': 'app_private_key.pem',
    'alipay_public_key_path': 'alipay_public_key.pem',
    'sandbox': False,  # 是否沙箱环境
}

# 创建支付宝实例
alipay = AliPay(
    appid=ALIPAY_CONFIG['appid'],
    app_notify_url=ALIPAY_CONFIG['app_notify_url'],
    app_private_key_path=ALIPAY_CONFIG['app_private_key_path'],
    alipay_public_key_path=ALIPAY_CONFIG['alipay_public_key_path'],
    debug=False
)

# ==================== 创建支付宝支付订单 ====================
@app.route('/api/payment/alipay/create', methods=['POST'])
def create_alipay_order():
    """
    创建支付宝支付订单

    请求体: {
        "plan": "yearly",
        "amount": 26800,
        "return_url": "https://your-domain.com/success"
    }
    """
    data = request.json
    user_id = request.headers.get('X-User-ID', 'test_user')
    plan = data.get('plan', 'yearly')
    return_url = data.get('return_url', '')

    # 套餐配置
    PLANS = {
        'monthly': {'name': '月度会员', 'amount': 29800, 'duration': 30},
        'quarterly': {'name': '季度会员', 'amount': 79800, 'duration': 90},
        'yearly': {'name': '年度会员', 'amount': 26800, 'duration': 365}
    }

    plan_config = PLANS.get(plan)
    if not plan_config:
        return jsonify({'success': False, 'message': '无效的套餐'}), 400

    # 生成订单号
    order_string = f"LM{int(time.time())}{random.randint(1000, 9999)}"

    # 创建订单
    order = {
        'order_no': order_string,
        'user_id': user_id,
        'plan': plan,
        'amount': plan_config['amount'],
        'status': 'pending',
        'create_time': datetime.now().isoformat()
    }

    # TODO: 保存订单到数据库

    try:
        # 手机网站支付
        order_string = alipay.api_alipay_trade_page_pay(
            out_trade_no=order_string,
            total_amount=plan_config['amount'] / 100,  # 元
            subject=f"鹿鸣智投-{plan_config['name']}",
            return_url=return_url,
            notify_url=ALIPAY_CONFIG['app_notify_url'],
        )

        return jsonify({
            'success': True,
            'data': {
                'pay_url': order_string  # 支付链接
            }
        })
    except Exception as e:
        print(f"创建支付宝订单失败: {e}")
        return jsonify({
            'success': False,
            'message': '创建订单失败'
        }), 500

# ==================== 支付宝回调 ====================
@app.route('/api/payment/alipay/callback', methods=['POST'])
def alipay_callback():
    """
    支付宝异步通知回调
    """
    # 验证签名
    data = request.form.to_dict()
    signature = data.pop('sign')

    # 验证支付宝签名
    if not alipay.verify(data, signature):
        return 'failure'

    # 处理业务逻辑
    out_trade_no = data.get('out_trade_no')
    trade_no = data.get('trade_no')
    trade_status = data.get('trade_status')

    if trade_status == 'TRADE_SUCCESS':
        # 支付成功
        # TODO: 更新订单状态
        # TODO: 开通会员权限
        print(f"支付宝订单 {out_trade_no} 支付成功")

        return 'success'
    else:
        return 'failure'

# ==================== 查询支付宝订单 ====================
@app.route('/api/payment/alipay/query', methods=['POST'])
def query_alipay_order():
    """
    查询支付宝订单
    """
    data = request.json
    order_no = data.get('order_no')

    try:
        result = alipay.api_alipay_trade_query(out_trade_no=order_no)

        if result.get('code') == '10000':
            return jsonify({
                'success': True,
                'data': {
                    'order_no': order_no,
                    'status': result.get('trade_status'),
                    'total_amount': result.get('total_amount')
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': result.get('sub_msg', '查询失败')
            })

    except Exception as e:
        print(f"查询支付宝订单失败: {e}")
        return jsonify({
            'success': False,
            'message': '查询失败'
        }), 500
```

---

## 🎨 前端支付页面

```typescript
// src/pages/PaymentPage.tsx

import { useState } from 'react';
import { ArrowLeft, Crown } from 'lucide-react';

export function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const plans = [
    {
      id: 'monthly',
      name: '月度会员',
      duration: '30天',
      price: 29.8,
      originalPrice: 68,
      tag: '灵活'
    },
    {
      id: 'quarterly',
      name: '季度会员',
      duration: '90天',
      price: 79.8,
      originalPrice: 204,
      tag: '超值'
    },
    {
      id: 'yearly',
      name: '年度会员',
      duration: '365天',
      price: 268,
      originalPrice: 816,
      tag: '推荐',
      discount: '省67%'
    }
  ];

  const handlePayment = async (method: 'wechat' | 'alipay') => {
    const plan = plans.find(p => p.id === selectedPlan);
    const amount = Math.round(plan.price * 100); // 转换为分

    try {
      if (method === 'wechat') {
        // 微信支付
        const response = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: selectedPlan,
            amount: amount
          }),
        });

        const result = await response.json();

        if (result.success) {
          // 调起微信支付
          if (window.WeixinJSBridge) {
            window.WeixinJSBridge.invoke('getBrandWCPayRequest', {
              appId: result.data.appId,
              partnerId: result.data.partnerId,
              prepayId: result.data.prepayId,
              package: 'Sign=WXPay',
              nonceStr: result.data.nonceStr,
              timeStamp: result.data.timeStamp
            });
          } else {
            alert('请在微信中打开');
          }
        }
      } else {
        // 支付宝
        const response = await fetch('/api/payment/alipay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: selectedPlan,
            amount: amount,
            return_url: window.location.href + '?success=true'
          }),
        });

        const result = await response.json();

        if (result.success && result.data.pay_url) {
          // 跳转到支付宝支付页面
          window.location.href = result.data.pay_url;
        }
      }
    } catch (error) {
      console.error('支付失败:', error);
      alert('支付失败，请重试');
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* 套餐选择 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 16 }}>选择套餐</h2>

        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            style={{
              padding: '16px',
              marginBottom: 12,
              borderRadius: 16,
              border: selectedPlan === plan.id
                ? '2px solid #6366f1'
                : '1px solid rgba(255,255,255,0.1)',
              background: selectedPlan === plan.id
                ? 'rgba(99, 102, 241, 0.1)'
                : 'rgba(255,255,255,0.03)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>
                {plan.name}
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: plan.tag === '推荐' ? '#ef4444' : plan.tag === '超值' ? '#fbbf24' : '#6366f1',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600
              }}>
                {plan.tag}
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 12 }}>
              {plan.duration}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                color: '#ef4444',
                fontSize: 28,
                fontWeight: 800,
                textDecoration: 'line-through',
                opacity: 0.6
              }}>
                ¥{plan.originalPrice}
              </span>
              <span style={{ color: '#fbbf24', fontSize: 32, fontWeight: 800 }}>
                ¥{plan.price}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 支付方式 */}
      <div>
        <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 16 }}>选择支付方式</h3>

        <button
          onClick={() => handlePayment('wechat')}
          style={{
            width: '100%',
            padding: '16px',
            marginBottom: 12,
            borderRadius: 12,
            border: 'none',
            background: '#09BB07',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5 14.5q-1 0-1.5-1.1-.5-1.7-.1-3.2 0-3.2 2.9-5.1 2.9h.6q2.5 0 4.3-1.6 1.8-1.6 4.2 0 5.5 3.3 5.5 7.5 0 .8.5.5.8.5 1.2v3.5q0 .6-.4 1-1.1.4-1.1.8 0 1.3-.7 2.1-1.9.6-1.9 3.1 0 3.6 2.1 3.6 4.8v.1z"/>
          </svg>
          微信支付
        </button>

        <button
          onClick={() => handlePayment('alipay')}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 12,
            border: 'none',
            background: '#1677FF',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.25 3H4.75C3.78 3 3 3.78 3 4.75v15c0 .97-.78 1.75-1.75 1.75h14.5c.97 0 1.75-.78 1.75-1.75v-15c0-.97-.78-1.75-1.75-1.75zM17 18v-1.5c1.5-.3 2.5-1.5 2.5-3v-6c0-1.5-1-2.5-2.5-4H8v13.5h9z"/>
          </svg>
          支付宝
        </button>
      </div>
    </div>
  );
}
```

---

## 📦 安装依赖

```bash
# 后端依赖
pip install flask flask-cors requests pycryptodome

# 微信支付SDK
pip install wechatpy

# 支付宝SDK
pip install python-alipay-sdk
```

---

## ⚠️ 注意事项

### 1. 安全配置
- **密钥管理**: 不要将密钥提交到代码仓库
- **环境变量**: 使用环境变量存储敏感信息
- **HTTPS**: 生产环境必须使用HTTPS
- **签名验证**: 必须验证所有回调签名

### 2. 订单管理
- **幂等性**: 订单号必须唯一
- **状态同步**: 定期查询订单状态
- **超时处理**: 支付超时自动关闭订单
- **退款处理**: 实现退款功能

### 3. 测试环境
```python
# 支付宝沙箱环境
ALIPAY_CONFIG['sandbox'] = True

# 沙箱测试页面
https://openhome.alipay.com/platform/appDaily.htm
```

---

## 📞 支付资源

### 微信支付
- **商户平台**: https://pay.weixin.qq.com/
- **开发文档**: https://pay.weixin.qq.com/wiki/doc/api/index.html
- **SDK下载**: https://pay.weixin.qq.com/wiki/doc/api/download.html

### 支付宝
- **开放平台**: https://open.alipay.com/
- **开发文档**: https://opendocs.alipay.com/
- **SDK下载**: https://opendocs.alipay.com/docs/02dv1mp

---

## 🧪 测试流程

### 1. 沙箱测试
- 支付宝提供沙箱环境用于测试
- 使用支付宝沙箱账号支付
- 测试金额会自动退款

### 2. 真实支付测试
- 使用小额真实支付测试
- 测试完成后申请退款

### 3. 回调测试
- 模拟支付回调通知
- 验证业务逻辑正确性

---

**支付接入完成！** 🎉

记得：
1. ✅ 先申请企业资质
2. ✅ 获取API密钥
3. ✅ 配置后端服务
4. ✅ 测试支付流程
5. ✅ 上线前务必使用HTTPS
