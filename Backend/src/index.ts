// src/index.ts
import express from 'express';
// import cors from 'cors';
import { findBestPrice } from './dexPriceFetcher';

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: '🏦 DEX Price Aggregator API',
    endpoints: {
      'GET /api/prices/compare': 'Compare prices across all DEXes',
      'POST /api/prices/compare': 'Compare prices across all DEXes'
    },
    popularPairs: {
      'SOL/USDC': '/api/prices/compare?tokenA=SOL&tokenB=USDC',
      'ETH/USDC': '/api/prices/compare?tokenA=ETH&tokenB=USDC',
      'BTC/USDC': '/api/prices/compare?tokenA=BTC&tokenB=USDC',
      'USDC/USDT': '/api/prices/compare?tokenA=USDC&tokenB=USDT'
    }
  });
});

app.get('/api/prices/compare', async (req, res) => {
  try {
    const { tokenA, tokenB } = req.query;
    
    if (!tokenA || !tokenB) {
      return res.status(400).json({
        error: 'Both tokenA and tokenB query parameters are required',
        example: '/api/prices/compare?tokenA=SOL&tokenB=USDC'
      });
    }

    const result = await findBestPrice(tokenA as string, tokenB as string);
    
    res.json({
      success: true,
      pair: `${tokenA}/${tokenB}`,
      ...result
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      tip: 'Try popular tokens: SOL, USDC, USDT, ETH, BTC'
    });
  }
});

app.post('/api/prices/compare', async (req, res) => {
  try {
    const { tokenA, tokenB } = req.body;
    
    if (!tokenA || !tokenB) {
      return res.status(400).json({
        error: 'Both tokenA and tokenB are required in JSON body',
        example: { "tokenA": "SOL", "tokenB": "USDC" }
      });
    }

    const result = await findBestPrice(tokenA, tokenB);
    
    res.json({
      success: true,
      pair: `${tokenA}/${tokenB}`,
      ...result
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 DEX Price Aggregator running on http://localhost:${PORT}`);
  console.log(`📊 Test: http://localhost:${PORT}/api/prices/compare?tokenA=SOL&tokenB=USDC`);
});