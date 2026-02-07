import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MarketIndices from '../components/MarketIndices';
import { getFundRankings } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import clsx from 'clsx';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { GoldMedal, SilverMedal, BronzeMedal } from '../components/RankIcons';

const RankingList = ({ title, type, colorClass }) => {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      // type: 'gain' -> desc, 'loss' -> asc
      const order = type === 'gain' ? 'desc' : 'asc';
      const data = await getFundRankings('zzf', order, 1, 10);
      setFunds(data);
      setLoading(false);
    };

    fetchRankings();
  }, [type]);

  const renderRankIcon = (index) => {
    if (index === 0) return <GoldMedal className="w-8 h-8 shrink-0 -ml-1" />;
    if (index === 1) return <SilverMedal className="w-8 h-8 shrink-0 -ml-1" />;
    if (index === 2) return <BronzeMedal className="w-8 h-8 shrink-0 -ml-1" />;
    
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-muted-foreground shrink-0 bg-muted ml-1">
        {index + 1}
      </div>
    );
  };

  return (
    <Card className="flex-1 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={clsx("h-5 w-5", colorClass)} />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y">
            {funds.map((fund, index) => (
              <li 
                key={fund.code} 
                className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/fund/${fund.code}`)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {renderRankIcon(index)}
                  <div className="flex flex-col min-w-0 ml-1">
                    <span className="font-medium text-sm truncate">{fund.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{fund.code}</span>
                  </div>
                </div>
                <div className={clsx("font-bold font-mono ml-4 shrink-0", colorClass)}>
                  {fund.dayGrowth > 0 ? '+' : ''}{fund.dayGrowth}%
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default function Market() {
  return (
    <div className="space-y-6 pb-20 md:pb-0 h-full flex flex-col overflow-auto">
      <header>
        <h1 className="text-2xl font-bold tracking-tight mb-4">行情中心</h1>
        <MarketIndices />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RankingList 
          title="当日加仓榜" 
          type="gain" 
          icon={TrendingUp} 
          colorClass="text-red-500" 
        />
        <RankingList 
          title="当日减仓榜" 
          type="loss" 
          icon={TrendingDown} 
          colorClass="text-green-500" 
        />
      </div>
    </div>
  );
}
