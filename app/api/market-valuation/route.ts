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

// 指数代码映射
const INDEX_CODES = {
  'sh000001': '上证指数',
  'sh000300': '沪深300',
  'sz399001': '深证成指',
  'sz399006': '创业板指'
};

// 国际市场指数代码映射（使用东方财富的国际指数代码）
const INTERNATIONAL_INDEX_CODES = {
  'nasdaq': '纳斯达克',
  'dowjones': '道琼斯',
  'sp500': '标普500',
  'hangseng': '恒生指数'
};

// 获取国际市场指数数据（使用Python脚本）
async function fetchInternationalMarketData(): Promise<MarketIndex[]> {
  try {
    // 执行Python脚本获取市场数据
    const allData = await executePythonScript();
    // 过滤出国际市场数据
    const internationalIndices = allData.filter(item => 
      ['nasdaq', 'dowjones', 'sp500', 'hangseng'].includes(item.code)
    );
    // 确保返回的数据包含正确的中文名称和估值水平
    return internationalIndices.map(item => {
      // 使用getValuationLevel函数计算正确的估值水平，避免使用Python脚本中可能编码错误的估值水平
      const { level, color } = getValuationLevel(item.valuation);
      return {
        ...item,
        name: INTERNATIONAL_INDEX_CODES[item.code as keyof typeof INTERNATIONAL_INDEX_CODES] || item.name,
        valuationLevel: level,
        valuationColor: color
      };
    });
  } catch (error) {
    console.error('Error fetching international market data:', error);
    // 错误时返回模拟数据
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
    return mockInternationalData;
  }
}

// 执行Python脚本获取市场数据
async function executePythonScript(): Promise<MarketIndex[]> {
  return new Promise((resolve, reject) => {
    let pythonProcess: any;
    // 设置Python进程的超时时间
    const timeoutId = setTimeout(() => {
      reject(new Error('Python脚本执行超时'));
      if (pythonProcess) {
        pythonProcess.kill();
      }
    }, 15000);

    pythonProcess = spawn('python', ['market_data.py'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString('utf8');
    });

    pythonProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code: number) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        try {
          const data = JSON.parse(output);
          resolve(data);
        } catch (error: any) {
          console.error('解析Python脚本输出失败:', error);
          console.error('Python脚本输出:', output);
          reject(new Error('解析Python脚本输出失败'));
        }
      } else {
        console.error('Python脚本执行失败:', errorOutput);
        reject(new Error(`Python脚本执行失败: ${errorOutput}`));
      }
    });

    pythonProcess.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      console.error('启动Python进程失败:', error);
      reject(new Error(`启动Python进程失败: ${error.message}`));
    });
  });
}

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

    const data: any = await response.json();
    
    // 处理数据
    const indices: MarketIndex[] = [];
    
    // 处理国内市场数据
    if (data.data && data.data.diff) {
      const domesticIndices = data.data.diff.map((item: { f12: string; f13: number; f14: string; f2: number; f4: number; f3: number }) => {
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
      
      indices.push(...domesticIndices);
    }
    
    // 获取国际市场数据（使用Python脚本）
    const internationalIndices = await fetchInternationalMarketData();
    indices.push(...internationalIndices);

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
