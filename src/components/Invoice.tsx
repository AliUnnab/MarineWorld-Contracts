import React from 'react';

export interface InvoiceItem {
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
}

export interface InvoiceProps {
  invoiceNo: string;
  invoiceDate: any;
  customerName: string;
  workspaceId: string;
  taxNo?: string;
  paymentMethod: string;
  paymentProvider?: string;
  transactionId?: string;
  items: InvoiceItem[];
  subtotal: string;
  tax: string;
  totalAmount: string;
  amountPaid: string;
  onClose?: () => void;
  actionButton?: React.ReactNode;
}

export default function Invoice({
  invoiceNo,
  invoiceDate,
  customerName,
  workspaceId,
  taxNo = 'N/A',
  paymentMethod,
  paymentProvider = 'Stripe',
  transactionId,
  items,
  subtotal,
  tax,
  totalAmount,
  amountPaid,
  onClose,
  actionButton
}: InvoiceProps) {
  // Format the date dynamically and robustly to match the ISO format from the mockup
  let formattedDate = '';
  if (invoiceDate) {
    if (typeof invoiceDate === 'string') {
      try {
        formattedDate = new Date(invoiceDate).toISOString();
      } catch (e) {
        formattedDate = invoiceDate;
      }
    } else if (typeof (invoiceDate as any).toDate === 'function') {
      formattedDate = (invoiceDate as any).toDate().toISOString();
    } else {
      try {
        formattedDate = new Date(invoiceDate).toISOString();
      } catch (e) {
        formattedDate = String(invoiceDate);
      }
    }
  }

  return (
    <div className="w-full max-w-3xl bg-white text-[#0F172A] p-8 md:p-12 font-sans mx-auto text-left shadow-sm border border-slate-100">
      {/* Header controls (if any action/close needed, hidden on print) */}
      {(onClose || actionButton) && (
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 print:hidden">
          {onClose ? (
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors"
            >
              ← Close
            </button>
          ) : (
            <div />
          )}
          {actionButton}
        </div>
      )}

      {/* Invoice Page Container */}
      <div className="space-y-10">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          {/* Top Left Branding */}
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-black uppercase leading-none font-sans">
              MARINEWORLD
            </h1>
            <p className="text-[17px] font-normal text-black leading-tight mt-1 font-sans">
              Contract Studio
            </p>
            <div className="mt-3 text-[10px] text-slate-400 font-medium leading-relaxed font-sans">
              <p>The Contract Operating System</p>
              <p>for the Global Maritime Economy</p>
            </div>
          </div>

          {/* Top Right Title */}
          <div className="sm:text-right">
            <h2 className="text-3xl font-light tracking-wide text-black uppercase leading-none font-sans">
              INVOICE
            </h2>
            <div className="mt-4">
              <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Invoice No.</span>
              <span className="block text-[13px] font-bold text-black mt-0.5">{invoiceNo}</span>
            </div>
            <div className="mt-3.5">
              <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Invoice Date</span>
              <span className="block text-[12px] font-bold text-black mt-0.5 break-all">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t-[0.5px] border-slate-200" />

        {/* Client & Payment Info Grid */}
        <div className="grid grid-cols-2 gap-8 text-xs">
          {/* Bill To */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              BILL TO
            </h3>
            <div>
              <span className="block text-[10px] text-slate-400 font-medium">Customer</span>
              <span className="block text-[13px] text-black mt-0.5 font-normal">{customerName}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-medium">Workspace ID</span>
              <span className="block text-[13px] text-black mt-0.5 font-normal">{workspaceId}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-medium">Tax/VAT No:</span>
              <span className="block text-[13px] text-black mt-0.5 font-normal">{taxNo}</span>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PAYMENT INFORMATION
            </h3>
            <div>
              <span className="block text-[10px] text-slate-400 font-medium">Payment Method</span>
              <span className="block text-[13px] text-black mt-0.5 font-normal">{paymentMethod}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-medium">Payment Provider</span>
              <span className="block text-[13px] text-black mt-0.5 font-normal">{paymentProvider}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-medium">Transaction ID</span>
              <span className="block text-[13px] text-black mt-0.5 font-normal">{transactionId || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Invoice Details Table */}
        <div className="space-y-4 pt-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            INVOICE DETAILS
          </h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-[0.5px] border-slate-200 text-black font-bold">
                  <th className="py-2.5 text-left font-bold text-black">Description</th>
                  <th className="py-2.5 text-center font-bold text-black w-16">Qty</th>
                  <th className="py-2.5 text-center font-bold text-black w-28">Unit Price</th>
                  <th className="py-2.5 text-right font-bold text-black w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y-[0.5px] divide-slate-200">
                {items.map((item, index) => (
                  <tr key={index} className="text-black font-normal">
                    <td className="py-3.5 text-left text-black font-normal">{item.description}</td>
                    <td className="py-3.5 text-center text-black font-normal">{item.qty}</td>
                    <td className="py-3.5 text-center text-black font-normal">{item.unitPrice}</td>
                    <td className="py-3.5 text-right text-black font-normal">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary and Signature Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
          <div className="flex-1" />
          
          {/* Summary Box */}
          <div className="w-full sm:w-72 bg-gray-50 p-5 rounded-none text-xs space-y-2.5">
            <div className="flex justify-between items-center text-slate-500">
              <span className="font-normal text-slate-400">Subtotal</span>
              <span className="text-black font-normal">{subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span className="font-normal text-slate-400">Tax</span>
              <span className="text-black font-normal">{tax}</span>
            </div>
            <hr className="border-t-[0.5px] border-slate-200 my-1" />
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-semibold text-slate-400">Total</span>
              <span className="text-black font-semibold">{totalAmount}</span>
            </div>
            <div className="flex justify-between items-center text-black font-bold text-sm pt-0.5">
              <span>Amount Paid</span>
              <span className="font-bold text-black">{amountPaid}</span>
            </div>
          </div>
        </div>

        {/* Footer section */}
        <div className="pt-8 border-t-[0.5px] border-slate-200">
          <div className="grid grid-cols-2 gap-4 text-[9px] leading-relaxed text-slate-400">
            {/* Left Footer Info */}
            <div>
              <span className="block font-bold text-black">Web 4.0 OS.</span>
              <span className="block mt-1 font-medium text-slate-400">1309 Coffeen Avenue STE 14949</span>
              <span className="block font-medium text-slate-400">Sheridan Wyoming 82801 - United States</span>
            </div>

            {/* Right Footer Info */}
            <div className="text-right">
              <span className="block font-bold text-black">MarineWorld Contract Studio</span>
              <span className="block mt-1 font-medium text-slate-400">A product of Web 4.0 OS - Wyoming, USA</span>
              <span className="block font-medium text-slate-400">Thank you for your business.</span>
            </div>
          </div>
          
          {/* Bottom Center Email */}
          <div className="text-center mt-6">
            <a
              href="mailto:support@marineworld.city"
              className="text-[9px] text-slate-400 hover:text-slate-600 transition-colors underline font-medium"
            >
              support@marineworld.city
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
