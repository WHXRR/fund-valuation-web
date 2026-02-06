import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { getFundChartData, getFundHistory } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History } from 'lucide-react';
import useFundStore from '../store/useFundStore';
import FundActionModal from '../components/FundActionModal';
import TransactionHistoryModal from '../components/TransactionHistoryModal';

const FundDetail = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { portfolio, transactions, addTransaction, deleteTransaction, addToWatchlist } = useFundStore();
  
  const [chartRawData, setChartRawData] = useState(null);
  const [historyData, setHistoryData] = useState({ list: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('3M'); // 1M, 3M, 6M, 1Y, ALL
  const [historyPage, setHistoryPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Transaction History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fundTransactions = useMemo(() => 
    (transactions || []).filter(t => t.fundCode === code), 
  [transactions, code]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('buy');

  const holding = useMemo(() => portfolio.find(p => p.code === code), [portfolio, code]);
  const currentNav = useMemo(() => {
    if (historyData.list.length > 0) return parseFloat(historyData.list[0].DWJZ);
    if (chartRawData?.netWorthTrend?.length > 0) return chartRawData.netWorthTrend[chartRawData.netWorthTrend.length - 1].y;
    return 1;
  }, [historyData, chartRawData]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getFundChartData(code);
        setChartRawData(data);
        
        // Load first page of history
        const history = await getFundHistory(code, 1, 20);
        setHistoryData(history);
      } catch (error) {
        console.error("Failed to load fund detail", error);
      } finally {
        setLoading(false);
      }
    };
    if (code) {
      loadData();
    }
  }, [code]);

  const loadMoreHistory = async () => {
    if (loadingHistory || historyData.list.length >= historyData.total) return;
    setLoadingHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await getFundHistory(code, nextPage, 20);
      setHistoryData(prev => ({
        list: [...prev.list, ...history.list],
        total: history.total
      }));
      setHistoryPage(nextPage);
    } catch (error) {
      console.error("Failed to load more history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTransaction = (data) => {
    // data: { type, amount, shares, feeRate, syncWatchlist, date, confirmationDate, isAfter3PM }
    
    if (data.type === 'buy') {
      const fee = data.amount * (data.feeRate / 100);
      const netAmount = data.amount - fee;
      const shares = netAmount / currentNav;
      
      addTransaction({
        type: 'buy',
        fundCode: code,
        name: chartRawData?.name || code,
        amount: netAmount, // Value added
        shares: shares, // Store shares
        navAtBuy: currentNav, // Store NAV
        cost: data.amount, // Principal added
        time: data.date, // Transaction Date
        confirmationTime: data.confirmationDate // Confirmation Date for portfolio update
      });
    } else if (data.type === 'sell') {
      const grossValue = data.shares * currentNav;
      
      // Calculate ratio for cost reduction
      // If we have shares in holding, use that. Otherwise fallback to amount-based estimation (legacy)
      // Note: holding.shares might be undefined for legacy data
      let totalShares = 0;
      if (holding && holding.shares) {
        totalShares = holding.shares;
      } else {
        // Fallback: Estimate based on currentNav (flawed but best effort for legacy)
        totalShares = holding ? holding.amount / currentNav : 0;
      }

      const ratio = totalShares > 0 ? data.shares / totalShares : 0;
      
      addTransaction({
        type: 'sell',
        fundCode: code,
        shares: data.shares, // Store explicit shares
        shareRatio: ratio,
        redeemAmount: grossValue,
        navAtSell: currentNav, // Store NAV at time of sell for reference
        time: data.date, // Transaction Date
        confirmationTime: data.confirmationDate // Confirmation Date for portfolio update
      });
    }

    if (data.syncWatchlist) {
      addToWatchlist({
        code,
        name: chartRawData?.name || code
      });
    }
  };

  const filteredChartData = useMemo(() => {
    if (!chartRawData || !chartRawData.netWorthTrend) return [];
    
    const now = Date.now();
    let startTime = 0;
    
    switch (range) {
      case '1M':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '3M':
        startTime = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case '6M':
        startTime = now - 180 * 24 * 60 * 60 * 1000;
        break;
      case '1Y':
        startTime = now - 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        startTime = 0;
    }
    
    return chartRawData.netWorthTrend.filter(item => item.x >= startTime);
  }, [chartRawData, range]);

  // Helper to handle color opacity regardless of format (oklch, rgb, hex)
  // const getOpacityColor = (c, opacity) => { ... } // Removed unused function

  const getOption = () => {
    // Ensure consistent option structure even if data is empty to prevent ECharts interpolation errors
    const dates = filteredChartData.map(item => {
      const date = new Date(item.x);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    const values = filteredChartData.map(item => {
      const val = parseFloat(item.y);
      return isNaN(val) ? 0 : val;
    });

    return {
      animation: false,
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          if (!params || !params.length) return '';
          const param = params[0];
          return `${param.name}<br/>单位净值: ${param.value}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#ccc' } },
        axisLabel: { color: '#666' }
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: { lineStyle: { color: '#eee' } },
        axisLabel: { color: '#666' }
      },
      series: [
        {
          name: '单位净值',
          type: 'line',
          smooth: true,
          symbol: 'none',
          emphasis: {
            scale: false,
            lineStyle: {
              width: 2
            }
          },
          areaStyle: {
            color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                    offset: 0, color: 'rgba(225, 29, 72, 0.3)' // 0% 处的颜色 #e11d48
                }, {
                    offset: 1, color: 'rgba(225, 29, 72, 0)' // 100% 处的颜色
                }],
                global: false // 缺省为 false
              }
            },
            lineStyle: {
              color: '#e11d48',
              width: 2
            },
            data: values
          }
        ]
      };
    };

  if (loading) {
    return <div className="p-4 text-center">加载中...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-md pb-24 relative min-h-screen">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">{chartRawData?.name || code}</h1>
          <p className="text-sm text-gray-500">{code}</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">业绩走势</CardTitle>
            <Badge variant="secondary">单位净值</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ReactECharts 
              option={getOption()} 
              style={{ height: '100%', width: '100%' }} 
              notMerge={true}
              lazyUpdate={true}
            />
          </div>
          <div className="flex justify-between mt-4">
            {['1M', '3M', '6M', '1Y', 'ALL'].map((r) => (
              <Button 
                key={r} 
                variant={range === r ? "default" : "ghost"} 
                size="sm"
                onClick={() => setRange(r)}
                className="text-xs h-8 px-2"
              >
                {r === 'ALL' ? '全部' : `近${r}`}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">历史净值</CardTitle>
            <Button variant="link" className="text-xs h-auto p-0" onClick={() => {}}>更多 &gt;</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 mb-2 px-2">
              <div>日期</div>
              <div className="text-right">单位净值</div>
              <div className="text-right">累计净值</div>
              <div className="text-right">日涨幅</div>
            </div>
            {historyData.list.map((item, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 text-sm py-3 border-b last:border-0 px-2">
                <div className="font-medium text-gray-700">{item.FSRQ.substring(5)}</div>
                <div className="text-right">{item.DWJZ}</div>
                <div className="text-right text-gray-500">{item.LJJZ}</div>
                <div className={`text-right ${parseFloat(item.JZZZL) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {parseFloat(item.JZZZL) > 0 ? '+' : ''}{item.JZZZL}%
                </div>
              </div>
            ))}
            {historyData.list.length < historyData.total && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadMoreHistory} 
                  disabled={loadingHistory}
                >
                  {loadingHistory ? '加载中...' : '加载更多'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto flex gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-gray-200 shrink-0 shadow-sm"
            onClick={() => setIsHistoryOpen(true)}
          >
             <History className="h-5 w-5 text-gray-600" />
          </Button>

          {!holding ? (
            <Button 
              className="flex-1 h-12 rounded-full text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              onClick={() => {
                setModalType('buy');
                setIsModalOpen(true);
              }}
            >
              去买入
            </Button>
          ) : (
            <>
              <Button 
                variant="outline"
                className="flex-1 h-12 rounded-full text-lg font-semibold border-primary text-primary hover:bg-primary/5"
                onClick={() => {
                  setModalType('sell');
                  setIsModalOpen(true);
                }}
              >
                卖出
              </Button>
              <Button 
                className="flex-1 h-12 rounded-full text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                onClick={() => {
                  setModalType('buy');
                  setIsModalOpen(true);
                }}
              >
                加仓
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <FundActionModal
        key={isModalOpen ? 'open' : 'closed'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        fund={{ ...holding, name: chartRawData?.name || code, amount: holding?.amount || 0 }}
        nav={currentNav}
        onConfirm={handleTransaction}
      />
      
      <TransactionHistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transactions={fundTransactions}
        onRevoke={deleteTransaction}
      />
    </div>
  );
};

export default FundDetail;
