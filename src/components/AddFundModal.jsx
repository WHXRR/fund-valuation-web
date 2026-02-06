import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { searchFund } from '../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AddFundModal({ isOpen, onClose, onAdd, mode = 'portfolio', initialFund = null }) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  
  // Changed: cost -> profit
  // We will calculate cost = amount - profit
  const [profit, setProfit] = useState('0');
  const [amount, setAmount] = useState('0');

  const reset = () => {
    setKeyword('');
    setResults([]);
    setSelectedFund(null);
    setProfit('0');
    setAmount('0');
  };

  // Initialize when opening for edit
  useEffect(() => {
    if (isOpen && initialFund) {
      // Only update if not already set to avoid infinite loop/cascading renders
      if (selectedFund !== initialFund) {
        setSelectedFund(initialFund);
        setAmount(initialFund.amount.toString());
        // Calculate profit from existing data: profit = amount - cost
        const calculatedProfit = initialFund.amount - initialFund.cost;
        setProfit(calculatedProfit.toFixed(2)); // Keep 2 decimals for display
      }
    } else if (isOpen) {
      // Reset when opening fresh
      // Only reset if dirty to avoid cascading renders
      if (selectedFund || amount !== '0' || profit !== '0' || keyword) {
        reset();
      }
    }
  }, [isOpen, initialFund]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.length >= 2) {
        searchFund(keyword).then(setResults);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSelect = (fund) => {
    if (mode === 'watchlist') {
      onAdd(fund);
      onClose();
      reset();
    } else {
      setSelectedFund(fund);
      setProfit('0'); // Reset inputs for new selection
      setAmount('0');
    }
  };

  const handleConfirmPortfolio = () => {
    if (amount === '' || profit === '') return;
    
    const numAmount = parseFloat(amount);
    const numProfit = parseFloat(profit);
    const calculatedCost = numAmount - numProfit;

    onAdd({
      ...selectedFund,
      cost: calculatedCost,
      amount: numAmount
    });
    onClose();
    reset();
  };

  const handleOpenChange = (open) => {
    if (!open) {
      onClose();
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md top-[20%] translate-y-0">
        <DialogHeader>
          <DialogTitle>
            {initialFund ? '编辑持仓' : (selectedFund ? '配置持仓' : '添加基金')}
          </DialogTitle>
        </DialogHeader>

        {!selectedFund ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="输入代码或名称 (如: 110011)"
                className="pl-9"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="h-[300px] overflow-y-auto -mx-2 px-2 space-y-1">
              {results.length === 0 && keyword.length >= 2 && (
                <p className="text-center text-muted-foreground py-8 text-sm">未找到相关基金</p>
              )}
              {results.map((fund) => (
                <div
                  key={fund.code}
                  onClick={() => handleSelect(fund)}
                  className="flex justify-between items-center p-3 hover:bg-accent rounded-md cursor-pointer transition-colors group"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="font-medium text-sm line-clamp-1">{fund.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center space-x-2 mt-0.5">
                      <span className="font-mono">{fund.code}</span>
                      <span className="bg-muted px-1.5 rounded-[2px] scale-90 origin-left">{fund.type}</span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className="font-medium text-primary mb-1">{selectedFund.name}</div>
              <div className="text-sm text-muted-foreground font-mono">{selectedFund.code}</div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">持有金额 (元)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profit">持有收益 (元)</Label>
                <Input
                  id="profit"
                  type="number"
                  value={profit}
                  onChange={(e) => setProfit(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0.00" // Allows negative profit
                />
                <p className="text-xs text-muted-foreground">
                  自动计算持仓成本: {amount && profit ? (parseFloat(amount) - parseFloat(profit)).toFixed(2) : '--'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {!initialFund && (
                <Button variant="outline" className="flex-1" onClick={() => setSelectedFund(null)}>
                  返回搜索
                </Button>
              )}
              <Button 
                className="flex-1" 
                onClick={handleConfirmPortfolio}
                disabled={!amount || profit === ''} // Profit can be 0, so check empty string
              >
                {initialFund ? '保存修改' : '确认添加'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
