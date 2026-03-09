#!/usr/bin/env python3
"""
鹿鸣智投 - 虚拟盘组合调仓脚本
根据评分引擎排名前6方案，自动执行调仓交易并记录交易日记

目标持仓（按评分排序）：
  ADBE    81分  US   ~16,336  16.3%
  腾讯    80分  HK   ~16,422  16.4%
  美团    79分  HK   ~16,445  16.5%
  新华保险 78分  A    ~14,680  14.7%
  阿里    76分  HK   ~15,795  15.8%
  中国平安 73分  A    ~18,800  18.8%
  现金                ~1,422   1.4%

使用方法：
  python3 rebalance_portfolio.py

运行前确保能访问 http://43.136.38.87
"""

import json
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

API_BASE = "http://43.136.38.87/api"
USERNAME = "luming"
PASSWORD = "tia870nm@11"

# 目标持仓方案
TARGET_PORTFOLIO = [
    {"code": "ADBE",   "name": "Adobe",   "market": "US", "score": 81, "target_value": 16336},
    {"code": "00700",  "name": "腾讯控股", "market": "HK", "score": 80, "target_value": 16422},
    {"code": "03690",  "name": "美团",     "market": "HK", "score": 79, "target_value": 16445},
    {"code": "601336", "name": "新华保险", "market": "A",  "score": 78, "target_value": 14680},
    {"code": "09988",  "name": "阿里巴巴", "market": "HK", "score": 76, "target_value": 15795},
    {"code": "601318", "name": "中国平安", "market": "A",  "score": 73, "target_value": 18800},
]

TARGET_CASH = 1422  # 目标现金


def api_request(path, method="GET", data=None, token=None):
    """发送 API 请求"""
    url = f"{API_BASE}{path}"
    headers = {"Content-Type": "application/json", "User-Agent": "LumingRebalance/1.0"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        resp = urllib.request.urlopen(req, timeout=30)
        return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  ❌ HTTP {e.code}: {error_body[:200]}")
        return None
    except Exception as e:
        print(f"  ❌ 网络错误: {e}")
        return None


def login():
    """登录获取 token"""
    print("🔐 正在登录...")
    result = api_request("/auth/login", method="POST", data={
        "username": USERNAME,
        "password": PASSWORD,
    })
    if result and result.get("success"):
        print(f"  ✅ 登录成功: {result['user']['phone']}")
        return result["token"]
    else:
        print("  ❌ 登录失败")
        sys.exit(1)


def get_user_data(token):
    """拉取用户数据"""
    print("📥 拉取用户数据...")
    result = api_request(f"/user-data/{USERNAME}", method="GET", token=token)
    if result and "data" in result:
        data = result["data"]
        print(f"  ✅ 拉取成功 (更新于 {result.get('updated_at', '未知')})")
        sim = data.get("simTrading") or {}
        print(f"  💰 模拟盘现金: ¥{sim.get('cash', 'N/A')}")
        positions = sim.get("positions", [])
        print(f"  📊 当前持仓: {len(positions)} 只")
        for p in positions:
            print(f"     {p['code']} {p['name']} | {p['shares']}股 × ¥{p['costPrice']:.2f} = ¥{p['costPrice']*p['shares']:.0f}")
        diary = data.get("tradingDiary", [])
        print(f"  📝 交易日记: {len(diary)} 条")
        return data
    else:
        print("  ❌ 拉取失败")
        sys.exit(1)


def get_stock_prices(codes):
    """获取实时股价"""
    codes_str = ",".join(codes)
    print(f"📈 获取实时行情: {codes_str}")
    result = api_request(f"/stocks/prices?codes={codes_str}")
    if result and "data" in result:
        prices = result["data"]
        for code, info in prices.items():
            pct = info.get("changePct", 0)
            sign = "+" if pct >= 0 else ""
            print(f"  {code}: ¥{info['price']:.2f} ({sign}{pct:.2f}%)")
        return prices
    else:
        print("  ⚠️ 行情获取失败，使用目标价计算")
        return {}


def get_stock_scores(codes):
    """
    获取当前评分 - 通过 fundamentals + prices 推算
    由于评分在前端计算，这里通过 fundamentals API 获取基本面数据
    """
    print("🧮 获取基本面数据...")
    scores = {}
    for code in codes:
        result = api_request(f"/financial/fundamentals/{code}")
        if result:
            pe = result.get("pe_ttm") or result.get("pe", 0) or 0
            roe = result.get("roe", 0) or 0
            growth = result.get("revenue_growth_yoy", 0) or 0
            margin = result.get("net_margin", 0) or 0

            # 简化评分：模拟前端 stockAnalyzerEnhanced 的逻辑
            value_score = 85 if pe < 15 else (70 if pe < 25 else (50 if pe < 40 else 30))
            quality_score = 85 if roe > 20 else (70 if roe > 15 else (55 if roe > 10 else 35))
            growth_score = 85 if growth > 20 else (70 if growth > 10 else (55 if growth > 0 else 35))

            # 加权: value 20% + growth 25% + quality 25% + 技术/情绪用默认60
            overall = (value_score * 0.20 + growth_score * 0.25 +
                       quality_score * 0.25 + 60 * 0.15 + 60 * 0.15)
            overall = max(0, min(100, overall))
            scores[code] = round(overall)
            print(f"  {code}: PE={pe:.1f} ROE={roe:.1f}% → 估算评分≈{scores[code]}")
        else:
            print(f"  {code}: 基本面数据不可用")
    return scores


def build_rebalance_plan(current_data, prices):
    """构建调仓计划"""
    print("\n" + "=" * 60)
    print("📋 调仓计划")
    print("=" * 60)

    sim = current_data.get("simTrading") or {}
    current_cash = sim.get("cash", 100000)
    current_positions = sim.get("positions", [])
    current_trades = sim.get("trades", [])

    # 当前持仓代码
    current_codes = {p["code"] for p in current_positions}
    target_codes = {t["code"] for t in TARGET_PORTFOLIO}

    # 需要卖出的（不在目标中的）
    to_sell = [p for p in current_positions if p["code"] not in target_codes]

    # 需要买入的（不在当前中的）
    to_buy = [t for t in TARGET_PORTFOLIO if t["code"] not in current_codes]

    # 需要调整仓位的（已持有且在目标中的）
    to_adjust = [t for t in TARGET_PORTFOLIO if t["code"] in current_codes]

    sell_actions = []
    buy_actions = []

    # 1. 卖出计划
    if to_sell:
        print("\n🔴 卖出:")
        for p in to_sell:
            price = prices.get(p["code"], {}).get("price", p.get("currentPrice", p["costPrice"]))
            amount = price * p["shares"]
            sell_actions.append({
                "position": p,
                "price": price,
                "shares": p["shares"],
                "amount": amount,
            })
            print(f"  清仓 {p['code']} {p['name']} | {p['shares']}股 × ¥{price:.2f} = ¥{amount:.0f}")

    # 2. 调整仓位
    if to_adjust:
        print("\n🟡 调整:")
        for t in to_adjust:
            current_p = next(p for p in current_positions if p["code"] == t["code"])
            price = prices.get(t["code"], {}).get("price", current_p.get("currentPrice", current_p["costPrice"]))
            current_value = price * current_p["shares"]
            target_value = t["target_value"]
            diff = target_value - current_value
            if abs(diff) > 500:  # 超过500元才调整
                diff_shares = int(diff / price)
                if diff_shares > 0:
                    buy_actions.append({
                        "code": t["code"],
                        "name": t["name"],
                        "market": t["market"],
                        "price": price,
                        "shares": diff_shares,
                        "amount": diff_shares * price,
                        "score": t["score"],
                        "type": "adjust_buy",
                    })
                    print(f"  加仓 {t['code']} {t['name']} +{diff_shares}股 (¥{current_value:.0f} → ¥{target_value:.0f})")
                elif diff_shares < 0:
                    sell_actions.append({
                        "position": current_p,
                        "price": price,
                        "shares": abs(diff_shares),
                        "amount": abs(diff_shares) * price,
                        "type": "adjust_sell",
                    })
                    print(f"  减仓 {t['code']} {t['name']} {diff_shares}股 (¥{current_value:.0f} → ¥{target_value:.0f})")
            else:
                print(f"  保持 {t['code']} {t['name']} (偏差 ¥{diff:.0f} < ¥500)")

    # 3. 新建仓位
    if to_buy:
        print("\n🟢 买入:")
        for t in to_buy:
            price = prices.get(t["code"], {}).get("price", 0)
            if price <= 0:
                # 用目标仓位反算价格
                price = t["target_value"] / 100  # 假设100股
                print(f"  ⚠️ {t['code']} 无实时价，使用估算价 ¥{price:.2f}")

            shares = max(1, int(t["target_value"] / price))
            # A股和港股要求整手（A股100股/手，港股每手不同）
            if t["market"] == "A":
                shares = max(100, (shares // 100) * 100)

            amount = shares * price
            buy_actions.append({
                "code": t["code"],
                "name": t["name"],
                "market": t["market"],
                "price": price,
                "shares": shares,
                "amount": amount,
                "score": t["score"],
                "type": "new_buy",
            })
            print(f"  建仓 {t['code']} {t['name']} | {shares}股 × ¥{price:.2f} = ¥{amount:.0f} (评分{t['score']})")

    # 计算资金情况
    total_sell = sum(a["amount"] for a in sell_actions)
    total_buy = sum(a["amount"] for a in buy_actions)
    cash_after = current_cash + total_sell - total_buy

    print(f"\n💰 资金变动: 现金 ¥{current_cash:.0f} + 卖出 ¥{total_sell:.0f} - 买入 ¥{total_buy:.0f} = ¥{cash_after:.0f}")

    if cash_after < 0:
        print("  ⚠️ 资金不足！需要减少买入量")
        # 按比例缩减买入
        ratio = (current_cash + total_sell) * 0.98 / total_buy  # 留2%余量
        for a in buy_actions:
            a["shares"] = max(1, int(a["shares"] * ratio))
            if a.get("market") == "A":
                a["shares"] = max(100, (a["shares"] // 100) * 100)
            a["amount"] = a["shares"] * a["price"]
        total_buy = sum(a["amount"] for a in buy_actions)
        cash_after = current_cash + total_sell - total_buy
        print(f"  调整后: ¥{cash_after:.0f}")

    return sell_actions, buy_actions, current_cash, current_positions, current_trades


def execute_rebalance(token, current_data, sell_actions, buy_actions,
                      current_cash, current_positions, current_trades):
    """执行调仓并写入交易日记"""
    print("\n" + "=" * 60)
    print("🚀 执行调仓交易")
    print("=" * 60)

    today = datetime.now().strftime("%Y-%m-%d")
    today_iso = datetime.now().isoformat()
    new_cash = current_cash
    new_positions = list(current_positions)  # 深拷贝
    new_trades = list(current_trades)
    diary = list(current_data.get("tradingDiary", []))

    # 1. 执行卖出
    for action in sell_actions:
        pos = action["position"]
        shares = action["shares"]
        price = action["price"]
        amount = shares * price

        print(f"\n  🔴 卖出 {pos['code']} {pos['name']} {shares}股 × ¥{price:.2f} = ¥{amount:.0f}")

        # 更新持仓
        remaining = pos["shares"] - shares
        if remaining <= 0:
            # 清仓
            new_positions = [p for p in new_positions if p["code"] != pos["code"]]
            print(f"     → 清仓完成")
        else:
            # 减仓
            for i, p in enumerate(new_positions):
                if p["code"] == pos["code"]:
                    new_positions[i] = {**p, "shares": remaining}
                    break
            print(f"     → 剩余 {remaining} 股")

        # 加现金
        new_cash += amount

        # 记录交易
        trade_id = str(int(time.time() * 1000))
        new_trades.insert(0, {
            "id": trade_id,
            "code": pos["code"],
            "name": pos["name"],
            "type": "sell",
            "shares": shares,
            "price": price,
            "amount": amount,
            "date": today_iso,
        })

        # 查找该股票在目标中的评分，如果不在目标中说明是被清出的
        target_item = next((t for t in TARGET_PORTFOLIO if t["code"] == pos["code"]), None)
        score_text = f"当前评分{target_item['score']}分" if target_item else "评分不在Top6，清仓调出"

        # 写交易日记
        diary.insert(0, {
            "id": f"sim_{trade_id}",
            "date": today_iso,
            "type": "sell",
            "stock": {
                "code": pos["code"],
                "name": pos["name"],
                "market": pos.get("market", ""),
            },
            "price": price,
            "quantity": shares,
            "amount": amount,
            "reason": f"{today}，按照评分调整，{score_text}",
            "analysis": "",
            "expectation": "",
            "createdAt": today_iso,
            "portfolioType": "simulation",
        })
        time.sleep(0.01)  # 确保 ID 唯一

    # 2. 执行买入
    for action in buy_actions:
        code = action["code"]
        name = action["name"]
        market = action["market"]
        shares = action["shares"]
        price = action["price"]
        amount = shares * price
        score = action["score"]

        print(f"\n  🟢 买入 {code} {name} {shares}股 × ¥{price:.2f} = ¥{amount:.0f}")

        if amount > new_cash:
            print(f"     ⚠️ 资金不足 (需 ¥{amount:.0f}, 可用 ¥{new_cash:.0f})，跳过")
            continue

        # 扣现金
        new_cash -= amount

        # 更新持仓
        existing = next((p for p in new_positions if p["code"] == code), None)
        if existing:
            # 加仓：计算新均价
            old_total = existing["costPrice"] * existing["shares"]
            new_total_shares = existing["shares"] + shares
            new_cost_price = (old_total + amount) / new_total_shares
            for i, p in enumerate(new_positions):
                if p["code"] == code:
                    new_positions[i] = {
                        **p,
                        "shares": new_total_shares,
                        "costPrice": round(new_cost_price, 4),
                        "currentPrice": price,
                        "profit": (price - new_cost_price) * new_total_shares,
                        "profitPct": ((price - new_cost_price) / new_cost_price * 100) if new_cost_price > 0 else 0,
                    }
                    break
            print(f"     → 加仓完成，总持 {new_total_shares} 股，均价 ¥{new_cost_price:.2f}")
        else:
            # 新建仓位
            new_positions.append({
                "id": str(int(time.time() * 1000)),
                "code": code,
                "name": name,
                "market": market,
                "shares": shares,
                "costPrice": price,
                "currentPrice": price,
                "previousPrice": price,
                "profit": 0,
                "profitPct": 0,
                "buyDate": today_iso,
            })
            print(f"     → 建仓完成")

        # 记录交易
        trade_id = str(int(time.time() * 1000))
        new_trades.insert(0, {
            "id": trade_id,
            "code": code,
            "name": name,
            "type": "buy",
            "shares": shares,
            "price": price,
            "amount": amount,
            "date": today_iso,
        })

        # 写交易日记
        diary.insert(0, {
            "id": f"sim_{trade_id}",
            "date": today_iso,
            "type": "buy",
            "stock": {
                "code": code,
                "name": name,
                "market": market,
            },
            "price": price,
            "quantity": shares,
            "amount": amount,
            "reason": f"{today}，按照评分调整，当前评分{score}分",
            "analysis": "",
            "expectation": "",
            "createdAt": today_iso,
            "portfolioType": "simulation",
        })
        time.sleep(0.01)

    print(f"\n  💰 剩余现金: ¥{new_cash:.0f}")

    return new_cash, new_positions, new_trades, diary


def push_data(token, current_data, new_cash, new_positions, new_trades, diary):
    """推送更新后的数据到服务器"""
    print("\n" + "=" * 60)
    print("📤 同步数据到服务器")
    print("=" * 60)

    # 构建完整 payload
    payload = {
        "data": {
            "watchlist": current_data.get("watchlist", []),
            "watchlistGroups": current_data.get("watchlistGroups", []),
            "holdings": current_data.get("holdings", []),
            "simTrading": {
                "cash": round(new_cash, 2),
                "positions": new_positions,
                "trades": new_trades,
            },
            "tradingDiary": diary,
            "syncedAt": datetime.now().isoformat(),
        }
    }

    result = api_request(f"/user-data/{USERNAME}", method="PUT", data=payload, token=token)
    if result and result.get("success"):
        print(f"  ✅ 同步成功 (updated_at: {result.get('updated_at', '')})")
        return True
    else:
        print("  ❌ 同步失败！")
        # 保存到本地文件作为备份
        backup_file = f"rebalance_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(backup_file, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        print(f"  📁 数据已备份到 {backup_file}")
        return False


def main():
    print("=" * 60)
    print("🦌 鹿鸣智投 - 虚拟盘调仓脚本")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 1. 登录
    token = login()

    # 2. 拉取当前数据
    current_data = get_user_data(token)

    # 3. 获取目标股票实时行情
    all_codes = [t["code"] for t in TARGET_PORTFOLIO]
    sim = current_data.get("simTrading") or {}
    current_positions = sim.get("positions", [])
    existing_codes = [p["code"] for p in current_positions]
    # 合并所有需要查价的代码
    price_codes = list(set(all_codes + existing_codes))
    prices = get_stock_prices(price_codes)

    # 4. 获取基本面评分（可选，用于对比）
    scores = get_stock_scores(all_codes)

    # 5. 对比评分
    print("\n" + "=" * 60)
    print("📊 评分对比（方案评分 vs 当前估算评分）")
    print("=" * 60)
    all_match = True
    for t in TARGET_PORTFOLIO:
        plan_score = t["score"]
        current_score = scores.get(t["code"], "N/A")
        match = "✅" if isinstance(current_score, (int, float)) and abs(current_score - plan_score) < 10 else "⚠️"
        if match == "⚠️":
            all_match = False
        print(f"  {t['code']:8s} {t['name']:8s} | 方案{plan_score}分 | 当前≈{current_score}分 {match}")

    # 6. 确认执行
    print("\n" + "=" * 60)
    if not all_match:
        print("⚠️ 部分评分有偏差，但基本面评分为简化估算，实际前端评分可能不同")
    print("是否继续执行调仓？(y/n): ", end="")
    confirm = input().strip().lower()
    if confirm not in ("y", "yes", ""):
        print("❌ 已取消")
        sys.exit(0)

    # 7. 构建调仓计划
    sell_actions, buy_actions, cash, positions, trades = build_rebalance_plan(current_data, prices)

    if not sell_actions and not buy_actions:
        print("\n✅ 当前持仓已符合目标，无需调仓")
        sys.exit(0)

    # 8. 二次确认
    print(f"\n确认执行 {len(sell_actions)} 笔卖出 + {len(buy_actions)} 笔买入？(y/n): ", end="")
    confirm2 = input().strip().lower()
    if confirm2 not in ("y", "yes", ""):
        print("❌ 已取消")
        sys.exit(0)

    # 9. 执行
    new_cash, new_positions, new_trades, diary = execute_rebalance(
        token, current_data, sell_actions, buy_actions, cash, positions, trades
    )

    # 10. 推送
    push_data(token, current_data, new_cash, new_positions, new_trades, diary)

    # 11. 最终汇总
    print("\n" + "=" * 60)
    print("✅ 调仓完成！最终持仓：")
    print("=" * 60)
    total_value = 0
    for p in new_positions:
        value = p["currentPrice"] * p["shares"]
        total_value += value
        print(f"  {p['code']:8s} {p['name']:8s} | {p['shares']}股 × ¥{p['currentPrice']:.2f} = ¥{value:.0f}")
    print(f"  {'现金':8s} {'':8s} | ¥{new_cash:.0f}")
    print(f"  {'总资产':8s} {'':8s} | ¥{total_value + new_cash:.0f}")
    print(f"\n📝 已为每笔交易写入交易日记（格式：交易日期，按照评分调整，当前评分**分）")


if __name__ == "__main__":
    main()
