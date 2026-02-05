import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fcodes = searchParams.get('Fcodes');
  const deviceid = searchParams.get('deviceid');
  
  console.log('Fund data request received:', {
    fcodes,
    deviceid
  });
  
  if (!fcodes) {
    console.error('Missing Fcodes parameter');
    return NextResponse.json({ error: 'Missing Fcodes parameter' }, { status: 400 });
  }
  
  try {
    const url = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=200&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=${deviceid || 'test'}&Fcodes=${fcodes}`;
    console.log('Fetching fund data from:', url);
    
    // 增加超时设置
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://fund.eastmoney.com/',
        'Origin': 'https://fund.eastmoney.com'
      },
      timeout: 10000
    });
    
    console.log('Fund data fetch successful:', res.status);
    console.log('Fund data response data:', res.data);
    
    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error('Fund data fetch error:', error.message);
    console.error('Fund data fetch error details:', error);
    console.error('Fund data fetch error config:', error.config);
    return NextResponse.json({ 
      error: 'Failed to fetch fund data', 
      details: error.message,
      config: error.config 
    }, { status: 500 });
  }
}
