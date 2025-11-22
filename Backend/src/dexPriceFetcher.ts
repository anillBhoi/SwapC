// src/dexPriceFetcher.ts
import { Connection, PublicKey } from "@solana/web3.js";
import axios from "axios";

export interface DexPrice {
  dexName: string;
  price: number;
  liquidity?: number;
  responseTime?: number;
}

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

let tokenListCache: any[] = [];

async function getTokenMint(symbol: string): Promise<string> {
  try {
    if (!tokenListCache.length) {
      const res = await axios.get(
        "https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json",
        { timeout: 5000 }
      );
      tokenListCache = res.data.tokens;
    }
    
    const token = tokenListCache.find((t) => 
      t.symbol.toUpperCase() === symbol.toUpperCase()
    );
    
    if (!token) {
      throw new Error(`Token symbol "${symbol}" not found in token list`);
    }
    
    return token.address;
  } catch (error) {
    throw new Error(`Failed to get token mint for ${symbol}: ${error}`);
  }
}

// Helper function for API calls with timeout
async function fetchWithTimeout(url: string, options: any = {}, timeout = 4000): Promise<any> {
  const source = axios.CancelToken.source();
  const timeoutId = setTimeout(() => {
    source.cancel(`Timeout after ${timeout}ms`);
  }, timeout);

  try {
    const response = await axios({
      url,
      ...options,
      cancelToken: source.token,
      timeout
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function findBestPrice(tokenA: string, tokenB: string): Promise<{
  bestPrice: DexPrice;
  allPrices: DexPrice[];
  comparison: {
    bestDex: string;
    worstDex: string;
    priceDifference: number;
    percentageDifference: number;
  };
}> {
  const startTime = Date.now();
  console.log(`🔄 Starting price comparison for ${tokenA} to ${tokenB}`);
  
  const allPrices: DexPrice[] = [];

  try {
    const tokenAMint = await getTokenMint(tokenA);
    const tokenBMint = await getTokenMint(tokenB);

    console.log(`Token mints: ${tokenA}=${tokenAMint}, ${tokenB}=${tokenBMint}`);

    // Run all API calls in parallel with Promise.allSettled
    const apiPromises = [];

    // 1. Jupiter API (Fast & Reliable)
    apiPromises.push(
      fetchWithTimeout(
        `https://quote-api.jup.ag/v6/quote?inputMint=${tokenAMint}&outputMint=${tokenBMint}&amount=1000000000`,
        { timeout: 3000 }
      )
      .then(response => {
        if (response.data?.outAmount) {
          const price = Number(response.data.outAmount) / 1000000; // Simplified calculation
          allPrices.push({ 
            dexName: "Jupiter", 
            price,
            responseTime: Date.now() - startTime
          });
          console.log(`✅ Jupiter price: $${price}`);
        }
      })
      .catch(err => console.log("❌ Jupiter:", err.message))
    );

    // 2. DexScreener (Very Fast & Reliable)
    apiPromises.push(
      fetchWithTimeout(
        `https://api.dexscreener.com/latest/dex/search?q=${tokenAMint}`,
        { timeout: 3000 }
      )
      .then(response => {
        if (response.data?.pairs?.length > 0) {
          const pair = response.data.pairs.find((p: any) => 
            p.baseToken?.address === tokenAMint && p.quoteToken?.address === tokenBMint
          ) || response.data.pairs[0];
          
          if (pair?.priceUsd) {
            allPrices.push({ 
              dexName: "DexScreener", 
              price: parseFloat(pair.priceUsd),
              liquidity: pair.liquidity?.usd,
              responseTime: Date.now() - startTime
            });
            console.log(`✅ DexScreener price: $${pair.priceUsd}`);
          }
        }
      })
      .catch(err => console.log("❌ DexScreener:", err.message))
    );

    // 3. CoinGecko (Reliable)
    apiPromises.push(
      fetchWithTimeout(
        `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`,
        { timeout: 3000 }
      )
      .then(response => {
        if (response.data?.solana?.usd) {
          allPrices.push({ 
            dexName: "CoinGecko", 
            price: response.data.solana.usd,
            responseTime: Date.now() - startTime
          });
          console.log(`✅ CoinGecko price: $${response.data.solana.usd}`);
        }
      })
      .catch(err => console.log("❌ CoinGecko:", err.message))
    );

    // 4. Birdeye (Fast Alternative)
    apiPromises.push(
      fetchWithTimeout(
        `https://public-api.birdeye.so/defi/price?address=${tokenAMint}`,
        { 
          timeout: 3000,
          headers: {
            'X-API-KEY': 'your-birdeye-api-key' // Optional: get free API key from birdeye
          }
        }
      )
      .then(response => {
        if (response.data?.data?.value) {
          allPrices.push({ 
            dexName: "Birdeye", 
            price: response.data.data.value,
            responseTime: Date.now() - startTime
          });
          console.log(`✅ Birdeye price: $${response.data.data.value}`);
        }
      })
      .catch(err => console.log("❌ Birdeye:", err.message))
    );

    // 5. Simple Raydium API (Fast)
    if (tokenA === 'SOL' && tokenB === 'USDC') {
      apiPromises.push(
        fetchWithTimeout(
          `https://api.raydium.io/v2/main/price`,
          { timeout: 3000 }
        )
        .then(response => {
          if (response.data?.success && response.data.data?.[tokenAMint]?.price) {
            allPrices.push({ 
              dexName: "Raydium", 
              price: response.data.data[tokenAMint].price,
              responseTime: Date.now() - startTime
            });
            console.log(`✅ Raydium price: $${response.data.data[tokenAMint].price}`);
          }
        })
        .catch(err => console.log("❌ Raydium:", err.message))
      );
    }

    // 6. Orca Quick API
    // if (tokenA === 'SOL' && tokenB === 'USDC') {
    //   apiPromises.push(
    //     fetchWithTimeout(
    //       `https://api.orca.so/pools`,
    //       { timeout: 3000 }
    //     )
    //     .then(response => {
    //       if (response.data && Array.isArray(response.data)) {
    //         const solUsdcPool = response.data.find((p: any) => 
    //           p.name === 'SOL/USDC' || p.name === 'USDC/SOL'
    //         );
    //         if (solUsdcPool?.price) {
    //           allPrices.push({ 
    //             dexName: "Orca", 
    //             price: parseFloat(solUsdcPool.price),
    //             responseTime: Date.now() - startTime
    //           });
    //           console.log(`✅ Orca price: $${solUsdcPool.price}`);
    //         }
    //       }
    //     })
    //     .catch(err => console.log("❌ Orca:", err.message))
    //   );
    // }

    // Wait for all API calls to complete (with timeout)
    await Promise.allSettled(apiPromises);

    // If we have few results, wait a bit more for slower APIs
    if (allPrices.length < 2) {
      console.log('⏳ Waiting for additional price data...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Filter and validate prices
    const validPrices = allPrices.filter(p => p.price && !isNaN(p.price) && p.price > 0);
    
    if (validPrices.length === 0) {
      throw new Error(`No valid prices fetched for ${tokenA}/${tokenB}`);
    }

    // Sort by price (highest first) for best execution
    validPrices.sort((a, b) => b.price - a.price);

    const bestPrice = validPrices[0];
    const worstPrice = validPrices[validPrices.length - 1];
    
    const priceDifference = bestPrice.price - worstPrice.price;
    const percentageDifference = validPrices.length > 1 ? 
      ((bestPrice.price - worstPrice.price) / worstPrice.price) * 100 : 0;

    const totalTime = Date.now() - startTime;

    console.log(`\n🏆 PRICE COMPARISON RESULTS (${totalTime}ms):`);
    console.log(`================================`);
    validPrices.forEach((p, index) => {
      const isBest = index === 0;
      const isWorst = index === validPrices.length - 1 && validPrices.length > 1;
      let marker = '';
      if (isBest) marker = '👑 BEST';
      if (isWorst) marker = '📉 WORST';
      console.log(`${p.dexName.padEnd(12)}: $${p.price.toFixed(4)} ${marker} (${p.responseTime}ms)`);
    });
    console.log(`================================`);
    console.log(`📊 Total DEXes: ${validPrices.length}`);
    console.log(`🏆 Best: ${bestPrice.dexName} - $${bestPrice.price.toFixed(4)}`);
    if (validPrices.length > 1) {
      console.log(`📉 Worst: ${worstPrice.dexName} - $${worstPrice.price.toFixed(4)}`);
      console.log(`💰 Difference: $${priceDifference.toFixed(4)} (${percentageDifference.toFixed(2)}%)`);
    }
    console.log(`⏱️  Total time: ${totalTime}ms`);

    return {
      bestPrice,
      allPrices: validPrices,
      comparison: {
        bestDex: bestPrice.dexName,
        worstDex: worstPrice.dexName,
        priceDifference,
        percentageDifference
      }
    };
    
  } catch (error) {
    console.error('💥 Error in findBestPrice:', error);
    throw error;
  }
}