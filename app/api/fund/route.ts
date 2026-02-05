// app/api/fund/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  // 1. 获取前端传递的查询参数
  const searchParams = request.nextUrl.searchParams;
  const fCodes = searchParams.get("Fcodes");
  const deviceId = searchParams.get("deviceid");
  const timestamp = new Date().getTime();

  if (!fCodes || !deviceId) {
    return NextResponse.json({ error: "Missing Fcodes or deviceid" }, { status: 400 });
  }

  // 2. 构造目标第三方 API 的 URL
  // 注意：这里是在服务端执行，不会暴露给浏览器，也没有 CORS 问题
  const targetUrl = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=200&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=${deviceId}&Fcodes=${fCodes}&_=${timestamp}`;

  try {
    // 3. 服务端发起请求
    const response = await axios.get(targetUrl, {
      headers: {
        //以此伪装成移动端请求，防止被反爬
        "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36",
        "Referer": "https://fundmobapi.eastmoney.com/",
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Connection": "keep-alive"
      },
      timeout: 10000
    });

    // 4. 将数据返回给前端
    return NextResponse.json(response.data);
    
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    return NextResponse.json({ error: "Failed to fetch fund data", details: error.message }, { status: 500 });
  }
}