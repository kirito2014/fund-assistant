import { NextRequest, NextResponse } from 'next/server';
import { getHolidayData, getMarketStatus } from '@/libs/market-status';

// 获取市场状态
export async function GET(request: NextRequest) {
  try {
    // 获取节假日数据
    const holidayData = await getHolidayData();
    // 获取市场状态
    const marketStatus = getMarketStatus(holidayData);
    
    return NextResponse.json(marketStatus);
  } catch (error) {
    console.error('Error getting market status:', error);
    // 错误时返回默认状态
    return NextResponse.json({
      status: '休市',
      statusColor: 'red',
      isTradingDay: false,
      isTradingTime: false,
      currentTime: new Date().toISOString(),
    });
  }
}
