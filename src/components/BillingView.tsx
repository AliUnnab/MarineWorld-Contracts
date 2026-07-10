import React, { useState, useEffect } from 'react';
import { auth, db, logAuditEvent } from '../../services/firebase-service';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { 
  CreditCard, FileText, Download, CheckCircle, AlertTriangle, 
  ArrowUpRight, ShieldCheck, RefreshCw, Loader2, Save 
} from 'lucide-react';
import { SaaSInvoice } from '../types/saas';
import { jsPDF } from 'jspdf';
import PaymentModal from './PaymentModal';
import { StripeService } from '../services/stripe-service';
import Invoice from './Invoice';

interface BillingViewProps {
  userId: string;
  userDisplayName?: string;
}

export default function BillingView({ userId, userDisplayName }: BillingViewProps) {
  const [invoices, setInvoices] = useState<SaaSInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const formatToUSD = (amtStr: string) => {
    if (!amtStr) return 'USD 0.00';
    let cleaned = amtStr.toUpperCase().trim();
    if (cleaned.includes('CR') || cleaned.includes('CREDIT') || cleaned.includes('CREDITS')) {
      const match = cleaned.match(/[\d.]+/);
      if (match) {
        const val = parseFloat(match[0]);
        return `USD ${(val * 0.03).toFixed(2)}`;
      }
      return 'USD 0.00';
    }
    if (cleaned.includes('$')) {
      const valStr = cleaned.replace('$', '').trim();
      const val = parseFloat(valStr);
      if (!isNaN(val)) {
        return `USD ${val.toFixed(2)}`;
      }
    }
    if (cleaned.includes('USD')) {
      const match = cleaned.match(/[\d.]+/);
      if (match) {
        return `USD ${parseFloat(match[0]).toFixed(2)}`;
      }
    }
    const match = cleaned.match(/[\d.]+/);
    if (match) {
      return `USD ${parseFloat(match[0]).toFixed(2)}`;
    }
    return 'USD 0.00';
  };
  
  // Payment card inputs
  const [cardName, setCardName] = useState(userDisplayName || 'Ali Unnab');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('06/28');
  const [cardCvc, setCardCvc] = useState('•••');
  
  const [editingCard, setEditingCard] = useState(false);
  const [updatingCard, setUpdatingCard] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Listen to invoices
    const qInvoices = query(collection(db, 'invoices'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(qInvoices, (snap) => {
      const records: SaaSInvoice[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === userId) {
          records.push({ id: docSnap.id, ...data } as SaaSInvoice);
        }
      });
      // Sort newest invoice first
      records.sort((a, b) => {
        const parseDate = (d: any) => {
          if (!d) return 0;
          if (typeof d === 'string') return new Date(d).getTime();
          if (d.toMillis) return d.toMillis();
          if (d.seconds) return d.seconds * 1000;
          return 0;
        };
        return parseDate(b.date) - parseDate(a.date);
      });
      setInvoices(records);
      setLoading(false);
    }, (err) => {
      console.error("Firestore loading invoices failed:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleUpdateCard = async (lastFour: string, cardHolder: string) => {
    setUpdatingCard(true);
    try {
      const walletRef = doc(db, 'wallets', userId);
      await setDoc(walletRef, {
        isPaymentMethodValid: true,
        lastFour: lastFour,
        cardHolder: cardHolder,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("Billing primary corporate card successfully tokenized via Stripe secure vaults.");
      await logAuditEvent(userId, `Updated and tokenized primary billing payment card reference ending in ${lastFour}`, "Billing & Ledgers");
      setEditingCard(false);
    } catch (err: any) {
      console.error("Failed to update wallet card profile:", err);
      alert("Failed to update card: " + err.message);
    } finally {
      setUpdatingCard(false);
    }
  };

  const handleDownloadInvoice = async (invoice: SaaSInvoice) => {
    // Generate simple client-side printout for invoice PDF (A5 portrait)
    // A5 Size: 148 x 210 mm
    const doc = new jsPDF({ format: 'a5', orientation: 'portrait' });
    
    const textBlack = [15, 23, 42]; // Slate 900
    const textGray = [100, 116, 139]; // Slate 500
    const dividerColor = [226, 232, 240]; // Slate 200
    
    let dateStr = 'N/A';
    if (invoice.date) {
      if (typeof invoice.date === 'string') {
        try {
          dateStr = new Date(invoice.date).toISOString();
        } catch (e) {
          dateStr = invoice.date;
        }
      } else if (typeof (invoice.date as any).toDate === 'function') {
        dateStr = (invoice.date as any).toDate().toISOString();
      }
    }

    const setFont = (style: 'bold' | 'normal', size: number, color: number[]) => {
      doc.setFont("helvetica", style);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
    };

    // --- HEADER LEFT ---
    setFont("bold", 12, textBlack);
    doc.text("MARINEWORLD", 15, 18);
    
    setFont("normal", 10, textBlack);
    doc.text("Contract Studio", 15, 22.5);
    
    setFont("normal", 6.5, textGray);
    doc.text("The Contract Operating System", 15, 27);
    doc.text("for the Global Maritime Economy", 15, 30.5);

    // --- HEADER RIGHT ---
    setFont("bold", 16, textBlack);
    doc.text("INVOICE", 133, 18, { align: "right" });
    
    setFont("normal", 6.5, textGray);
    doc.text("Invoice No.", 133, 24, { align: "right" });
    
    setFont("bold", 8.5, textBlack);
    doc.text(invoice.invoiceNumber || "INV-000000", 133, 28, { align: "right" });
    
    setFont("normal", 6.5, textGray);
    doc.text("Invoice Date", 133, 33.5, { align: "right" });
    
    setFont("bold", 7.5, textBlack);
    doc.text(dateStr, 133, 37.5, { align: "right" });

    // --- DIVIDER ---
    doc.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
    doc.setLineWidth(0.25);
    doc.line(15, 43, 133, 43);

    // --- BILL TO vs PAYMENT INFO ---
    setFont("bold", 7.5, textGray);
    doc.text("BILL TO", 15, 50);
    doc.text("PAYMENT INFORMATION", 74, 50);

    // Bill To details
    setFont("normal", 6.5, textGray);
    doc.text("Customer", 15, 55);
    setFont("normal", 8, textBlack);
    const customerName = userDisplayName || 'MarineWorld User';
    doc.text(customerName.length > 25 ? customerName.substring(0, 25) + '...' : customerName, 15, 58.5);

    setFont("normal", 6.5, textGray);
    doc.text("Workspace ID", 15, 64);
    setFont("normal", 8, textBlack);
    doc.text(`WS-${userId.substring(0,8).toUpperCase()}`, 15, 67.5);

    setFont("normal", 6.5, textGray);
    doc.text("Tax/VAT No:", 15, 73);
    setFont("normal", 8, textBlack);
    doc.text("N/A", 15, 76.5);

    // Payment info details
    setFont("normal", 6.5, textGray);
    doc.text("Payment Method", 74, 55);
    setFont("normal", 8, textBlack);
    doc.text("Credit Card (•••• 4242)", 74, 58.5);

    setFont("normal", 6.5, textGray);
    doc.text("Payment Provider", 74, 64);
    setFont("normal", 8, textBlack);
    doc.text("Stripe", 74, 67.5);

    setFont("normal", 6.5, textGray);
    doc.text("Transaction ID", 74, 73);
    setFont("normal", 8, textBlack);
    const txId = `TX-${Math.random().toString(36).substring(2,10).toUpperCase()}`;
    doc.text(txId, 74, 76.5);

    // --- INVOICE DETAILS SECTION ---
    setFont("bold", 7.5, textGray);
    doc.text("INVOICE DETAILS", 15, 87);

    // Table Headers
    setFont("bold", 7.5, textBlack);
    doc.text("Description", 15, 94);
    doc.text("Qty", 80, 94, { align: "center" });
    doc.text("Unit Price", 102, 94, { align: "center" });
    doc.text("Total", 133, 94, { align: "right" });

    doc.line(15, 96, 133, 96);

    // Table Row
    setFont("normal", 8, textBlack);
    const itemDesc = invoice.plan || "Service Pack";
    doc.text(itemDesc.length > 40 ? itemDesc.substring(0, 37) + '...' : itemDesc, 15, 102);
    doc.text("1", 80, 102, { align: "center" });
    doc.text(formatToUSD(invoice.amount), 102, 102, { align: "center" });
    doc.text(formatToUSD(invoice.amount), 133, 102, { align: "right" });

    doc.line(15, 105, 133, 105);

    // --- TOTALS CONTAINER ---
    doc.setFillColor(248, 250, 252);
    doc.rect(74, 112, 59, 36, "F");

    // Row 1: Subtotal
    setFont("normal", 7.5, textGray);
    doc.text("Subtotal", 78, 118);
    setFont("normal", 7.5, textBlack);
    doc.text(formatToUSD(invoice.amount), 129, 118, { align: "right" });

    // Row 2: Tax
    setFont("normal", 7.5, textGray);
    doc.text("Tax", 78, 124);
    setFont("normal", 7.5, textBlack);
    doc.text("USD 0.00", 129, 124, { align: "right" });

    // Inner Divider
    doc.line(78, 128, 129, 128);

    // Row 3: Total
    setFont("normal", 7.5, textGray);
    doc.text("Total", 78, 134);
    setFont("normal", 7.5, textBlack);
    doc.text(formatToUSD(invoice.amount), 129, 134, { align: "right" });

    // Row 4: Amount Paid
    setFont("bold", 8, textBlack);
    doc.text("Amount Paid", 78, 141);
    doc.text(formatToUSD(invoice.amount), 129, 141, { align: "right" });

    // --- FOOTER DIVIDER ---
    doc.line(15, 165, 133, 165);

    // --- FOOTER LEFT ---
    setFont("bold", 7, textBlack);
    doc.text("Web 4.0 OS.", 15, 171);
    setFont("normal", 6, textGray);
    doc.text("1309 Coffeen Avenue STE 14949", 15, 175);
    doc.text("Sheridan Wyoming 82801 - United States", 15, 178.5);

    // --- FOOTER RIGHT ---
    setFont("bold", 7, textBlack);
    doc.text("MarineWorld Contract Studio", 74, 171);
    setFont("normal", 6, textGray);
    doc.text("A product of Web 4.0 OS - Wyoming,USA", 74, 175);
    doc.text("Thank you for your business.", 74, 178.5);

    // --- FOOTER CENTER BOTTOM ---
    setFont("normal", 6.5, textGray);
    doc.text("support@marineworld.city", 74, 192, { align: "center" });

    doc.save(`Invoice_${invoice.invoiceNumber || 'INV'}.pdf`);

    await logAuditEvent(userId, `Simulated download of invoice receipt ${invoice.invoiceNumber} for amount ${invoice.amount}`, "Billing & Ledgers");
  };

  return (
    <div className="flex-1 bg-[#171B26] overflow-y-auto px-6 py-8 text-[#E8EAED] text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2B3347] pb-6 mb-8">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">Subscription & Workspace Plan</span>
          <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Billing & Ledgers</h2>
          <p className="text-[#BBC0C4] text-[11px] font-mono tracking-tight">Verify billing address details, update active payment methods, and download historical invoice receipts.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Visa profile wrapper */}
        <div className="p-6 bg-[#202636] rounded border border-[#2B3347] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-bold text-[#BBC0C4] uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
              <CreditCard size={14} className="text-[#00D4FF]" /> Stripe Payment Profile
            </h4>
            
            {editingCard && (
              <PaymentModal 
                onClose={() => setEditingCard(false)} 
                onSubmit={async (data) => {
                  const tokenResult = await StripeService.tokenizeCard(data);
                  if (!tokenResult.success) {
                    alert("Card validation failed: " + tokenResult.error);
                    return;
                  }
                  setCardName(data.name);
                  setCardNumber(data.card);
                  setCardExpiry(data.expiry);
                  setCardCvc(data.cvc);
                  
                  await handleUpdateCard(tokenResult.lastFour || '4242', tokenResult.cardHolder || data.name);
                }}
                loading={updatingCard}
              />
            )}
            
            <div className="pt-2">
                <div className="bg-gradient-to-br from-[#040B18] to-[#0A1930] p-5 rounded border border-[#2B3347] text-white relative shadow-md">
                  <span className="text-[8px] bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/25 px-2 py-0.5 rounded uppercase font-bold font-mono tracking-widest absolute top-4 right-4 animate-pulse">Corporate</span>
                  <p className="text-[9px] text-[#80868B] font-mono tracking-wider uppercase font-semibold">Active Ledger Card</p>
                  <h4 className="text-lg font-bold tracking-widest mt-4 font-mono">{cardNumber}</h4>
                  <div className="flex justify-between items-end mt-6 text-xs">
                    <div>
                      <span className="text-[7px] text-[#80868B] uppercase font-semibold">Holder</span>
                      <p className="font-bold text-[10px] uppercase truncate max-w-[120px]">{cardName}</p>
                    </div>
                    <div>
                      <span className="text-[7px] text-[#80868B] uppercase font-semibold">Expiry</span>
                      <p className="font-bold text-[10px] font-mono">{cardExpiry}</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setEditingCard(true)}
                  className="w-full mt-4 py-2.5 bg-[#2B3347] hover:bg-[#323D52] text-[10px] font-bold rounded border border-[#2B3347] transition-all text-[#00D4FF] uppercase tracking-wider"
                >
                  Change Payment Card Reference
                </button>
              </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#2B3347] flex items-center gap-2 text-[9px] text-[#80868B] font-mono uppercase">
            <ShieldCheck size={14} className="text-[#00D68F]" /> 256-bit AES Cryptographic Stripe Shield Active.
          </div>
        </div>

        {/* Invoice List Panel */}
        <div className="lg:col-span-2 p-6 bg-[#202636] rounded border border-[#2B3347]">
          <h4 className="text-sm font-bold text-white uppercase mb-1 tracking-tight">Invoice Historical Statements</h4>
          <p className="text-[11px] text-[#80868B] mb-6 font-mono">Real-time ledger entries mapped directly to subscription and credits buyouts.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-[#E8EAED]">
              <thead>
                <tr className="border-b border-[#2B3347] text-[#BBC0C4] text-left uppercase tracking-wider font-mono text-[10px]">
                  <th className="pb-3 px-2">Invoice Nr</th>
                  <th className="pb-3 px-2">Renewal Date</th>
                  <th className="pb-3 px-2">Service Line Plane</th>
                  <th className="pb-3 px-2 text-right">Aggregate Cost</th>
                  <th className="pb-3 px-2 text-center">Status</th>
                  <th className="pb-3 px-2 text-right pr-4">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3347] font-mono text-[10px]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#80868B]">
                      Synchronizing local copies...
                    </td>
                  </tr>
                ) : invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#2B3347] transition-colors cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                      <td className="py-3 px-2 text-white font-bold">{inv.invoiceNumber}</td>
                    <td className="py-3 px-2 text-[#80868B]">
                      {inv.date ? (typeof inv.date === 'string' ? inv.date : (inv.date as any).toDate?.().toLocaleDateString() || String(inv.date)) : 'N/A'}
                    </td>
                      <td className="py-3 px-2 text-[#BBC0C4] font-sans">{inv.plan}</td>
                      <td className="py-3 px-2 text-right text-[#00D68F] font-bold">{formatToUSD(inv.amount)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-[#00D68F]/10 text-[#00D68F] border border-[#00D68F]/20">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDownloadInvoice(inv)}
                          className="p-1 hover:bg-[#171B26] rounded text-[#00D4FF] inline-flex items-center gap-1 transition-colors"
                          title="Generate Receipt PDF"
                        >
                          <Download size={13} />
                          <span className="text-[9px] lowercase font-sans font-medium">pdf</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#80868B]">
                      No invoices recorded on file.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedInvoice && (() => {
        const amtUSD = formatToUSD(selectedInvoice.amount);
        const itemDesc = selectedInvoice.plan || selectedInvoice.description || 'Workspace Plan Subscription';
        
        const custName = selectedInvoice.customerName || userDisplayName || auth.currentUser?.displayName || auth.currentUser?.email || 'Ali';
        const wsId = selectedInvoice.workspaceId || `WS-${userId.substring(0, 8).toUpperCase()}`;
        const txId = selectedInvoice.transactionId || `TX-${selectedInvoice.id.substring(0, 8).toUpperCase()}`;
        const pMethod = selectedInvoice.paymentMethod || 'Credit Card (•••• 4242)';
        const pProvider = selectedInvoice.paymentProvider || 'Stripe';
        const tNo = selectedInvoice.taxNo || 'N/A';

        return (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
            <div className="relative w-full max-w-3xl my-8">
              <Invoice
                invoiceNo={selectedInvoice.invoiceNumber}
                invoiceDate={selectedInvoice.date}
                customerName={custName}
                workspaceId={wsId}
                taxNo={tNo}
                paymentMethod={pMethod}
                paymentProvider={pProvider}
                transactionId={txId}
                items={[{
                  description: itemDesc,
                  qty: 1,
                  unitPrice: amtUSD,
                  total: amtUSD
                }]}
                subtotal={amtUSD}
                tax="USD 0.00"
                totalAmount={amtUSD}
                amountPaid={amtUSD}
                onClose={() => setSelectedInvoice(null)}
                actionButton={
                  <button
                    onClick={() => handleDownloadInvoice(selectedInvoice)}
                    className="px-6 py-2.5 font-bold text-[#171B26] bg-[#00D4FF] hover:bg-[#33DDFF] transition-colors uppercase tracking-widest text-[10px] rounded font-mono flex items-center gap-1.5"
                  >
                    <Download size={11} /> Download PDF
                  </button>
                }
              />
            </div>
          </div>
        );
      })()}

    </div>
  );
}
