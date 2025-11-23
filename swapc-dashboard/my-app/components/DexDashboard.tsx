// components/DexDashboard.tsx - WITH STYLING FALLBACKS
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Zap, Shield, Star, RefreshCw } from 'lucide-react';

interface DexPrice {
  dexName: string;
  price: number;
  liquidity?: number;
  priceImpact?: number;
  isBest?: boolean;
  isWorst?: boolean;
  lastUpdated: string;
}

// Fallback styles object
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    color: 'white'
  },
  card: {
    borderRadius: '1rem',
    padding: '1.5rem',
    border: '1px solid rgba(75, 85, 99, 0.3)',
    background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.5) 0%, rgba(55, 65, 81, 0.5) 100%)',
    transition: 'all 0.3s ease',
    position: 'relative' as const
  },
  bestCard: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
    border: '1px solid rgba(34, 197, 94, 0.3)'
  },
  worstCard: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(244, 63, 94, 0.1) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.3)'
  },
  badge: {
    position: 'absolute' as const,
    top: '-0.5rem',
    left: '-0.5rem',
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.875rem'
  }
};

export default function DexDashboard() {
  const [prices, setPrices] = useState<DexPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/prices/dashboard?t=${Date.now()}`);
      const data = await response.json();
      
      if (data.success && data.prices.length > 0) {
        setPrices(data.prices);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        setError(data.error || 'Failed to fetch live prices');
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      setError('Network error - check console for details');
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [isUpdating]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 2000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const bestPrice = prices.find(p => p.isBest);
  const worstPrice = prices.find(p => p.isWorst);

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{ 
              fontSize: '2.25rem', 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #c084fc 0%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              SwapC Dashboard
            </h1>
            {isUpdating && (
              <RefreshCw size={20} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} />
            )}
          </div>
          <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
            Real-time SOL/USDC prices across all DEXes
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ 
                width: '0.5rem', 
                height: '0.5rem', 
                borderRadius: '50%',
                backgroundColor: isUpdating ? '#fbbf24' : '#34d399',
                animation: isUpdating ? 'pulse 2s infinite' : 'none'
              }}></div>
              <span>{isUpdating ? 'Updating...' : 'Live'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Zap size={16} style={{ color: '#34d399' }} />
              <span>Real-time Data</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Shield size={16} style={{ color: '#60a5fa' }} />
              <span>Best Price Guarantee</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#fca5a5' }}>{error}</p>
            <p style={{ fontSize: '0.875rem', color: '#f87171', marginTop: '0.25rem' }}>
              Prices may be delayed or unavailable
            </p>
          </div>
        )}

        {/* Best/Worst Price Banner */}
        {bestPrice && worstPrice && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem', 
            marginBottom: '2rem' 
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '1rem',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TrendingUp style={{ color: '#34d399' }} size={32} />
                <div>
                  <div style={{ color: '#34d399', fontSize: '0.875rem', fontWeight: '600' }}>BEST TO BUY</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${bestPrice.price.toFixed(4)}</div>
                  <div style={{ color: '#86efac', fontSize: '0.875rem' }}>{bestPrice.dexName}</div>
                </div>
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(219, 39, 119, 0.2) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '1rem',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TrendingDown style={{ color: '#f87171' }} size={32} />
                <div>
                  <div style={{ color: '#f87171', fontSize: '0.875rem', fontWeight: '600' }}>WORST TO BUY</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${worstPrice.price.toFixed(4)}</div>
                  <div style={{ color: '#fca5a5', fontSize: '0.875rem' }}>{worstPrice.dexName}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {prices.map((dex, index) => (
            <DexCard key={dex.dexName} dex={dex} position={index + 1} />
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{
              animation: 'spin 1s linear infinite',
              borderRadius: '50%',
              width: '3rem',
              height: '3rem',
              border: '2px solid #a78bfa',
              borderTopColor: 'transparent',
              margin: '0 auto'
            }}></div>
            <p style={{ marginTop: '1rem', color: '#9ca3af' }}>Fetching live prices from DEXes...</p>
          </div>
        )}

        {/* Last Updated */}
        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#6b7280', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <span>Last updated: {lastUpdate || 'Never'}</span>
            <button 
              onClick={fetchPrices}
              disabled={isUpdating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: isUpdating ? '#4b5563' : '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <RefreshCw size={16} style={{ animation: isUpdating ? 'spin 1s linear infinite' : 'none' }} />
              {isUpdating ? 'Updating...' : 'Refresh Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Add basic animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Simplified DexCard with inline styles
function DexCard({ dex, position }: { dex: DexPrice; position: number }) {
  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'Just now';
    }
  };

  const getCardStyle = () => {
    const baseStyle = { ...styles.card };
    if (dex.isBest) {
      return { ...baseStyle, ...styles.bestCard };
    } else if (dex.isWorst) {
      return { ...baseStyle, ...styles.worstCard };
    }
    return baseStyle;
  };

  const getBadgeStyle = () => {
    const baseStyle = { ...styles.badge };
    if (position === 1) {
      return { ...baseStyle, backgroundColor: '#eab308' };
    } else if (position <= 3) {
      return { ...baseStyle, backgroundColor: '#6b7280' };
    } else {
      return { ...baseStyle, backgroundColor: '#374151' };
    }
  };

  return (
    <div style={getCardStyle()}>
      {/* Position Badge */}
      <div style={getBadgeStyle()}>
        {position}
      </div>

      {/* DEX Logo/Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '0.5rem',
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {dex.dexName.charAt(0)}
        </div>
        <div>
          <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{dex.dexName}</h3>
          <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>DEX</div>
        </div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${dex.price.toFixed(4)}</div>
        <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>SOL/USDC</div>
      </div>

      {/* Additional Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
        {dex.liquidity && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9ca3af' }}>Liquidity:</span>
            <span style={{ color: '#34d399' }}>${(dex.liquidity / 1000000).toFixed(1)}M</span>
          </div>
        )}
        
        {dex.priceImpact && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9ca3af' }}>Price Impact:</span>
            <span style={{ 
              color: dex.priceImpact > 1 ? '#ef4444' : dex.priceImpact > 0.5 ? '#f59e0b' : '#34d399'
            }}>
              {dex.priceImpact.toFixed(2)}%
            </span>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#9ca3af' }}>Updated:</span>
          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            {formatTime(dex.lastUpdated)}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <button style={{
        width: '100%',
        marginTop: '1rem',
        padding: '0.5rem 0',
        borderRadius: '0.5rem',
        fontWeight: '600',
        backgroundColor: dex.isBest ? '#10b981' : '#374151',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}>
        {dex.isBest ? 'Trade Here 🚀' : 'View Details'}
      </button>
    </div>
  );
}