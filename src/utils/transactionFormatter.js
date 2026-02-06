
/**
 * Calculates display values for a transaction record.
 * 
 * @param {Object} tx - The transaction object
 * @returns {Object} Display properties
 * @property {boolean} isBuy - Whether it's a buy transaction
 * @property {string} typeLabel - '买入' or '卖出'
 * @property {string} mainDisplay - The main value to display (e.g., '¥1000.00' or '500.00份')
 * @property {string|null} subDisplay - The secondary value (e.g., '≈ ¥1200.00' or null)
 */
export const formatTransactionDisplay = (tx) => {
  const isBuy = tx.type === 'buy';
  
  if (isBuy) {
    return {
      isBuy: true,
      typeLabel: '买入',
      mainDisplay: `¥${Number(tx.amount).toFixed(2)}`,
      subDisplay: null
    };
  }
  
  // Sell logic
  let sellShares = null;
  let sellAmount = null;
  
  if (tx.shares) {
    sellShares = Number(tx.shares);
    // Calculate amount: shares * navAtSell (if available) or fallback to redeemAmount
    if (tx.navAtSell) {
      sellAmount = sellShares * Number(tx.navAtSell);
    } else {
      sellAmount = Number(tx.redeemAmount || tx.amount || 0);
    }
  } else {
    // Fallback for old records without shares info
    sellAmount = Number(tx.redeemAmount || tx.amount || 0);
  }
  
  return {
    isBuy: false,
    typeLabel: '卖出',
    mainDisplay: sellShares ? `${sellShares.toFixed(2)}份` : `¥${sellAmount.toFixed(2)}`,
    subDisplay: sellShares ? `≈ ¥${sellAmount.toFixed(2)}` : null
  };
};
