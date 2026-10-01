import React, { useRef } from 'react';
import type { POSTransaction } from '@/types';
import { formatPrice } from '@/lib/store';
import { Printer, Download, Mail, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

interface POSReceiptModalProps {
  transaction: POSTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function POSReceiptModal({ transaction, isOpen, onClose }: POSReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML;
    const printWindow = window.open('', '', 'width=420,height=650');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt #${transaction.receiptNumber}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.4; padding: 15px; color: #000; width: 320px; margin: auto; }
              .center { text-align: center; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 8px 0; }
              .item-row { display: flex; justify-content: space-between; margin: 3px 0; }
              .small { font-size: 11px; }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleSendEmail = () => {
    const email = transaction.customer?.email || prompt('Enter customer email for digital receipt:');
    if (email) {
      toast.success(`Digital receipt #${transaction.receiptNumber} sent to ${email}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600" size={20} />
            <h3 className="font-black text-lg" style={{ fontFamily: 'Nunito' }}>Transaction Receipt</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Printable Receipt Paper Visual */}
        <div className="flex-1 overflow-y-auto p-5 bg-muted/20">
          <div
            ref={receiptRef}
            className="bg-white text-black p-6 rounded-xl border border-dashed border-border shadow-sm text-xs font-mono space-y-3"
          >
            <div className="text-center space-y-1">
              <p className="font-black text-base tracking-tight">KIMAE'S PARTY BILAO</p>
              <p className="text-[10px] text-gray-500">Authentic Filipino Bilao & Party Trays</p>
              <p className="text-[10px] text-gray-500">123 Market Boulevard, Quezon City</p>
              <p className="text-[10px] text-gray-500">TIN: 489-012-345-000 | BIR Reg POS</p>
              <p className="text-[10px] text-gray-500">Hotline: (02) 8911-5462 / 0917-123-4567</p>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-2 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Ticket / Ref:</span>
                <span>{transaction.ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{new Date(transaction.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier / Reg:</span>
                <span>{transaction.cashierName} ({transaction.registerId})</span>
              </div>
              {transaction.customer && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-bold">{transaction.customer.name}</span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="border-t border-dashed border-gray-300 pt-2">
              <div className="flex justify-between font-bold pb-1 text-[11px] border-b border-gray-200">
                <span>Item Description</span>
                <span>Amount</span>
              </div>
              <div className="space-y-1.5 pt-1.5">
                {transaction.items.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between font-semibold">
                      <span className="truncate max-w-[190px]">{item.quantity}x {item.product.name}</span>
                      <span>{formatPrice(item.lineTotal)}</span>
                    </div>
                    {item.itemDiscount > 0 && (
                      <div className="flex justify-between text-[10px] text-red-600 pl-3">
                        <span>Discount</span>
                        <span>-{formatPrice(item.itemDiscount * item.quantity)}</span>
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-gray-500 pl-3 italic">{item.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(transaction.subtotal)}</span>
              </div>
              {transaction.orderDiscount > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Discount ({transaction.orderDiscountLabel || 'Promo'}):</span>
                  <span>-{formatPrice(transaction.orderDiscount)}</span>
                </div>
              )}
              {transaction.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge:</span>
                  <span>{formatPrice(transaction.serviceCharge)}</span>
                </div>
              )}
              {transaction.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>VAT (12%):</span>
                  <span>{formatPrice(transaction.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-dashed border-gray-300 pt-1.5">
                <span>TOTAL AMOUNT:</span>
                <span>{formatPrice(transaction.totalAmount)}</span>
              </div>
            </div>

            {/* Payments */}
            <div className="border-t border-dashed border-gray-300 pt-2 text-[11px] space-y-1">
              <span className="font-bold text-[10px] text-gray-600 uppercase">Payment Summary:</span>
              {transaction.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{p.methodLabel} {p.referenceNumber ? `(${p.referenceNumber})` : ''}:</span>
                  <span>{formatPrice(p.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span>Amount Tendered:</span>
                <span>{formatPrice(transaction.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-green-700">
                <span>Change Given:</span>
                <span>{formatPrice(transaction.changeDue)}</span>
              </div>
            </div>

            {/* Loyalty points if applicable */}
            {transaction.customer && (
              <div className="border-t border-dashed border-gray-300 pt-2 text-[10px] text-center text-gray-600">
                <p>Earned: +{Math.floor(transaction.totalAmount / 50)} Kimae Rewards Points ⭐</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-dashed border-gray-300 pt-3 text-center space-y-1">
              <p className="font-bold text-[11px]">Maraming Salamat po!</p>
              <p className="text-[9px] text-gray-500">Thank you for dining with Kimae's!</p>
              <p className="text-[9px] text-gray-400">THIS SERVES AS AN OFFICIAL SALES INVOICE</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-border bg-card flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleSendEmail}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Mail size={15} /> E-Receipt
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-brand-yellow-dark transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer size={15} /> Print Thermal (80mm)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:bg-black transition-colors"
          >
            Done / Next Sale
          </button>
        </div>
      </div>
    </div>
  );
}
