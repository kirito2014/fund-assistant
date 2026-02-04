import { NextRequest, NextResponse } from 'next/server';

// 市场指数类型定义
export interface MarketIndex {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  valuation: number;
  valuationLevel: string;
  valuationColor: string;
}

// 指数代码映射
const INDEX_CODES = {
  'sh000001': '上证指数',
  'sh000300': '沪深300',
  'sz399001': '深证成指',
  'sz399006': '创业板指'
};

// 获取市场指数估值数据
export async function GET(request: NextRequest) {
  try {
    // 构建指数代码字符串
    const secids = Object.keys(INDEX_CODES).map(code => {
      if (code.startsWith('sh')) {
        return `1.${code.slice(2)}`;
      } else {
        return `0.${code.slice(2)}`;
      }
    }).join(',');

    // 东方财富API URL - 获取基本市场数据
    const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=${secids}&_=${Date.now()}`;

    // 获取数据
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const data = await response.json();
    
    // 处理数据
    if (data.data && data.data.diff) {
      const indices: MarketIndex[] = data.data.diff.map((item: any) => {
        const code = item.f12;
        const fullCode = item.f13 === 1 ? `sh${code}` : `sz${code}`;
        const name = INDEX_CODES[fullCode as keyof typeof INDEX_CODES] || item.f14;
        const price = item.f2;
        const change = item.f4;
        const changePercent = item.f3;
        
        // 尝试从东方财富获取估值数据
        // 注意：东方财富可能没有直接的估值API，这里使用模拟数据作为替代
        // 实际项目中可以考虑：
        // 1. 使用东方财富的PE/PB数据接口
        // 2. 从其他金融数据提供商获取
        // 3. 基于历史数据计算估值水平
        const valuation = getMockValuation(fullCode);
        const { level, color } = getValuationLevel(valuation);

        return {
          code: fullCode,
          name,
          price,
          change,
          changePercent,
          valuation,
          valuationLevel: level,
          valuationColor: color
        };
      });

      return NextResponse.json(indices);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error getting market valuation:', error);
    // 错误时返回模拟数据
    return NextResponse.json(getMockIndices());
  }
}

// 获取模拟估值数据
function getMockValuation(code: string): number {
  const valuations: { [key: string]: number } = {
    'sh000001': 35,
    'sh000300': 25,
    'sz399001': 45,
    'sz399006': 65
  };
  return valuations[code] || 50;
}

// 获取估值水平
function getValuationLevel(valuation: number): { level: string; color: string } {
  if (valuation < 20) {
    return { level: '极低估', color: 'loss-green' };
  } else if (valuation < 40) {
    return { level: '低估', color: 'loss-green' };
  } else if (valuation < 60) {
    return { level: '正常', color: 'yellow-400' };
  } else if (valuation < 80) {
    return { level: '高估', color: 'gain-red' };
  } else {
    return { level: '极高估', color: 'gain-red' };
  }
}

// 获取模拟指数数据
function getMockIndices(): MarketIndex[] {
  return [
    {
      code: 'sh000001',
      name: '上证指数',
      price: 3125.25,
      change: 15.62,
      changePercent: 0.50,
      valuation: 35,
      valuationLevel: '低估',
      valuationColor: 'loss-green'
    },
    {
      code: 'sh000300',
      name: '沪深300',
      price: 3852.12,
      change: 20.05,
      changePercent: 0.52,
      valuation: 25,
      valuationLevel: '低估',
      valuationColor: 'loss-green'
    },
    {
      code: 'sz399001',
      name: '深证成指',
      price: 10256.78,
      change: -52.34,
      changePercent: -0.51,
      valuation: 45,
      valuationLevel: '正常',
      valuationColor: 'yellow-400'
    },
    {
      code: 'sz399006',
      name: '创业板指',
      price: 1782.30,
      change: 21.85,
      changePercent: 1.24,
      valuation: 65,
      valuationLevel: '高估',
      valuationColor: 'gain-red'
    }
  ];
}
