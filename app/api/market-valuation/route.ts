import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';

const pipelineAsync = promisify(pipeline);

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

// 指数代码映射（使用东方财富的指数代码格式）
const INDEX_CODES = {
  '1.000001': '上证指数',
  '1.000300': '沪深300',
  '0.399001': '深证成指',
  '0.399006': '创业板指',
  '0.399005': '中小板指',
  '1.000688': '科创50'
};

// 国际市场指数代码映射（使用东方财富的国际指数代码）
const INTERNATIONAL_INDEX_CODES = {
  '100.NDX': '纳斯达克',
  '100.DJIA': '道琼斯',
  '100.SPX': '标普500',
  '100.HSI': '恒生指数'
};

// 获取市场指数估值数据
export async function GET(request: NextRequest) {
  try {
    // 合并所有指数代码
    const allIndexCodes = {
      ...INDEX_CODES,
      ...INTERNATIONAL_INDEX_CODES
    };

    // 构建指数代码字符串
    const secids = Object.keys(allIndexCodes).join(',');

    // 东方财富API URL - 获取基本市场数据
    const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=${secids}&_=${Date.now()}`;

    // 获取数据
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const data: any = await response.json();
    
    // 处理数据
    const indices: MarketIndex[] = [];
    
    // 处理所有市场数据
    if (data.data && data.data.diff) {
      const allIndices = data.data.diff.map((item: { f12: string; f13: number; f14: string; f2: number; f4: number; f3: number }) => {
        // 构建完整的指数代码
        const code = item.f12;
        const marketCode = item.f13;
        const fullCode = `${marketCode}.${code}`;
        
        // 获取指数名称
        const name = allIndexCodes[fullCode as keyof typeof allIndexCodes] || item.f14;
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

        // 转换为前端使用的代码格式
        let frontendCode = fullCode;
        if (fullCode.startsWith('1.')) {
          frontendCode = `sh${fullCode.slice(2)}`;
        } else if (fullCode.startsWith('0.')) {
          frontendCode = `sz${fullCode.slice(2)}`;
        } else if (fullCode.startsWith('100.')) {
          // 国际指数映射
          const codeMap: { [key: string]: string } = {
            '100.NDX': 'nasdaq',
            '100.DJIA': 'dowjones',
            '100.SPX': 'sp500',
            '100.HSI': 'hangseng'
          };
          frontendCode = codeMap[fullCode] || fullCode;
        }

        return {
          code: frontendCode,
          name,
          price,
          change,
          changePercent,
          valuation,
          valuationLevel: level,
          valuationColor: color
        };
      });
      
      indices.push(...allIndices);
    }

    return NextResponse.json(indices);
  } catch (error) {
    console.error('Error getting market valuation:', error);
    // 错误时返回模拟数据，包括国际市场数据
    const mockIndices = getMockIndices();
    const mockInternationalData: MarketIndex[] = [
      {
        code: 'nasdaq',
        name: '纳斯达克',
        price: 14823.45,
        change: 124.65,
        changePercent: 0.85,
        valuation: 55,
        valuationLevel: '正常',
        valuationColor: 'yellow-400'
      },
      {
        code: 'dowjones',
        name: '道琼斯',
        price: 37245.10,
        change: 118.45,
        changePercent: 0.32,
        valuation: 75,
        valuationLevel: '高估',
        valuationColor: 'gain-red'
      },
      {
        code: 'sp500',
        name: '标普500',
        price: 4856.78,
        change: 28.05,
        changePercent: 0.58,
        valuation: 60,
        valuationLevel: '正常',
        valuationColor: 'yellow-400'
      },
      {
        code: 'hangseng',
        name: '恒生指数',
        price: 16825.30,
        change: -110.25,
        changePercent: -0.65,
        valuation: 25,
        valuationLevel: '低估',
        valuationColor: 'loss-green'
      }
    ];
    
    return NextResponse.json([...mockIndices, ...mockInternationalData]);
  }
}

// 获取模拟估值数据
function getMockValuation(code: string): number {
  const valuations: { [key: string]: number } = {
    '1.000001': 35,
    '1.000300': 25,
    '0.399001': 45,
    '0.399006': 65,
    '0.399005': 50,
    '1.000688': 70,
    '100.NDX': 55,
    '100.DJIA': 75,
    '100.SPX': 60,
    '100.HSI': 25
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
    },
    {
      code: 'sz399005',
      name: '中小板指',
      price: 6520.45,
      change: 12.36,
      changePercent: 0.19,
      valuation: 50,
      valuationLevel: '正常',
      valuationColor: 'yellow-400'
    },
    {
      code: 'sh000688',
      name: '科创50',
      price: 1050.78,
      change: -8.25,
      changePercent: -0.78,
      valuation: 70,
      valuationLevel: '高估',
      valuationColor: 'gain-red'
    }
  ];
}
