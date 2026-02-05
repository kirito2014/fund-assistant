import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Missing search key' }, { status: 400 });
  }
  
  try {
    const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?&m=9&key=${key}&_=${Date.now()}`;
    const res = await axios.get(url);
    return NextResponse.json(res.data);
  } catch (error) {
    console.error('Fund search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
