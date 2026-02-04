// 节假日类型定义
interface HolidayData {
  [year: string]: {
    [date: string]: {
      holiday: boolean;
      name?: string;
    };
  };
}

// 市场状态类型定义
export interface MarketStatus {
  status: string;
  statusColor: string;
  isTradingDay: boolean;
  isTradingTime: boolean;
  currentTime: string;
}

// 获取节假日数据
export async function getHolidayData(): Promise<HolidayData> {
  try {
    const response = await fetch('http://x2rr.github.io/funds/holiday.json');
    if (!response.ok) {
      throw new Error('Failed to fetch holiday data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching holiday data:', error);
    return {};
  }
}

// 检查是否是节假日
export function checkHoliday(date: Date, holidayData: HolidayData): boolean {
  const nowMonth = date.getMonth() + 1;
  const nowYear = date.getFullYear();
  const strDate = date.getDate();

  // 格式化月份和日期为两位数
  const formattedMonth = nowMonth >= 1 && nowMonth <= 9 ? `0${nowMonth}` : `${nowMonth}`;
  const formattedDate = strDate >= 1 && strDate <= 9 ? `0${strDate}` : `${strDate}`;

  const nowDate = `${formattedMonth}-${formattedDate}`;
  const yearData = holidayData[nowYear.toString()];

  if (yearData && yearData[nowDate]) {
    return yearData[nowDate].holiday;
  }

  return false;
}

// 转换为东8区时间
export function getBeijingTime(): Date {
  const zoneOffset = 8;
  const offset8 = new Date().getTimezoneOffset() * 60 * 1000;
  const nowDate8 = new Date().getTime();
  return new Date(nowDate8 + offset8 + zoneOffset * 60 * 60 * 1000);
}

// 判断是否在交易时间内
export function isTradingTime(date: Date): boolean {
  const beginDateAM = new Date(date);
  const endDateAM = new Date(date);
  const beginDatePM = new Date(date);
  const endDatePM = new Date(date);

  beginDateAM.setHours(9, 30, 0, 0);
  endDateAM.setHours(11, 35, 0, 0);
  beginDatePM.setHours(13, 0, 0, 0);
  endDatePM.setHours(15, 0, 0, 0);

  return (date >= beginDateAM && date <= endDateAM) || (date >= beginDatePM && date <= endDatePM);
}

// 判断是否是交易日
export function isTradingDay(date: Date, holidayData: HolidayData): boolean {
  // 检查是否是周末
  if (date.getDay() === 0 || date.getDay() === 6) {
    return false;
  }

  // 检查是否是节假日
  if (checkHoliday(date, holidayData)) {
    return false;
  }

  return true;
}

// 获取市场状态
export function getMarketStatus(holidayData: HolidayData): MarketStatus {
  const now = getBeijingTime();
  const isTrading = isTradingDay(now, holidayData);
  const isInTradingTime = isTrading && isTradingTime(now);

  let status = '休市';
  let statusColor = 'red';

  if (isTrading && isInTradingTime) {
    status = '开市中';
    statusColor = 'green';
  } else if (isTrading && !isInTradingTime) {
    status = '非交易时间';
    statusColor = 'orange';
  }

  return {
    status,
    statusColor,
    isTradingDay: isTrading,
    isTradingTime: isInTradingTime,
    currentTime: now.toISOString(),
  };
}
