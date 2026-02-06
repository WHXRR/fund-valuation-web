import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { debounce, cn } from '@/lib/utils';
import { format } from "date-fns";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEffectiveTransactionDate, getConfirmationDate, formatDate, isTradingDay } from '@/lib/dateUtils';

const FundActionModal = ({ 
  isOpen, 
  onClose, 
  type = 'buy', // 'buy' or 'sell'
  fund, // { code, name, amount, cost }
  nav = 1, // Current Net Asset Value
  onConfirm 
}) => {
  const [amount, setAmount] = useState('');
  const [shares, setShares] = useState('');
  const [feeRate, setFeeRate] = useState(type === 'buy' ? '0' : '1.5');
  const [date, setDate] = useState(new Date());
  // "true" or "false" string for Select component
  const [isAfter3PM, setIsAfter3PM] = useState(() => {
    return new Date().getHours() >= 15 ? "true" : "false";
  });

  // Calculate dates
  const effectiveDate = useMemo(() => {
    return getEffectiveTransactionDate(date, isAfter3PM === "true");
  }, [date, isAfter3PM]);

  const confirmationDate = useMemo(() => {
    // Default to T+1. Ideally fund prop should have type info.
    return getConfirmationDate(effectiveDate, 1);
  }, [effectiveDate]);

  const isDelayed = useMemo(() => {
    // Check if effective date is different from selected date (ignoring time)
    return formatDate(effectiveDate) !== formatDate(date);
  }, [effectiveDate, date]);

  const maxShares = useMemo(() => {
    if (!fund || !nav) return 0;
    // Assuming fund.amount is current market value
    return fund.amount / nav;
  }, [fund, nav]);

  const handleShareClick = (ratio) => {
    if (!maxShares) return;
    const val = maxShares * ratio;
    setShares(val.toFixed(2));
  };

  const handleConfirm = () => {
    if (type === 'buy' && !amount) return;
    if (type === 'sell' && !shares) return;

    const data = {
      type,
      amount: type === 'buy' ? parseFloat(amount) : 0,
      shares: type === 'sell' ? parseFloat(shares) : 0,
      feeRate: parseFloat(feeRate),
      date: formatDate(effectiveDate), // Use effective date
      confirmationDate: formatDate(confirmationDate),
      isAfter3PM: isAfter3PM === "true"
    };
    
    onConfirm(data);
    onClose();
  };

  // Use ref to keep the latest handleConfirm but have a stable debounced function
  const handleConfirmRef = useRef(handleConfirm);
  useEffect(() => {
    handleConfirmRef.current = handleConfirm;
  });

  const debouncedConfirmRef = useRef(null);
  
  useEffect(() => {
    debouncedConfirmRef.current = debounce((...args) => {
      if (handleConfirmRef.current) {
        handleConfirmRef.current(...args);
      }
    }, 500, true);
  }, []);

  const onConfirmClick = () => {
    if (debouncedConfirmRef.current) {
      debouncedConfirmRef.current();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md top-[50%] translate-y-[-50%] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-center">
            {type === 'buy' ? '买入' : '卖出'}{fund?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {type === 'buy' ? (
            // Buy Interface
            <>
              <div className="space-y-2">
                <Label className="text-gray-500">买入金额</Label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400 pl-2">¥</span>
                  <Input 
                    type="number" 
                    placeholder="请输入买入金额" 
                    className="pl-10 text-2xl font-bold border-0 border-b rounded-none pr-0 shadow-none focus-visible:ring-0 placeholder:text-gray-200"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>
                    估算手续费 <span className="text-primary">{amount ? (parseFloat(amount) * parseFloat(feeRate || 0) / 100).toFixed(2) : '0.00'}</span> 元
                  </span>
                  <div className="flex items-center gap-1">
                    (买入费率 <Input 
                      className="w-10 h-5 p-0 text-center text-xs border-0 border-b rounded-none focus-visible:ring-0 text-primary" 
                      value={feeRate} 
                      onChange={e => setFeeRate(e.target.value)}
                    /> %)
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Sell Interface
            <>
              <div className="space-y-2">
                <Label className="text-gray-500">卖出份额</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder={`最多可卖出 ${maxShares.toFixed(2)} 份`}
                    className="text-2xl font-bold border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 placeholder:text-gray-200"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-2 mt-2">
                  {[
                    { label: '1/4', val: 0.25 },
                    { label: '1/3', val: 1/3 },
                    { label: '1/2', val: 0.5 },
                    { label: '全部', val: 1 }
                  ].map(opt => (
                    <Button 
                      key={opt.label} 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-full text-xs h-7"
                      onClick={() => handleShareClick(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>

                <div className="flex justify-between text-xs text-gray-500 mt-2">
                   <div className="flex items-center gap-1">
                    卖出费率(%) <Input 
                      className="w-12 h-5 p-0 text-center text-xs border-0 border-b rounded-none focus-visible:ring-0 text-primary" 
                      value={feeRate} 
                      onChange={e => setFeeRate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Date Picker */}
          <div className="flex flex-col space-y-2 py-2 border-t border-b border-gray-100">
            <Label className="text-gray-600">{type === 'buy' ? '买入' : '卖出'}日期</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "yyyy-MM-dd") : <span>选择日期</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={(date) => !isTradingDay(date)} 
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Select value={isAfter3PM} onValueChange={setIsAfter3PM}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="选择时间" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">15:00 前</SelectItem>
                  <SelectItem value="true">15:00 后</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Confirmation Date Hint */}
            <div className="bg-blue-50 p-2 rounded-md flex items-start gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700">
                <p>
                  预计 <span className="font-bold">{formatDate(effectiveDate)}</span> 确认份额
                  {isDelayed && (
                    <span className="block text-blue-500 mt-1">
                      (因非交易时间，自动顺延至下一交易日)
                    </span>
                  )}
                </p>
                <p className="mt-1 text-blue-400">
                  预计 <span className="font-bold">{formatDate(confirmationDate)}</span> 查看收益 (T+1)
                </p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-[10px] text-gray-300">
              所有加仓减仓均为模拟操作，不会影响你的真实资金变动
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-12 text-lg"
            onClick={onConfirmClick}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FundActionModal;
