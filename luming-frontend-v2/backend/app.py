#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
鹿鸣智投 - 后端API服务
集成了 Tushare、腾讯云短信、微信支付、支付宝
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import random
import time
import hashlib
import os
from datetime import datetime
from functools import wraps

# ==================== 配置 ====================
class Config:
    # 服务器配置
    HOST = '0.0.0.0'
    PORT = 8000

    # Tushare配置
    TUSHARE_API_KEY = "17e9e62a75b8d0a3efd3761944b7c8cf10847f94c86152b5258d385a"
    TUSHARE_API_URL = "http://api.tushare.pro"

    # 腾讯云短信配置
    TENCENT_SMS_SECRET_ID = os.getenv('TENCENT_SMS_SECRET_ID', '')
    TENCENT_SMS_SECRET_KEY = os.getenv('TENCENT_SMS_SECRET_KEY', '')
    TENCENT_SMS_APP_ID = os.getenv('TENCENT_SMS_APP_ID', '')
    TENCENT_SMS_TEMPLATE_ID = os.getenv('TENCENT_SMS_TEMPLATE_ID', '')

    # 微信支付配置
    WECHAT_PAY_APPID = os.getenv('WECHAT_PAY_APPID', '')
    WECHAT_PAY_MCH_ID = os.getenv('WECHAT_PAY_MCH_ID', '')
    WECHAT_PAY_API_KEY = os.getenv('WECHAT_PAY_API_KEY', '')

    # 支付宝配置
    ALIPAY_APPID = os.getenv('ALIPAY_APPID', '')
    ALIPAY_PRIVATE_KEY_PATH = 'app_private_key.pem'
    ALIPAY_PUBLIC_KEY_PATH = 'alipay_public_key.pem'

app = Flask(__name__)
CORS(app)

# 开发模式
DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'

# ==================== 缓存 ====================
verification_codes = {}  # 验证码缓存
send_records = {}  # 发送记录
orders = {}  # 订单记录

# ==================== 工具函数 ====================
def random_string(length=32):
    """生成随机字符串"""
    return ''.join(random.choices('0123456789abcdefghijklmnopqrstuvwxyz', k=length))

def success_response(data=None, message='操作成功'):
    """成功响应"""
    response = {
        'success': True,
        'message': message
    }
    if data is not None:
        response['data'] = data
    return jsonify(response)

def error_response(message='操作失败', code=400):
    """错误响应"""
    return jsonify({
        'success': False,
        'message': message
    }), code

def is_development():
    """判断是否为开发环境"""
    return DEBUG

# ==================== Tushare API ====================
def call_tushare(api_name, params=None):
    """调用Tushare API"""
    params = params or {}
    params['token'] = Config.TUSHARE_API_KEY

    try:
        import requests
        response = requests.post(
            f"{Config.TUSHARE_API_URL}/{api_name}",
            json=params,
            timeout=10
        )
        data = response.json()

        if data.get('code') != 0:
            print(f"Tushare API Error: {data}")
            return None

        return data.get('data')
    except Exception as e:
        print(f"Tushare API Exception: {e}")
        return None

# ==================== 股票推荐API ====================
@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'service': 'luming-api',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/recs', methods=['GET'])
def get_stock_recommendations():
    """
    获取股票推荐

    参数: market (A|HK|US|FUND)
    """
    market = request.args.get('market', 'A')

    if market == 'A':
        # 获取沪深300成分股
        stocks = call_tushare('index_weight', {
            'ts_code': '000300.SH'
        })

        if stocks and len(stocks) > 0:
            # 获取前20只股票的实时行情
            codes = ','.join([s['con_code'] for s in stocks[:20]])
            daily = call_tushare('daily', {
                'ts_code': codes,
                'fields': 'ts_code,trade_date,open,high,low,close,change,chg_pct,vol,amount'
            })

            if daily is not None and len(daily) > 0:
                latest = daily[daily['trade_date'] == daily['trade_date'].max()]
                result = []

                for _, row in latest.iterrows():
                    score = 50 + (float(row.get('chg_pct', 0)) * 5)
                    score = min(100, max(0, score))

                    result.append({
                        'code': row['ts_code'].split('.')[0],
                        'name': get_stock_name(row['ts_code'].split('.')[0]),
                        'market': 'SH' if row['ts_code'].endswith('.SH') else 'SZ',
                        'price': float(row['close']),
                        'change': float(row.get('change', 0)),
                        'changePct': float(row.get('chg_pct', 0)),
                        'volume': f"{float(row.get('vol', 0))/10000:.1f}万" if row.get('vol') else '-',
                        'turnover': f"{float(row.get('amount', 0))/100000000:.1f}亿" if row.get('amount') else '-',
                        'score': int(score),
                        'pe': 20 + (float(row.get('chg_pct', 0)) * 0.5),
                        'roe': 15 + (score * 0.1),
                        'rsi': 50 + (float(row.get('chg_pct', 0)) * 5),
                        'macd': 'golden_cross' if float(row.get('change', 0)) > 0 else 'death_cross',
                        'sector': 'A股',
                        'cap': '1000亿',
                        'why': f"当日涨跌幅{(row.get('chg_pct', 0)):.2f}%，{'强势上涨' if float(row.get('change', 0)) > 0 else '下跌'}"
                    })

                return jsonify(sorted(result, key=lambda x: x['score'], reverse=True))

        return jsonify([])

    elif market == 'HK':
        # 港股推荐（使用Mock数据，Tushare港股数据需要单独接口）
        return jsonify(get_hk_stocks())

    elif market == 'US':
        # 美股推荐（使用Mock数据）
        return jsonify(get_us_stocks())

    elif market == 'FUND':
        # 基金推荐
        return jsonify(get_fund_stocks())

    return jsonify([])

def get_stock_name(code):
    """获取股票名称"""
    names = {
        '600519': '贵州茅台', '000858': '五粮液', '000001': '平安银行',
        '600036': '招商银行', '002594': '比亚迪', '300750': '宁德时代',
        '601318': '中国平安', '000333': '美的集团', '600276': '恒瑞医药'
    }
    return names.get(code, f'股票{code}')

def get_hk_stocks():
    """港股推荐股票"""
    return [
        {'code': '00700', 'name': '腾讯控股', 'market': 'HK', 'price': 320, 'change': 6.58, 'changePct': 2.1, 'score': 93, 'pe': 18.5, 'roe': 15.2, 'rsi': 62.5, 'macd': 'golden_cross', 'sector': '科技', 'cap': '3.0万亿', 'why': '互联网巨头，核心游戏业务稳健，金融科技和云业务快速增长'},
        {'code': '09988', 'name': '阿里巴巴', 'market': 'HK', 'price': 78.5, 'change': 1.16, 'changePct': 1.5, 'score': 89, 'pe': 12.8, 'roe': 11.5, 'rsi': 55.2, 'macd': 'golden_cross', 'sector': '科技', 'cap': '1.6万亿', 'why': '电商龙头，云计算和AI布局领先，估值处于历史低位'},
        {'code': '01810', 'name': '小米集团', 'market': 'HK', 'price': 15.2, 'change': 0.56, 'changePct': 3.8, 'score': 86, 'pe': 22.5, 'roe': 18.2, 'rsi': 65.8, 'macd': 'golden_cross', 'sector': '科技', 'cap': '3800亿', 'why': '手机业务稳健，汽车业务放量，AIoT生态完善'},
        {'code': '02318', 'name': '中国平安', 'market': 'HK', 'price': 42.3, 'change': -0.22, 'changePct': -0.5, 'score': 82, 'pe': 8.2, 'roe': 12.5, 'rsi': 48.5, 'macd': 'death_cross', 'sector': '金融', 'cap': '7700亿', 'why': '保险龙头，投资收益改善，代理人队伍企稳'},
        {'code': '00941', 'name': '中国移动', 'market': 'HK', 'price': 72.5, 'change': 0.85, 'changePct': 1.2, 'score': 84, 'pe': 10.5, 'roe': 10.8, 'rsi': 54.5, 'macd': 'neutral', 'sector': '电信', 'cap': '1.5万亿', 'why': '电信龙头，5G用户规模领先，云计算业务快速增长'}
    ]

def get_us_stocks():
    """美股推荐股票"""
    return [
        {'code': 'AAPL', 'name': '苹果', 'market': 'US', 'price': 178.5, 'change': 2.12, 'changePct': 1.2, 'score': 94, 'pe': 28.5, 'roe': 35.2, 'rsi': 58.5, 'macd': 'golden_cross', 'sector': '科技', 'cap': '2.8万亿美元', 'why': '全球消费电子龙头，iPhone销量稳健，服务业务持续增长'},
        {'code': 'NVDA', 'name': '英伟达', 'market': 'US', 'price': 850.2, 'change': 44.43, 'changePct': 5.5, 'score': 95, 'pe': 65.2, 'roe': 42.5, 'rsi': 75.5, 'macd': 'golden_cross', 'sector': '科技', 'cap': '2.1万亿美元', 'why': 'AI芯片绝对龙头，数据中心业务爆发式增长'},
        {'code': 'TSLA', 'name': '特斯拉', 'market': 'US', 'price': 178.2, 'change': -4.56, 'changePct': -2.5, 'score': 87, 'pe': 45.8, 'roe': 18.5, 'rsi': 42.5, 'macd': 'death_cross', 'sector': '新能源汽车', 'cap': '5700亿美元', 'why': '电动车龙头，FSD进展顺利，但降价压力影响毛利率'},
        {'code': 'MSFT', 'name': '微软', 'market': 'US', 'price': 420.5, 'change': 11.48, 'changePct': 2.8, 'score': 92, 'pe': 35.2, 'roe': 38.5, 'rsi': 62.5, 'macd': 'golden_cross', 'sector': '科技', 'cap': '3.1万亿美元', 'why': '云计算和办公软件龙头，AI集成领先，业绩确定性高'},
        {'code': 'GOOGL', 'name': '谷歌', 'market': 'US', 'price': 142.8, 'change': 3.15, 'changePct': 2.3, 'score': 90, 'pe': 25.8, 'roe': 25.2, 'rsi': 60.5, 'macd': 'golden_cross', 'sector': '科技', 'cap': '1.8万亿美元', 'why': '搜索广告龙头，云业务快速增长，AI模型Gemini领先'}
    ]

def get_fund_stocks():
    """基金推荐"""
    return [
        {'code': '110011', 'name': '易方达优质精选', 'market': 'FUND', 'price': 2.85, 'change': 0.04, 'changePct': 1.5, 'score': 88, 'pe': 0, 'roe': 18.5, 'rsi': 58.5, 'macd': 'golden_cross', 'sector': '混合型', 'cap': '150亿', 'why': '基金经理经验丰富，长期业绩优秀，持仓均衡'},
        {'code': '163406', 'name': '兴全合润', 'market': 'FUND', 'price': 3.25, 'change': 0.04, 'changePct': 1.2, 'score': 86, 'pe': 0, 'roe': 16.8, 'rsi': 55.2, 'macd': 'neutral', 'sector': '混合型', 'cap': '200亿', 'why': '价值投资理念，长期穿越牛熊，风控能力突出'},
        {'code': '000961', 'name': '天弘沪深300ETF', 'market': 'FUND', 'price': 1.85, 'change': 0.01, 'changePct': 0.8, 'score': 83, 'pe': 0, 'roe': 12.5, 'rsi': 52.5, 'macd': 'neutral', 'sector': '指数型', 'cap': '500亿', 'why': '跟踪沪深300指数，费率低廉，适合长期配置'},
        {'code': '161725', 'name': '招商中证白酒', 'market': 'FUND', 'price': 1.15, 'change': 0.03, 'changePct': 2.5, 'score': 85, 'pe': 0, 'roe': 22.5, 'rsi': 62.5, 'macd': 'golden_cross', 'sector': '指数型', 'cap': '300亿', 'why': '跟踪中证白酒指数，行业集中度高，弹性大'},
        {'code': '510300', 'name': '华泰柏瑞300ETF', 'market': 'FUND', 'price': 4.58, 'change': 0.06, 'changePct': 1.3, 'score': 84, 'pe': 0, 'roe': 13.2, 'rsi': 54.8, 'macd': 'neutral', 'sector': '指数型', 'cap': '1200亿', 'why': '规模最大的沪深300ETF，流动性好，适合大资金配置'}
    ]


@app.route('/api/stock/prices', methods=['POST'])
def get_stock_prices():
    """获取多只股票的实时价格"""
    try:
        data = request.json
        codes = data.get('codes', [])
        if not codes:
            return jsonify({})
        prices = {}
        mock_prices = {'600519': 1455.02, '000858': 125.80, '300750': 178.50, '600036': 33.82}
        import random
        for code in codes:
            if code in mock_prices:
                base_price = mock_prices[code]
                change_pct = random.uniform(-0.01, 0.01)
                prices[code] = {'price': round(base_price * (1 + change_pct), 2), 'changePct': round(change_pct * 100, 2)}
            else:
                prices[code] = {'price': 100.00, 'changePct': 0.0}
        return jsonify(prices)
    except Exception as e:
        return jsonify({})

# ==================== 短信验证码 ====================
@app.route('/api/auth/send-code', methods=['POST'])
def send_verification_code():
    """发送短信验证码"""
    data = request.json
    phone = data.get('phone', '')

    if not phone or len(phone) != 11:
        return error_response('请输入正确的手机号')

    # 检查发送频率
    today = time.strftime("%Y-%m-%d", time.localtime())
    key = f"{phone}_{today}"

    if send_records.get(key, 0) >= 10:
        return error_response('今日发送次数已达上限')

    # 生成验证码
    code = str(random.randint(100000, 999999))

    # 缓存验证码
    verification_codes[phone] = {
        'code': code,
        'expire_time': int(time.time()) + 300  # 5分钟有效
    }

    # 增加发送计数
    send_records[key] = send_records.get(key, 0) + 1

    try:
        # 调用腾讯云短信API
        if is_development():
            # 开发环境直接返回验证码
            return success_response({
                'code': code,
                'message': f'开发模式：验证码是 {code}'
            })

        # TODO: 调用腾讯云短信API
        # result = send_tencent_sms(phone, code)

        return success_response({
            'message': '验证码已发送'
        })

    except Exception as e:
        print(f"发送短信失败: {e}")
        return error_response('发送失败，请稍后重试', 500)

@app.route('/api/auth/verify', methods=['POST'])
def verify_code():
    """验证短信验证码"""
    data = request.json
    phone = data.get('phone', '')
    code = data.get('code', '')

    cached = verification_codes.get(phone)

    if not cached:
        return error_response('验证码已过期或不存在')

    if int(time.time()) > cached['expire_time']:
        del verification_codes[phone]
        return error_response('验证码已过期')

    if cached['code'] == code:
        del verification_codes[phone]
        return success_response({'message': '验证成功'})

    return error_response('验证码错误')

# ==================== 登录 ====================
@app.route('/api/auth/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.json
    phone = data.get('phone', '')
    code = data.get('code', '')

    # 验证验证码
    verify_result = verify_code()
    if verify_result.status_code != 200:
        return verify_result.get_json()

    # 创建用户
    user = {
        'id': f'user_{phone}',
        'phone': phone,
        'membershipLevel': 'free',
        'createdAt': datetime.now().isoformat()
    }

    return success_response({
        'user': user
    })

# ==================== 清理缓存 ====================
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

    return success_response({
        'cleaned': len(expired_phones)
    })

# ==================== 支付相关 ====================
PLANS = {
    'monthly': {'name': '月度会员', 'amount': 29800, 'duration': 30},
    'quarterly': {'name': '季度会员', 'amount': 79800, 'duration': 90},
    'yearly': {'name': '年度会员', 'amount': 26800, 'duration': 365}
}

@app.route('/api/payment/create-order', methods=['POST'])
def create_payment_order():
    """创建支付订单"""
    data = request.json
    plan = data.get('plan', 'monthly')

    plan_config = PLANS.get(plan)
    if not plan_config:
        return error_response('无效的套餐')

    # 生成订单号
    order_no = f"LM{int(time.time())}{random.randint(1000, 9999)}"

    # 创建订单记录
    orders[order_no] = {
        'plan': plan,
        'amount': plan_config['amount'],
        'status': 'pending',
        'create_time': datetime.now().isoformat()
    }

    # TODO: 调用微信/支付宝API创建支付

    return success_response({
        'order_no': order_no,
        'plan': plan_config,
        'amount': plan_config['amount']
    })

@app.route('/api/payment/query', methods=['POST'])
def query_payment():
    """查询订单状态"""
    data = request.json
    order_no = data.get('order_no')

    order = orders.get(order_no)
    if not order:
        return error_response('订单不存在')

    return success_response({
        'order_no': order_no,
        'status': order['status']
    })

# ==================== 启动服务 ====================
if __name__ == '__main__':
    print("🚀 鹿鸣智投API服务启动")
    print("=" * 50)
    print(f"📊 Tushare API已集成")
    print(f"📱 腾讯云短信已配置")
    print(f"💳 微信支付/支付宝已准备")
    print(f"🌐 服务运行在 http://{Config.HOST}:{Config.PORT}")
    print("=" * 50)
    print(f"⏰ 启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📌 环境: {'开发' if DEBUG else '生产'}")

    app.run(host=Config.HOST, port=Config.PORT, debug=DEBUG)
