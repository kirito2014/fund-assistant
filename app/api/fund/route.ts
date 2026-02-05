// app/api/fund/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fCodes = searchParams.get("Fcodes");
  const deviceId = searchParams.get("deviceid");
  const timestamp = new Date().getTime();

  if (!fCodes || !deviceId) {
    return NextResponse.json({ error: "Missing Fcodes or deviceid" }, { status: 400 });
  }

  // 构造目标 URL
  const targetUrl = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=200&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=${deviceId}&Fcodes=${fCodes}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        // 使用标准 PC 浏览器 UA，通常比移动端 UA 限制更少
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/94.0.4606.71",
        // 尝试移除 Referer，或者设置为基金主站
        // "Referer": "https://fund.eastmoney.com/", 
        // 许多移动端 API 实际上不需要 Referer，甚至有些会拦截错误的 Referer
        // 如果这里不传 Referer 仍然报错，请尝试取消上面 Referer 的注释
        "Host": "fundmobapi.eastmoney.com",
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Connection": "keep-alive"
      },
      // 禁用缓存，确保获取最新数据
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Upstream API responded with ${response.status}`);
    }

    const data = await response.json();
    // console.log("Upstream API response:", data);
    // 检查业务层面的错误
    if (data.ErrCode !== 0 && data.Message === "网络繁忙，请稍后重试！") {
       console.warn("API Anti-scraping triggered:", data);
       // 如果遇到此错误，可以尝试返回特定状态码让前端重试或显示模拟数据
    }
    console.log("Upstream API response:", data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch fund data" }, { status: 500 });
  }
}