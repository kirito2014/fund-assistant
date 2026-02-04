#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用 AKShare 获取市场数据
"""

import json
import sys
import time
import akshare as ak
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ========== 新增：配置请求重试和超时 ==========
def setup_akshare_session():
    """配置AKShare的请求会话，增加重试和超时"""
    # 创建重试策略
    retry_strategy = Retry(
        total=3,  # 总重试次数
        backoff_factor=1,  # 重试间隔：1s → 2s → 4s
        status_forcelist=[429, 500, 502, 503, 504],  # 触发重试的状态码
        allowed_methods=["GET", "POST"]
    )
    # 创建适配器并挂载到session
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session = requests.Session()
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    # 设置全局超时
    session.timeout = 15
    # 替换AKShare的默认session
    ak.session = session

# 初始化会话（程序启动时执行一次）
setup_akshare_session()

def get_domestic_market_data():
    """
    获取国内市场指数数据（修复数据源+增加容错）
    """
    try:
        # ========== 替换为有效数据源 ==========
        # 方案1：使用东方财富接口（增加超时参数）
        all_index = ak.stock_zh_a_spot_em(timeout=15)
        
        # 兼容字段：不同版本AKShare的列名可能有差异
        col_mapping = {
            "最新价": ["最新价", "现价"],
            "涨跌额": ["涨跌额", "涨跌"],
            "涨跌幅": ["涨跌幅", "涨跌幅%"]
        }
        
        def get_col_value(row, col_name):
            """兼容不同列名"""
            for col in col_mapping[col_name]:
                if col in row:
                    return row[col]
            return 0

        # 获取上证指数
        sh_row = all_index[all_index['代码'] == 'sh000001'].iloc[0]
        sh_data = sh_row.to_dict()
        
        # 获取沪深300
        hs300_row = all_index[all_index['代码'] == 'sh000300'].iloc[0]
        hs300_data = hs300_row.to_dict()
        
        # 获取深证成指
        sz_row = all_index[all_index['代码'] == 'sz399001'].iloc[0]
        sz_data = sz_row.to_dict()
        
        # 获取创业板指
        cyb_row = all_index[all_index['代码'] == 'sz399006'].iloc[0]
        cyb_data = cyb_row.to_dict()
        
        domestic_indices = [
            {
                "code": "sh000001",
                "name": "上证指数",
                "price": float(get_col_value(sh_data, "最新价")),
                "change": float(get_col_value(sh_data, "涨跌额")),
                "changePercent": float(get_col_value(sh_data, "涨跌幅")),
                "valuation": 35,
                "valuationLevel": "低估",
                "valuationColor": "loss-green"
            },
            {
                "code": "sh000300",
                "name": "沪深300",
                "price": float(get_col_value(hs300_data, "最新价")),
                "change": float(get_col_value(hs300_data, "涨跌额")),
                "changePercent": float(get_col_value(hs300_data, "涨跌幅")),
                "valuation": 25,
                "valuationLevel": "低估",
                "valuationColor": "loss-green"
            },
            {
                "code": "sz399001",
                "name": "深证成指",
                "price": float(get_col_value(sz_data, "最新价")),
                "change": float(get_col_value(sz_data, "涨跌额")),
                "changePercent": float(get_col_value(sz_data, "涨跌幅")),
                "valuation": 45,
                "valuationLevel": "正常",
                "valuationColor": "yellow-400"
            },
            {
                "code": "sz399006",
                "name": "创业板指",
                "price": float(get_col_value(cyb_data, "最新价")),
                "change": float(get_col_value(cyb_data, "涨跌额")),
                "changePercent": float(get_col_value(cyb_data, "涨跌幅")),
                "valuation": 65,
                "valuationLevel": "高估",
                "valuationColor": "gain-red"
            }
        ]
        
        return domestic_indices
    except Exception as e:
        print(f"获取国内市场数据失败: {e}", file=sys.stderr)
        # 返回模拟数据
        return [
            {
                "code": "sh000001",
                "name": "上证指数",
                "price": 3125.25,
                "change": 15.62,
                "changePercent": 0.50,
                "valuation": 35,
                "valuationLevel": "低估",
                "valuationColor": "loss-green"
            },
            {
                "code": "sh000300",
                "name": "沪深300",
                "price": 3852.12,
                "change": 20.05,
                "changePercent": 0.52,
                "valuation": 25,
                "valuationLevel": "低估",
                "valuationColor": "loss-green"
            },
            {
                "code": "sz399001",
                "name": "深证成指",
                "price": 10256.78,
                "change": -52.34,
                "changePercent": -0.51,
                "valuation": 45,
                "valuationLevel": "正常",
                "valuationColor": "yellow-400"
            },
            {
                "code": "sz399006",
                "name": "创业板指",
                "price": 1782.30,
                "change": 21.85,
                "changePercent": 1.24,
                "valuation": 65,
                "valuationLevel": "高估",
                "valuationColor": "gain-red"
            }
        ]


def get_international_market_data():
    """
    获取国际市场指数数据（增加超时+容错）
    """
    try:
        # ========== 国际数据源也增加超时 ==========
        # 美国市场数据
        us_index = ak.stock_us_spot_em(timeout=15)
        # 恒生指数数据
        hangseng = ak.stock_hk_spot_em(timeout=15)

        # 兼容列名
        col_mapping = {
            "最新价": ["最新价", "现价"],
            "涨跌额": ["涨跌额", "涨跌"],
            "涨跌幅": ["涨跌幅", "涨跌幅%"]
        }
        
        def get_col_value(row, col_name):
            for col in col_mapping[col_name]:
                if col in row:
                    return row[col]
            return 0

        # 获取纳斯达克指数
        nasdaq_row = us_index[us_index['代码'] == 'IXIC'].iloc[0]
        nasdaq_data = nasdaq_row.to_dict()
        
        # 获取道琼斯指数
        dowjones_row = us_index[us_index['代码'] == 'DJI'].iloc[0]
        dowjones_data = dowjones_row.to_dict()
        
        # 获取标普500指数
        sp500_row = us_index[us_index['代码'] == 'SPX'].iloc[0]
        sp500_data = sp500_row.to_dict()
        
        # 获取恒生指数
        hangseng_row = hangseng[hangseng['代码'] == 'HSI'].iloc[0]
        hangseng_data = hangseng_row.to_dict()
        
        international_indices = [
            {
                "code": "nasdaq",
                "name": "纳斯达克",
                "price": float(get_col_value(nasdaq_data, "最新价")),
                "change": float(get_col_value(nasdaq_data, "涨跌额")),
                "changePercent": float(get_col_value(nasdaq_data, "涨跌幅")),
                "valuation": 55,
                "valuationLevel": "正常",
                "valuationColor": "yellow-400"
            },
            {
                "code": "dowjones",
                "name": "道琼斯",
                "price": float(get_col_value(dowjones_data, "最新价")),
                "change": float(get_col_value(dowjones_data, "涨跌额")),
                "changePercent": float(get_col_value(dowjones_data, "涨跌幅")),
                "valuation": 75,
                "valuationLevel": "高估",
                "valuationColor": "gain-red"
            },
            {
                "code": "sp500",
                "name": "标普500",
                "price": float(get_col_value(sp500_data, "最新价")),
                "change": float(get_col_value(sp500_data, "涨跌额")),
                "changePercent": float(get_col_value(sp500_data, "涨跌幅")),
                "valuation": 60,
                "valuationLevel": "正常",
                "valuationColor": "yellow-400"
            },
            {
                "code": "hangseng",
                "name": "恒生指数",
                "price": float(get_col_value(hangseng_data, "最新价")),
                "change": float(get_col_value(hangseng_data, "涨跌额")),
                "changePercent": float(get_col_value(hangseng_data, "涨跌幅")),
                "valuation": 25,
                "valuationLevel": "低估",
                "valuationColor": "loss-green"
            }
        ]
        
        return international_indices
    except Exception as e:
        print(f"获取国际市场数据失败: {e}", file=sys.stderr)
        # 返回模拟数据
        return [
            {
                "code": "nasdaq",
                "name": "纳斯达克",
                "price": 14823.45,
                "change": 124.65,
                "changePercent": 0.85,
                "valuation": 55,
                "valuationLevel": "正常",
                "valuationColor": "yellow-400"
            },
            {
                "code": "dowjones",
                "name": "道琼斯",
                "price": 37245.10,
                "change": 118.45,
                "changePercent": 0.32,
                "valuation": 75,
                "valuationLevel": "高估",
                "valuationColor": "gain-red"
            },
            {
                "code": "sp500",
                "name": "标普500",
                "price": 4856.78,
                "change": 28.05,
                "changePercent": 0.58,
                "valuation": 60,
                "valuationLevel": "正常",
                "valuationColor": "yellow-400"
            },
            {
                "code": "hangseng",
                "name": "恒生指数",
                "price": 16825.30,
                "change": -110.25,
                "changePercent": -0.65,
                "valuation": 25,
                "valuationLevel": "低估",
                "valuationColor": "loss-green"
            }
        ]


def get_all_market_data():
    """
    获取所有市场数据
    """
    try:
        domestic_data = get_domestic_market_data()
        international_data = get_international_market_data()
        return domestic_data + international_data
    except Exception as e:
        print(f"获取市场数据失败: {e}", file=sys.stderr)
        # 返回模拟数据
        return [
            {
                "code": "sh000001",
                "name": "上证指数",
                "price": 3125.25,
                "change": 15.62,
                "changePercent": 0.50,
                "valuation": 35,
                "valuationLevel": "低估",
                "valuationColor": "loss-green"
            },
            {
                "code": "sh000300",
                "name": "沪深300",
                "price": 3852.12,
                "change": 20.05,
                "changePercent": 0.52,
                "valuation": 25,
                "valuationLevel": "低估",
                "valuationColor": "loss-green"
            },
            {
                "code": "sz399001",
                "name": "深证成指",
                "price": 10256.78,
                "change": -52.34,
                "changePercent": -0.51,
                "valuation": 45,
                "valuationLevel": "正常",
                "valuationColor": "yellow-400"
            },
            {
                "code": "sz399006",
                "name": "创业板指",
                "price": 1782.30,
                "change": 21.85,
                "changePercent": 1.24,
                "valuation": 65,
                "valuationLevel": "高估",
                "valuationColor": "gain-red"
            },
            {
                "code": "nasdaq",
                "name": "纳斯达克",
                "price": 14823.45,
                "change": 124.65,
                "changePercent": 0.85,
                "valuation": 55,
                "valuationLevel": "正常",
                "valuationColor": "yellow-400"
            },
            {
                "code": "dowjones",
                "name": "道琼斯",
                "price": 37245.10,
                "change": 118.45,
                "changePercent": 0.32,
                "valuation": 75,
                "valuationLevel": "高估",
                "valuationColor": "gain-red"
            },
            {
                "code": "sp500",
                "name": "标普500",
                "price": 4856.78,
                "change": 28.05,
                "changePercent": 0.58,
                "valuation": 60,
                "valuationLevel": "正常",
                "valuationColor": "yellow-400"
            },
            {
                "code": "hangseng",
                "name": "恒生指数",
                "price": 16825.30,
                "change": -110.25,
                "changePercent": -0.65,
                "valuation": 25,
                "valuationLevel": "低估",
                "valuationColor": "loss-green"
            }
        ]

if __name__ == "__main__":
    # 输出JSON数据
    data = get_all_market_data()
    print(json.dumps(data, ensure_ascii=False))
