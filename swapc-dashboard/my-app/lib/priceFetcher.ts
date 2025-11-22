// lib/priceFetcher.ts
export async function fetchRealPrices() {
  try {
    const [dexScreener, coinGecko] = await Promise.all([
      fetchDexScreener(),
      fetchCoinGecko(),
    ]);

    return [dexScreener, coinGecko].filter(Boolean);
  } catch (error) {
    console.error('Error fetching real prices:', error);
    return [];
  }
}

async function fetchDexScreener() {
  const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=SOL');
  const data = await response.json();
  
  const pair = data.pairs?.find((p: any) => 
    p.baseToken?.symbol === 'SOL' && p.quoteToken?.symbol === 'USDC'
  );

  if (!pair) return null;

  return {
    dexName: 'DexScreener',
    price: parseFloat(pair.priceUsd),
    liquidity: pair.liquidity?.usd,
    priceImpact: pair.priceChange?.h24,
    lastUpdated: new Date()
  };
}

async function fetchCoinGecko() {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true'
  );
  const data = await response.json();
  
  return {
    dexName: 'CoinGecko',
    price: data.solana.usd,
    priceImpact: data.solana.usd_24h_change,
    lastUpdated: new Date()
  };
}