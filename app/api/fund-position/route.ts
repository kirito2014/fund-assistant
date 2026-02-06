import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // 服务端请求不受 CORS 限制
  // 这里可以调用移动端 API，返回 JSON，解析更方便
  const url = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNInverstPosition?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&Uid=&_=${Date.now()}`;

  try {
    const res = await axios.get(url, {
        headers: { 'Referer': 'https://fund.eastmoney.com/' } // 伪造 Referer
    });
    return NextResponse.json(res.data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}