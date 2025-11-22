// components/DexDashboard.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, Shield, Star } from 'lucide-react';

interface DexPrice {
  dexName: string;
  price: number;
  liquidity?: number;
  priceImpact?: number;
  isBest?: boolean;
  isWorst?: boolean;
  lastUpdated: string;
}

export default function DexDashboard() {
  const [prices, setPrices] = useState<DexPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // In your DexDashboard component, update the fetchPrices function:
const fetchPrices = async () => {
  try {
    // Add cache-busting to prevent browser caching
    const response = await fetch(`/api/prices/dashboard?t=${Date.now()}`);
    const data = await response.json();
    
    if (data.success) {
      setPrices(data.prices);
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Optional: Show if we're using real data or mock data
      if (data.source === 'live') {
        console.log('✅ Using live price data');
      } else {
        console.log('⚠️ Using mock data (API fallback)');
      }
    }
  } catch (error) {
    console.error('Error fetching prices:', error);
  } finally {
    setLoading(false);
  }
};

// Update the useEffect to fetch immediately on mount and then every 3 seconds
useEffect(() => {
  fetchPrices(); // Fetch immediately on component mount
  
  const interval = setInterval(fetchPrices, 3000); // Update every 3 seconds
  
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  const bestPrice = prices.find(p => p.isBest);
  const worstPrice = prices.find(p => p.isWorst);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            SwapC Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time SOL/USDC prices across all DEXes
          </p>
          <div className="flex justify-center items-center gap-4 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Zap size={16} className="text-green-400" />
              <span>Live Updates</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield size={16} className="text-blue-400" />
              <span>Best Price Guarantee</span>
            </div>
          </div>
        </div>

        {/* Best/Worst Price Banner */}
        {bestPrice && worstPrice && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-green-400" size={32} />
                <div>
                  <div className="text-green-400 text-sm font-semibold">BEST TO BUY</div>
                  <div className="text-2xl font-bold">${bestPrice.price.toFixed(4)}</div>
                  <div className="text-green-300 text-sm">{bestPrice.dexName}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <TrendingDown className="text-red-400" size={32} />
                <div>
                  <div className="text-red-400 text-sm font-semibold">WORST TO BUY</div>
                  <div className="text-2xl font-bold">${worstPrice.price.toFixed(4)}</div>
                  <div className="text-red-300 text-sm">{worstPrice.dexName}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {prices.map((dex, index) => (
            <DexCard key={dex.dexName} dex={dex} position={index + 1} />
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="mt-4 text-gray-400">Fetching live prices...</p>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          Last updated: {lastUpdate || 'Never'}
          <button 
            onClick={fetchPrices}
            className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Refresh Now
          </button>
        </div>
      </div>
    </div>
  );
}

// DexCard Component - COMPLETELY FIXED
function DexCard({ dex, position }: { dex: DexPrice; position: number }) {
  // Safe time formatting function
  const formatTime = (dateString: string): string => {
    try {
      // If it's already a valid time string like "14:30", return it
      if (/^\d{1,2}:\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // If it's an ISO string, parse it
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
      
      // If all else fails, return a fallback
      return 'Just now';
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Just now';
    }
  };

  const formattedTime = formatTime(dex.lastUpdated);

  const getDexColor = (dexName: string) => {
    const colors: { [key: string]: string } = {
      'Jupiter': 'from-blue-500 to-cyan-500',
      'Raydium': 'from-purple-500 to-pink-500',
      'Orca': 'from-green-500 to-teal-500',
      'DexScreener': 'from-orange-500 to-red-500',
      'CoinGecko': 'from-yellow-500 to-amber-500',
    };
    return colors[dex.dexName] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className={`
      relative rounded-2xl p-6 border transition-all duration-300 hover:scale-105 hover:shadow-2xl
      ${dex.isBest 
        ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-lg shadow-green-500/20' 
        : dex.isWorst 
          ? 'bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/30' 
          : 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 border-gray-600/30'
      }
    `}>
      {/* Position Badge */}
      <div className={`
        absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
        ${position === 1 ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' :
          position <= 3 ? 'bg-gray-500' : 'bg-gray-700'}
      `}>
        {position}
      </div>

      {/* Best/Worst Badge */}
      {dex.isBest && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Star size={12} />
          BEST
        </div>
      )}
      
      {dex.isWorst && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          WORST
        </div>
      )}

      {/* DEX Logo/Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getDexColor(dex.dexName)} flex items-center justify-center text-white font-bold`}>
          {dex.dexName.charAt(0)}
        </div>
        <div>
          <h3 className="font-bold text-lg">{dex.dexName}</h3>
          <div className="text-gray-400 text-sm">DEX</div>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="text-2xl font-bold">${dex.price.toFixed(4)}</div>
        <div className="text-gray-400 text-sm">SOL/USDC</div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2 text-sm">
        {dex.liquidity && (
          <div className="flex justify-between">
            <span className="text-gray-400">Liquidity:</span>
            <span className="text-green-400">${(dex.liquidity / 1000000).toFixed(1)}M</span>
          </div>
        )}
        
        {dex.priceImpact && (
          <div className="flex justify-between">
            <span className="text-gray-400">Price Impact:</span>
            <span className={dex.priceImpact > 2 ? 'text-red-400' : 'text-green-400'}>
              {dex.priceImpact.toFixed(2)}%
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-400">Updated:</span>
          <span className="text-gray-400">
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <button className={`
        w-full mt-4 py-2 rounded-lg font-semibold transition-all
        ${dex.isBest 
          ? 'bg-green-500 hover:bg-green-600 text-white' 
          : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
        }
      `}>
        {dex.isBest ? 'Trade Here 🚀' : 'View Details'}
      </button>
    </div>
  );
}