import React, { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw } from "lucide-react";
import useFundStore from "../store/useFundStore";
import AddFundModal from "../components/AddFundModal";
import MarketIndices from "../components/MarketIndices";
import PortfolioTable, {
  PortfolioTableSkeleton,
} from "../components/PortfolioTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export default function Home() {
  const {
    portfolio,
    fundData,
    fetchFundData,
    fetchMarketIndices,
    isLoading,
    fundLoading,
    addToPortfolio,
    updatePortfolioItem,
    deleteFundTransactions,
  } = useFundStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [sortBy, setSortBy] = useState("default"); // 'default', 'change', 'profit'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc', 'desc'

  const handleDelete = (item) => {
    if (confirm("确定要删除该基金的所有持仓记录吗？此操作不可恢复。")) {
      deleteFundTransactions(item.code);
    }
  };

  useEffect(() => {
    fetchFundData("portfolio");
    const timer = setInterval(() => fetchFundData("portfolio"), 30000); // Auto refresh every 30s
    return () => clearInterval(timer);
  }, [fetchFundData, portfolio]);

  const summary = useMemo(() => {
    let totalAmount = 0;
    let totalCost = 0;
    let dayProfit = 0;

    portfolio.forEach((item) => {
      const data = fundData[item.code];
      if (data) {
        const currentValuation =
          item.amount * (1 + parseFloat(data.gszzl || 0) / 100);
        dayProfit += currentValuation - item.amount;
        totalAmount += currentValuation;
        totalCost += item.cost;
      } else {
        totalAmount += item.amount;
        totalCost += item.cost;
      }
    });

    const totalProfit = totalAmount - totalCost;
    const totalProfitRate =
      totalCost > 0.01 ? (totalProfit / totalCost) * 100 : 0;
    const startOfDayValue = totalAmount - dayProfit;
    const dayProfitRate =
      startOfDayValue > 0.01 ? (dayProfit / startOfDayValue) * 100 : 0;

    return {
      totalAmount,
      dayProfit,
      totalProfit,
      totalProfitRate,
      dayProfitRate,
    };
  }, [portfolio, fundData]);

  const sortedPortfolio = useMemo(() => {
    let sorted = [...portfolio];

    if (sortBy === "default") return sorted;

    sorted.sort((a, b) => {
      const dataA = fundData[a.code] || {};
      const dataB = fundData[b.code] || {};

      const gszzlA = parseFloat(dataA.gszzl || 0);
      const gszzlB = parseFloat(dataB.gszzl || 0);

      const profitA = a.amount * (gszzlA / 100);
      const profitB = b.amount * (gszzlB / 100);

      let valA = 0;
      let valB = 0;

      if (sortBy === "change") {
        valA = gszzlA;
        valB = gszzlB;
      } else if (sortBy === "profit") {
        valA = profitA;
        valB = profitB;
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return sorted;
  }, [portfolio, fundData, sortBy, sortOrder]);

  const handleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(type);
      setSortOrder("desc");
    }
  };

  const handleEdit = (item) => {
    setEditingFund(item);
  };

  const handleRefresh = () => {
    fetchFundData("portfolio");
    fetchMarketIndices();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 h-full flex flex-col overflow-hidden">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">我的持仓</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={clsx("h-5 w-5", isLoading && "animate-spin")} />
        </Button>
      </header>

      <MarketIndices />

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
              <div>
                <div className="text-primary-foreground/80 text-sm mb-1">
                  总资产 (元)
                </div>
                <div className="text-4xl font-bold tracking-tight">
                  ¥
                  {summary.totalAmount.toLocaleString("zh-CN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 md:gap-12">
                <div>
                  <div className="text-primary-foreground/80 text-xs mb-1">
                    当日收益
                  </div>
                  <div className="text-lg font-semibold flex items-center">
                    {summary.dayProfit > 0
                      ? "+"
                      : summary.dayProfit < 0
                      ? "-"
                      : ""}
                    ¥{Math.abs(summary.dayProfit).toFixed(2)}
                  </div>
                  <div className="text-xs ml-1 opacity-80">
                    ({summary.dayProfitRate > 0 ? "+" : ""}
                    {summary.dayProfitRate.toFixed(2)}%)
                  </div>
                </div>
                <div>
                  <div className="text-primary-foreground/80 text-xs mb-1">
                    总收益
                  </div>
                  <div className="text-lg font-semibold flex items-center">
                    {summary.totalProfit > 0
                      ? "+"
                      : summary.totalProfit < 0
                      ? "-"
                      : ""}
                    ¥{Math.abs(summary.totalProfit).toFixed(2)}
                  </div>
                  <div className="text-xs ml-1 opacity-80">
                    ({summary.totalProfitRate > 0 ? "+" : ""}
                    {summary.totalProfitRate.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund List */}
      <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-semibold text-muted-foreground">持仓列表</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" /> 添加
          </Button>
        </div>

        {portfolio.length === 0 ? (
          isLoading ? (
            <PortfolioTableSkeleton />
          ) : (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <p>暂无持仓</p>
                <Button variant="link" onClick={() => setIsModalOpen(true)}>
                  点击添加基金
                </Button>
              </CardContent>
            </Card>
          )
        ) : (
          <PortfolioTable
            portfolio={sortedPortfolio}
            fundData={fundData}
            isLoading={isLoading}
            fundLoading={fundLoading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <AddFundModal
        isOpen={isModalOpen || !!editingFund}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFund(null);
        }}
        onAdd={(fund) => {
          if (editingFund) {
            updatePortfolioItem(fund);
          } else {
            addToPortfolio(fund);
          }
        }}
        initialFund={editingFund}
        mode="portfolio"
      />
    </div>
  );
}
