
import { describe, it, expect } from 'vitest';
import { formatTransactionDisplay } from './transactionFormatter';

describe('formatTransactionDisplay', () => {
  it('should format buy transactions correctly', () => {
    const buyTx = {
      type: 'buy',
      amount: '1000'
    };
    
    const result = formatTransactionDisplay(buyTx);
    
    expect(result.isBuy).toBe(true);
    expect(result.typeLabel).toBe('买入');
    expect(result.mainDisplay).toBe('¥1000.00');
    expect(result.subDisplay).toBe(null);
  });

  it('should format sell transactions with shares and NAV correctly', () => {
    const sellTx = {
      type: 'sell',
      shares: '100',
      navAtSell: '1.5'
    };
    
    // 100 shares * 1.5 NAV = 150 amount
    const result = formatTransactionDisplay(sellTx);
    
    expect(result.isBuy).toBe(false);
    expect(result.typeLabel).toBe('卖出');
    expect(result.mainDisplay).toBe('100.00份');
    expect(result.subDisplay).toBe('≈ ¥150.00');
  });

  it('should format sell transactions with shares but no NAV (fallback to redeemAmount)', () => {
    const sellTx = {
      type: 'sell',
      shares: '100',
      redeemAmount: '160',
      navAtSell: null
    };
    
    const result = formatTransactionDisplay(sellTx);
    
    expect(result.isBuy).toBe(false);
    expect(result.typeLabel).toBe('卖出');
    expect(result.mainDisplay).toBe('100.00份');
    expect(result.subDisplay).toBe('≈ ¥160.00');
  });

  it('should format legacy sell transactions (no shares, only redeemAmount) correctly', () => {
    const legacyTx = {
      type: 'sell',
      redeemAmount: '200',
      shares: null
    };
    
    const result = formatTransactionDisplay(legacyTx);
    
    expect(result.isBuy).toBe(false);
    expect(result.typeLabel).toBe('卖出');
    expect(result.mainDisplay).toBe('¥200.00');
    expect(result.subDisplay).toBe(null);
  });
  
  it('should format legacy sell transactions (no shares, no redeemAmount, use amount) correctly', () => {
    const legacyTx = {
        type: 'sell',
        amount: '200',
        shares: null
    };
      
    const result = formatTransactionDisplay(legacyTx);
      
    expect(result.isBuy).toBe(false);
    expect(result.typeLabel).toBe('卖出');
    expect(result.mainDisplay).toBe('¥200.00');
    expect(result.subDisplay).toBe(null);
  });
});
