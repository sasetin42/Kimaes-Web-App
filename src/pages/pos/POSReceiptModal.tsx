import React, { useState } from 'react';
import type { POSTransaction } from '@/types';
import { formatPrice } from '@/lib/store';
import {
  Printer,
  Download,
  Mail,
  CheckCircle2,
  X,
  FileText,
  Receipt,
  Building2,
  Phone,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

interface POSReceiptModalProps {
  transaction: POSTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function POSReceiptModal({
  transaction,
  isOpen,
  onClose,
}: POSReceiptModalProps) {
  const [printLayout, setPrintLayout] = useState<'thermal' | 'invoice'>('thermal');

  if (!isOpen || !transaction) return null;

  const handleDirectPrint = () => {
    // Directly triggers the browser printer dialog safely without window.open
    window.print();
  };

  const handleSendEmail = () => {
    const email =
      transaction.customer?.email ||
      prompt('Enter customer email for digital receipt / invoice:', 'customer@example.com');
    if (email) {
      toast.success(
        `Official ${printLayout === 'invoice' ? 'Sales Invoice' : 'Receipt'} #${
          transaction.receiptNumber
        } sent to ${email}`
      );
    }
  };

  const handleDownloadCopy = () => {
    window.print();
  };

  // Calculations for official sales invoice
  const vatableSales = Math.round((transaction.totalAmount / 1.12) * 100) / 100;
  const vatAmount = Math.round((transaction.totalAmount - vatableSales) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <div>
              <h3 className="font-black text-lg text-secondary leading-tight" style={{ fontFamily: 'Nunito' }}>
                POS Receipt & Sales Invoice
              </h3>
              <p className="text-xs text-muted-foreground">
                Transaction Completed: #{transaction.ticketNumber}
              </p>
            </div>
          </div>

          {/* Format Switcher */}
          <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-xl">
            <button
              onClick={() => setPrintLayout('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printLayout === 'thermal'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Receipt size={14} /> Thermal 80mm
            </button>
            <button
              onClick={() => setPrintLayout('invoice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printLayout === 'invoice'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={14} /> Official Invoice (A4)
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
          <div
            id="kimae-pos-printable"
            className={`mx-auto bg-white text-black transition-all ${
              printLayout === 'thermal'
                ? 'max-w-[340px] p-5 rounded-xl border border-dashed border-gray-300 font-mono text-xs shadow-sm space-y-3'
                : 'max-w-2xl p-8 rounded-xl border border-gray-300 shadow-sm font-sans text-xs space-y-5'
            }`}
          >
            {/* ============================================================== */}
            {/* LAYOUT 1: THERMAL RECEIPT (80mm) */}
            {/* ============================================================== */}
            {printLayout === 'thermal' && (
              <div className="space-y-3">
                {/* Header */}
                <div className="text-center space-y-1">
                  <p className="font-black text-base tracking-wider uppercase font-sans">
                    KIMAE'S PARTY BILAO
                  </p>
                  <p className="text-[10px] text-gray-700 font-semibold italic">
                    "Your Partner for Every Occasion"
                  </p>
                  <p className="text-[10px] text-gray-500">Since 2020</p>
                  <p className="text-[10px] text-gray-600">
                    BLK 31 LOT 14 PUROK 3, Victoria Reyes, Dasmariñas, Cavite
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Mobile: 0991 598 4112 / 0961 772 2601
                  </p>
                  <p className="text-[10px] text-gray-500">Email: kimaespartybilao@gmail.com</p>
                  <p className="text-[9px] text-gray-400">BIR TIN: 489-012-345-000 NV</p>
                </div>

                <div className="border-t border-dashed border-gray-400 pt-2 text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Receipt No:</span>
                    <span className="font-bold">{transaction.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ticket / Order:</span>
                    <span>{transaction.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span>{new Date(transaction.createdAt).toLocaleString('en-PH')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{transaction.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terminal:</span>
                    <span>{transaction.registerId || 'Counter 1'}</span>
                  </div>
                  {transaction.customer && (
                    <div className="flex justify-between border-t border-dotted border-gray-300 pt-1 mt-1">
                      <span>Customer:</span>
                      <span className="font-bold">{transaction.customer.name}</span>
                    </div>
                  )}
                  {transaction.customer?.mobile && (
                    <div className="flex justify-between text-[10px] text-gray-600">
                      <span>Contact:</span>
                      <span>{transaction.customer.mobile}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="border-t border-dashed border-gray-400 pt-2">
                  <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-gray-300">
                    <span>Qty & Description</span>
                    <span>Total</span>
                  </div>
                  <div className="space-y-1.5 pt-1.5">
                    {transaction.items.map((item, idx) => (
                      <div key={idx} className="text-[11px]">
                        <div className="flex justify-between font-semibold">
                          <span className="truncate max-w-[200px]">
                            {item.quantity}x {item.product.name}
                          </span>
                          <span>{formatPrice(item.lineTotal)}</span>
                        </div>
                        {/* Variant options if any */}
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="text-[9px] text-gray-500 pl-3">
                            {Object.entries(item.selectedOptions).map(([k, v]) => (
                              <span key={k} className="mr-2">
                                {Array.isArray(v) ? v.join(', ') : v}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.itemDiscount > 0 && (
                          <div className="flex justify-between text-[10px] text-red-600 pl-3">
                            <span>Item Discount</span>
                            <span>-{formatPrice(item.itemDiscount * item.quantity)}</span>
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-[9px] text-gray-500 italic pl-3">Note: {item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(transaction.subtotal)}</span>
                  </div>
                  {transaction.orderDiscount > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Discount ({transaction.orderDiscountLabel || 'Promo'}):</span>
                      <span>-{formatPrice(transaction.orderDiscount)}</span>
                    </div>
                  )}
                  {transaction.taxAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>VAT (12%):</span>
                      <span>{formatPrice(transaction.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black border-t-2 border-dashed border-black pt-1 mt-1">
                    <span>TOTAL AMOUNT:</span>
                    <span>{formatPrice(transaction.totalAmount)}</span>
                  </div>
                </div>

                {/* Payments */}
                <div className="border-t border-dashed border-gray-400 pt-2 text-[11px] space-y-1">
                  <div className="font-bold text-[10px] text-gray-600 uppercase">Payment Details:</div>
                  {transaction.payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {p.methodLabel} {p.referenceNumber ? `(${p.referenceNumber})` : ''}:
                      </span>
                      <span>{formatPrice(p.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span>Amount Tendered:</span>
                    <span>{formatPrice(transaction.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Change Due:</span>
                    <span>{formatPrice(transaction.changeDue)}</span>
                  </div>
                </div>

                {/* Customer Points */}
                {transaction.customer && (
                  <div className="border-t border-dotted border-gray-300 pt-1 text-[10px] text-center text-gray-600">
                    <p>Earned +{Math.floor(transaction.totalAmount / 50)} Kimae Suki Points ⭐</p>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-dashed border-gray-400 pt-3 text-center space-y-1">
                  <p className="font-black text-xs uppercase">Maraming Salamat po!</p>
                  <p className="text-[10px] text-gray-600">Good Food. Happy Family.</p>
                  <p className="text-[10px] text-gray-600">Your Partner for Every Occasion.</p>
                  <p className="text-[8px] text-gray-400 pt-1">
                    THIS SERVES AS AN OFFICIAL POS SALES SLIP
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* LAYOUT 2: OFFICIAL SALES INVOICE (A4 / Standard) */}
            {/* ============================================================== */}
            {printLayout === 'invoice' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="flex items-start justify-between border-b-2 border-primary pb-5">
                  <div className="space-y-1">
                    <h2
                      className="text-2xl font-black text-secondary tracking-tight"
                      style={{ fontFamily: 'Nunito' }}
                    >
                      KIMAE'S PARTY BILAO
                    </h2>
                    <p className="text-xs font-bold text-primary tracking-wide">
                      YOUR PARTNER FOR EVERY OCCASION — SINCE 2020
                    </p>
                    <p className="text-xs text-gray-600">
                      BLK 31 LOT 14 PUROK 3, Victoria Reyes, Dasmariñas, Cavite
                    </p>
                    <p className="text-xs text-gray-600">
                      Tel: 0991 598 4112 / 0961 772 2601 | Email: kimaespartybilao@gmail.com
                    </p>
                    <p className="text-[11px] text-gray-500">TIN: 489-012-345-000 Non-VAT</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="inline-block px-3 py-1 bg-primary text-secondary font-black text-sm rounded uppercase tracking-wider">
                      SALES INVOICE
                    </span>
                    <p className="text-xs font-bold pt-1">Invoice #: {transaction.receiptNumber}</p>
                    <p className="text-xs text-gray-600">Ticket #: {transaction.ticketNumber}</p>
                    <p className="text-xs text-gray-600">
                      Date: {new Date(transaction.createdAt).toLocaleDateString('en-PH')}
                    </p>
                    <p className="text-xs text-gray-600">
                      Time: {new Date(transaction.createdAt).toLocaleTimeString('en-PH')}
                    </p>
                  </div>
                </div>

                {/* Customer & Register Info */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Sold To / Customer:
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {transaction.customer?.name || 'Walk-in Guest / Retail Customer'}
                    </p>
                    {transaction.customer?.mobile && (
                      <p className="text-xs text-gray-600">Phone: {transaction.customer.mobile}</p>
                    )}
                    {transaction.customer?.email && (
                      <p className="text-xs text-gray-600">Email: {transaction.customer.email}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Terminal & Staff:
                    </p>
                    <p className="text-xs font-semibold">Cashier: {transaction.cashierName}</p>
                    <p className="text-xs text-gray-600">
                      Register: {transaction.registerId || 'POS-01 Main'}
                    </p>
                    <p className="text-xs text-gray-600">Status: Fully Paid / Completed</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 text-center">Unit Price</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-center">Discount</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transaction.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-gray-900">{item.product.name}</span>
                            {item.product.sku && (
                              <span className="text-[10px] text-gray-500 block">
                                SKU: {item.product.sku}
                              </span>
                            )}
                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                              <span className="text-[10px] text-gray-600 block italic">
                                {Object.entries(item.selectedOptions)
                                  .map(([k, v]) => (Array.isArray(v) ? v.join(', ') : v))
                                  .join(' | ')}
                              </span>
                            )}
                            {item.notes && (
                              <span className="text-[10px] text-amber-700 block">
                                Note: {item.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-600">
                            {formatPrice(item.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-center text-red-600">
                            {item.itemDiscount > 0
                              ? `-${formatPrice(item.itemDiscount * item.quantity)}`
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                            {formatPrice(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Invoice Footer Breakdown */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  {/* Left: VAT & Tax Breakdown */}
                  <div className="space-y-1.5 text-xs text-gray-600 border border-gray-200 p-3.5 rounded-xl bg-gray-50">
                    <p className="font-bold text-[10px] uppercase text-gray-500 tracking-wider">
                      Tax & VAT Summary
                    </p>
                    <div className="flex justify-between">
                      <span>VATable Sales:</span>
                      <span>{formatPrice(vatableSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT-Exempt Sales:</span>
                      <span>₱0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Zero-Rated Sales:</span>
                      <span>₱0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT Amount (12%):</span>
                      <span>{formatPrice(vatAmount)}</span>
                    </div>
                  </div>

                  {/* Right: Payment Totals */}
                  <div className="space-y-1.5 text-xs border border-gray-200 p-3.5 rounded-xl bg-gray-50">
                    <div className="flex justify-between">
                      <span>Gross Subtotal:</span>
                      <span className="font-semibold">{formatPrice(transaction.subtotal)}</span>
                    </div>
                    {transaction.orderDiscount > 0 && (
                      <div className="flex justify-between text-red-600 font-semibold">
                        <span>Discount ({transaction.orderDiscountLabel || 'Promo'}):</span>
                        <span>-{formatPrice(transaction.orderDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-secondary border-t border-gray-300 pt-2 mt-2">
                      <span>TOTAL PAYABLE:</span>
                      <span className="text-primary">{formatPrice(transaction.totalAmount)}</span>
                    </div>
                    <div className="border-t border-dotted border-gray-300 pt-1 mt-1 text-[11px] text-gray-600 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Paid via:</span>
                        <span>
                          {transaction.payments.map((p) => p.methodLabel).join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tendered:</span>
                        <span>{formatPrice(transaction.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800">
                        <span>Change Given:</span>
                        <span>{formatPrice(transaction.changeDue)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs text-gray-500">
                  <div className="border-t border-gray-300 pt-2">
                    <p className="font-semibold text-gray-800">{transaction.cashierName}</p>
                    <p className="text-[10px]">Authorized Cashier / Representative</p>
                  </div>
                  <div className="border-t border-gray-300 pt-2">
                    <p className="font-semibold text-gray-800">
                      {transaction.customer?.name || 'Customer Signature'}
                    </p>
                    <p className="text-[10px]">Received in Good Order and Condition</p>
                  </div>
                </div>

                <div className="text-center pt-2 border-t border-gray-200 text-[10px] text-gray-400">
                  <p>Kimae's Party Bilao • Dasmariñas, Cavite • Your Partner for Every Occasion</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls - Hidden on Print */}
        <div className="p-4 border-t border-border bg-card flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="text-xs text-muted-foreground hidden sm:block">
            <span>Ready for 80mm thermal receipt or standard A4 invoice</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleSendEmail}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <Mail size={15} /> E-Receipt
            </button>
            <button
              onClick={handleDirectPrint}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-brand-yellow-dark transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Printer size={16} /> Print {printLayout === 'thermal' ? 'Receipt' : 'Invoice'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:bg-black transition-colors"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
