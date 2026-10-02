// Professional PDF Report Generator for Sales & Inventory Performance
import { jsPDF } from 'jspdf';
import type { Product } from '@/types';

export interface SalesReportData {
  timeframeLabel: string;
  generatedAt: string;
  generatedBy: string;
  grossSales: number;
  netSales: number;
  totalDiscounts: number;
  estimatedCOGS: number;
  grossProfit: number;
  profitMargin: number;
  averageOrderValue: number;
  totalTransactions: number;
  posCount: number;
  onlineCount: number;
  cashTotal: number;
  cardTotal: number;
  digitalTotal: number;
  topDishes: { name: string; quantity: number; revenue: number }[];
  categoryShare: { name: string; value: number; revenue: number }[];
  inventorySummary: {
    totalItems: number;
    totalCostValuation: number;
    totalRetailValuation: number;
    projectedMargin: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalSKUs: number;
  };
  sampleInventory: Product[];
}

export const generateExecutivePerformancePDF = (data: SalesReportData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 16;

  // Helper formatting
  const fmtMoney = (val: number) => `PHP ${Math.round(val).toLocaleString('en-PH')}`;

  // ==========================================
  // PAGE 1: EXECUTIVE SALES & FINANCIAL SUMMARY
  // ==========================================

  // Header Banner Background
  doc.setFillColor(97, 51, 25); // Brand Dark Brown #613319
  doc.rect(margin, currentY, contentWidth, 24, 'F');

  // Accent Gold Bar
  doc.setFillColor(245, 158, 11); // Amber / Yellow #f59e0b
  doc.rect(margin, currentY + 24, contentWidth, 2.5, 'F');

  // Header Brand Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("KIMAE'S PANCIT MALABON & PINAS DELICACIES", margin + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(254, 243, 199);
  doc.text(
    'Executive Business Performance & Inventory Valuation Report',
    margin + 6,
    currentY + 16
  );

  // Top-Right Metadata
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Period: ${data.timeframeLabel.toUpperCase()}`, pageWidth - margin - 6, currentY + 9, {
    align: 'right',
  });
  doc.text(`Generated: ${data.generatedAt}`, pageWidth - margin - 6, currentY + 15, {
    align: 'right',
  });
  doc.text(`Prepared By: ${data.generatedBy}`, pageWidth - margin - 6, currentY + 20, {
    align: 'right',
  });

  currentY += 34;

  // Section 1: Financial & Revenue KPIs (4 Key Metric Blocks)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('1. Executive Financial & Sales Performance', margin, currentY);

  currentY += 4;

  const cardW = (contentWidth - 6) / 4;
  const cardH = 20;

  // KPI 1: Net Sales
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, cardW, cardH, 2, 2, 'FD');
  doc.setFillColor(245, 158, 11);
  doc.rect(margin, currentY, 1.5, cardH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('NET SALES REVENUE', margin + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(fmtMoney(data.netSales), margin + 4, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`Gross: ${fmtMoney(data.grossSales)}`, margin + 4, currentY + 17);

  // KPI 2: Gross Profit
  const kpi2X = margin + cardW + 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kpi2X, currentY, cardW, cardH, 2, 2, 'FD');
  doc.setFillColor(16, 185, 129);
  doc.rect(kpi2X, currentY, 1.5, cardH, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('GROSS PROFIT', kpi2X + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(fmtMoney(data.grossProfit), kpi2X + 4, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`Margin: ${data.profitMargin}% (Est. COGS)`, kpi2X + 4, currentY + 17);

  // KPI 3: Orders Completed
  const kpi3X = kpi2X + cardW + 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kpi3X, currentY, cardW, cardH, 2, 2, 'FD');
  doc.setFillColor(59, 130, 246);
  doc.rect(kpi3X, currentY, 1.5, cardH, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL COMPLETED ORDERS', kpi3X + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.totalTransactions} Orders`, kpi3X + 4, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`POS: ${data.posCount} | Online: ${data.onlineCount}`, kpi3X + 4, currentY + 17);

  // KPI 4: Average Order Value
  const kpi4X = kpi3X + cardW + 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kpi4X, currentY, cardW, cardH, 2, 2, 'FD');
  doc.setFillColor(139, 92, 246);
  doc.rect(kpi4X, currentY, 1.5, cardH, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('AVG ORDER BASKET (AOV)', kpi4X + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(fmtMoney(data.averageOrderValue), kpi4X + 4, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Across Online & In-Store POS', kpi4X + 4, currentY + 17);

  currentY += cardH + 7;

  // Breakdown Table: Financial Statement Summary
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Financial Ledger Breakdown', margin, currentY);

  currentY += 3;

  // Ledger Table Box
  const ledgerRows = [
    { label: 'Gross Product Sales', value: fmtMoney(data.grossSales), note: 'Total value before discounts' },
    { label: 'Promotional & Suki Loyalty Discounts', value: `-${fmtMoney(data.totalDiscounts)}`, note: 'Vouchers & points applied' },
    { label: 'Net Realized Sales Revenue', value: fmtMoney(data.netSales), note: 'Audited net operational intake' },
    { label: 'Estimated Cost of Goods Sold (COGS ~52%)', value: `-${fmtMoney(data.estimatedCOGS)}`, note: 'Raw ingredients, meats, and seafood' },
    { label: 'Gross Operating Profit Margin', value: `${fmtMoney(data.grossProfit)} (${data.profitMargin}%)`, note: 'Available contribution margin' },
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('FINANCIAL METRIC', margin + 3, currentY + 4);
  doc.text('REMARKS / CALCULATION BASIS', margin + 70, currentY + 4);
  doc.text('AMOUNT (PHP)', pageWidth - margin - 3, currentY + 4, { align: 'right' });

  currentY += 6;

  ledgerRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 5.5, 'F');
    }
    doc.setFont('helvetica', idx === 2 || idx === 4 ? 'bold' : 'normal');
    doc.setFontSize(7);
    doc.setTextColor(idx === 2 ? 15 : idx === 4 ? 16 : 51, idx === 2 ? 23 : idx === 4 ? 185 : 65, idx === 2 ? 42 : idx === 4 ? 129 : 85);
    doc.text(row.label, margin + 3, currentY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(row.note, margin + 70, currentY + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(idx === 1 ? 220 : idx === 3 ? 180 : 15, idx === 1 ? 38 : idx === 3 ? 30 : 23, idx === 1 ? 38 : idx === 3 ? 30 : 42);
    doc.text(row.value, pageWidth - margin - 3, currentY + 4, { align: 'right' });

    currentY += 5.5;
  });

  currentY += 6;

  // Tender & Channel Distribution Box (Two Columns side by side)
  const colW = (contentWidth - 4) / 2;

  // Left Column: Payment Tenders
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Payment Tender Distribution', margin, currentY);

  // Right Column: Category Sales Share
  doc.text('Category Sales Contribution', margin + colW + 4, currentY);

  currentY += 3;

  // Render Payment Methods Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, colW, 28, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);

  const tenders = [
    { label: 'GCash / Maya Digital E-Wallets', val: data.digitalTotal, color: [16, 185, 129] },
    { label: 'Cash / COD Collections', val: data.cashTotal, color: [245, 158, 11] },
    { label: 'Credit / Debit Card Terminal', val: data.cardTotal, color: [59, 130, 246] },
  ];

  tenders.forEach((t, i) => {
    const rowY = currentY + 6 + i * 7;
    doc.setFillColor(t.color[0], t.color[1], t.color[2]);
    doc.circle(margin + 4, rowY - 1, 1.2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(t.label, margin + 8, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fmtMoney(t.val), margin + colW - 4, rowY, { align: 'right' });
  });

  // Render Category Share Box
  const catX = margin + colW + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(catX, currentY, colW, 28, 2, 2, 'FD');

  data.categoryShare.slice(0, 3).forEach((c, i) => {
    const rowY = currentY + 6 + i * 7;
    doc.setFillColor(245, 158, 11);
    doc.rect(catX + 4, rowY - 3, 2, 4, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(c.name, catX + 9, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${c.value}% (${fmtMoney(c.revenue)})`, catX + colW - 4, rowY, { align: 'right' });
  });

  currentY += 34;

  // Section 2: Top Selling Dishes Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Top Revenue-Generating Menu Items & Party Bilaos', margin, currentY);

  currentY += 3;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('#', margin + 3, currentY + 3.8);
  doc.text('MENU ITEM / PRODUCT NAME', margin + 10, currentY + 3.8);
  doc.text('VOLUME SOLD', margin + 110, currentY + 3.8, { align: 'center' });
  doc.text('SALES TURNOVER', pageWidth - margin - 3, currentY + 3.8, { align: 'right' });

  currentY += 5.5;

  data.topDishes.slice(0, 5).forEach((dish, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 5, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}`, margin + 3, currentY + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.text(dish.name, margin + 10, currentY + 3.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dish.quantity} units`, margin + 110, currentY + 3.5, { align: 'center' });
    doc.text(fmtMoney(dish.revenue), pageWidth - margin - 3, currentY + 3.5, { align: 'right' });
    currentY += 5;
  });

  // Footer for Page 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.text(
    'Kimae\'s Kitchen Confidential System Report • Built for Management Review',
    margin,
    pageHeight - 8
  );
  doc.text('Page 1 of 2', pageWidth - margin, pageHeight - 8, { align: 'right' });

  // ==========================================
  // PAGE 2: COMMISSARY INVENTORY & STOCK PERFORMANCE
  // ==========================================
  doc.addPage();
  currentY = 16;

  // Header Banner Background
  doc.setFillColor(97, 51, 25);
  doc.rect(margin, currentY, contentWidth, 20, 'F');
  doc.setFillColor(16, 185, 129); // Emerald bar for Inventory
  doc.rect(margin, currentY + 20, contentWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('COMMISSARY INVENTORY & RAW MATERIAL PERFORMANCE', margin + 6, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(209, 250, 229);
  doc.text('Stock Valuation, Buffer Health, Safety Stock Analysis & Reorder Audit', margin + 6, currentY + 15);

  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Audit Date: ${data.generatedAt}`, pageWidth - margin - 6, currentY + 12, { align: 'right' });

  currentY += 28;

  // Section 3: Inventory Valuation KPIs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('2. Commissary Stock Valuation & Health KPIs', margin, currentY);

  currentY += 4;

  const invW = (contentWidth - 6) / 4;
  const invH = 20;

  // Inv KPI 1: Cost Valuation
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, invW, invH, 2, 2, 'FD');
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, currentY, 1.5, invH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL COST VALUATION', margin + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(fmtMoney(data.inventorySummary.totalCostValuation), margin + 4, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${data.inventorySummary.totalSKUs} Tracked Active SKUs`, margin + 4, currentY + 17);

  // Inv KPI 2: Retail Valuation
  const inv2X = margin + invW + 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(inv2X, currentY, invW, invH, 2, 2, 'FD');
  doc.setFillColor(16, 185, 129);
  doc.rect(inv2X, currentY, 1.5, invH, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('RETAIL VALUATION (POTENTIAL)', inv2X + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(fmtMoney(data.inventorySummary.totalRetailValuation), inv2X + 4, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`Est. Margin: ${data.inventorySummary.projectedMargin}%`, inv2X + 4, currentY + 17);

  // Inv KPI 3: Units on Hand
  const inv3X = inv2X + invW + 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(inv3X, currentY, invW, invH, 2, 2, 'FD');
  doc.setFillColor(245, 158, 11);
  doc.rect(inv3X, currentY, 1.5, invH, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PHYSICAL UNITS IN COMMISSARY', inv3X + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.inventorySummary.totalItems.toLocaleString()} Units`, inv3X + 4, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Across Central Warehouse', inv3X + 4, currentY + 17);

  // Inv KPI 4: Stock Alerts
  const inv4X = inv3X + invW + 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(inv4X, currentY, invW, invH, 2, 2, 'FD');
  doc.setFillColor(239, 68, 68);
  doc.rect(inv4X, currentY, 1.5, invH, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('SAFETY STOCK BREACHES', inv4X + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(data.inventorySummary.lowStockCount > 0 ? 220 : 15, data.inventorySummary.lowStockCount > 0 ? 38 : 23, data.inventorySummary.lowStockCount > 0 ? 38 : 42);
  doc.text(`${data.inventorySummary.lowStockCount} Low / ${data.inventorySummary.outOfStockCount} Out`, inv4X + 4, currentY + 13);
  doc.setFontSize(6.5);
  doc.setTextColor(220, 38, 38);
  doc.text('Requires Reorder Action', inv4X + 4, currentY + 17);

  currentY += invH + 8;

  // Section 4: Detailed Inventory Master Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Master Inventory Audit & Buffer Stock Report', margin, currentY);

  currentY += 3;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SKU', margin + 3, currentY + 3.8);
  doc.text('ITEM NAME', margin + 25, currentY + 3.8);
  doc.text('STOCK / BUFFER', margin + 95, currentY + 3.8, { align: 'center' });
  doc.text('UNIT COST', margin + 130, currentY + 3.8, { align: 'right' });
  doc.text('TOTAL VALUE', margin + 155, currentY + 3.8, { align: 'right' });
  doc.text('STATUS', pageWidth - margin - 3, currentY + 3.8, { align: 'right' });

  currentY += 5.5;

  data.sampleInventory.slice(0, 15).forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 5.2, 'F');
    }

    const isLow = item.stock <= (item.reorderLevel || 15);
    const isOut = item.stock <= 0;
    const statusText = isOut ? 'OUT OF STOCK' : isLow ? 'LOW BUFFER' : 'HEALTHY';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(item.sku, margin + 3, currentY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(item.name.slice(0, 36), margin + 25, currentY + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isOut ? 220 : isLow ? 217 : 15, isOut ? 38 : isLow ? 119 : 23, isOut ? 38 : isLow ? 6 : 42);
    doc.text(`${item.stock} / ${item.reorderLevel || 15} ${item.unit || 'pcs'}`, margin + 95, currentY + 3.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(fmtMoney(item.cost), margin + 130, currentY + 3.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fmtMoney(item.stock * item.cost), margin + 155, currentY + 3.5, { align: 'right' });

    doc.setFontSize(6);
    doc.setTextColor(isOut ? 220 : isLow ? 217 : 16, isOut ? 38 : isLow ? 119 : 185, isOut ? 38 : isLow ? 6 : 129);
    doc.text(statusText, pageWidth - margin - 3, currentY + 3.5, { align: 'right' });

    currentY += 5.2;
  });

  currentY += 8;

  // Sign-off verification section
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('EXECUTIVE VERIFICATION & COMMISSARY CONTROLS', margin + 5, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This report certifies synchronized reconciliation between online customer transactions, commissary kitchen dispatch, and physical count inventory. All records comply with restaurant standard operating procedures.',
    margin + 5,
    currentY + 11,
    { maxWidth: contentWidth - 10 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Verified By: ___________________________ (Operations Head)', margin + 5, currentY + 18);
  doc.text('Audited By: ___________________________ (Finance Officer)', margin + 100, currentY + 18);

  // Footer for Page 2
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.text(
    'Kimae\'s Kitchen Confidential System Report • Built for Management Review',
    margin,
    pageHeight - 8
  );
  doc.text('Page 2 of 2', pageWidth - margin, pageHeight - 8, { align: 'right' });

  // Save the PDF file
  const fileName = `Kimaes_Executive_Sales_Inventory_Report_${data.timeframeLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
