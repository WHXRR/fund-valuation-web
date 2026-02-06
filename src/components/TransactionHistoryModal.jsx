import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, History } from "lucide-react";
import { format } from 'date-fns';
import { formatTransactionDisplay } from '../utils/transactionFormatter';

const TransactionHistoryModal = ({ isOpen, onClose, transactions, onRevoke }) => {
  // Sort descending by time
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.time) - new Date(a.time));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90%] w-sm max-h-[80vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-center">交易记录</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {sortedTransactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8 flex flex-col items-center gap-2">
               <History className="w-8 h-8 opacity-20" />
               <p>暂无交易记录</p>
            </div>
          ) : (
            sortedTransactions.map((tx) => {
              const transactionDate = new Date(tx.time);
              // Use confirmationTime if available, otherwise fallback to transactionDate
              const confirmationDate = tx.confirmationTime ? new Date(tx.confirmationTime) : transactionDate;
              const createTime = tx.createTime ? new Date(tx.createTime) : null;
              
              const now = new Date();
              const isConfirmed = confirmationDate <= now;
              
              const { isBuy, typeLabel, mainDisplay, subDisplay } = formatTransactionDisplay(tx);

              return (
                <div key={tx.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold px-1.5 py-0.5 rounded ${isBuy ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {typeLabel}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-lg leading-tight">
                          {mainDisplay}
                        </span>
                        {subDisplay && (
                           <span className="text-xs text-gray-500">
                             {subDisplay}
                           </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-1">
                      {isConfirmed ? (
                         <span className="text-gray-400">确认日期: {format(confirmationDate, 'yyyy-MM-dd')}</span>
                      ) : (
                         <span className="text-orange-500 font-medium">预计确认: {format(confirmationDate, 'yyyy-MM-dd')}</span>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-gray-300">
                         <span>申请日: {format(transactionDate, 'MM-dd')}</span>
                         {createTime && <span>操作: {format(createTime, 'MM-dd HH:mm')}</span>}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => onRevoke(tx.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionHistoryModal;
