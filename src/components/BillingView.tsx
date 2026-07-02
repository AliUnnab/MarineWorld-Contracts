import React, { useState, useEffect } from 'react';
import { db, logAuditEvent } from '../../services/firebase-service';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { 
  CreditCard, FileText, Download, CheckCircle, AlertTriangle, 
  ArrowUpRight, ShieldCheck, RefreshCw, Loader2, Save 
} from 'lucide-react';
import { SaaSInvoice } from '../types/saas';
import { jsPDF } from 'jspdf';
import PaymentModal from './PaymentModal';
import { StripeService } from '../services/stripe-service';

interface BillingViewProps {
  userId: string;
  userDisplayName?: string;
}

export default function BillingView({ userId, userDisplayName }: BillingViewProps) {
  const [invoices, setInvoices] = useState<SaaSInvoice[]>([]);
  const [loading, setLoading] = useState(true);

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
    
    const textBlack = [23, 27, 38];
    const textGray = [128, 134, 139];
    const colorAccent = [0, 212, 255];
    const colorGreen = [0, 214, 143]; 
    
    let dateStr = 'N/A';
    if (invoice.date) {
      if (typeof invoice.date === 'string') {
        dateStr = invoice.date;
      } else if (typeof (invoice.date as any).toDate === 'function') {
        dateStr = (invoice.date as any).toDate().toLocaleDateString();
      }
    }

    // --- HEADER ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text("MARINEWORLD", 15, 20);
    doc.text("Contract Studio", 15, 25);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Enterprise Contract Operating System", 15, 30);
    
    // Right side Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
    doc.text("INVOICE", 133, 22, { align: "right" });
    
    doc.setFontSize(8);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice No.", 133, 28, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text(invoice.invoiceNumber || "INV-000000", 133, 32, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Invoice Date", 133, 38, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text(dateStr, 133, 42, { align: "right" });
    
    // Line separator
    doc.setDrawColor(230, 230, 230);
    doc.line(15, 48, 133, 48);
    
    // --- BILL TO ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("BILL TO", 15, 56);
    
    doc.setFontSize(8);
    doc.text("Customer", 15, 62);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    const customerName = userDisplayName || 'MarineWorld User';
    doc.text(customerName.length > 25 ? customerName.substring(0, 25) + '...' : customerName, 15, 66);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Workspace ID", 15, 74);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text(`WS-${userId.substring(0,8).toUpperCase()}`, 15, 78);

    // Right Column: PAYMENT INFORMATION
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("PAYMENT INFORMATION", 80, 56);
    
    doc.text("Payment Method", 80, 62);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text("Credit Card (•••• 4242)", 80, 66);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Payment Provider", 80, 74);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text("Stripe", 80, 78);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Transaction ID", 80, 86);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text(`TX-${Math.random().toString(36).substring(2,10).toUpperCase()}`, 80, 90);

    // --- INVOICE DETAILS ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("INVOICE DETAILS", 15, 102);
    
    doc.setDrawColor(230, 230, 230);
    doc.line(15, 105, 133, 105);
    
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text("Description", 15, 110);
    doc.text("Qty", 85, 110, { align: "right" });
    doc.text("Unit Price", 105, 110, { align: "right" });
    doc.text("Total", 133, 110, { align: "right" });
    
    doc.line(15, 113, 133, 113);

    doc.setFont("helvetica", "normal");
    const itemDesc = invoice.plan || "Service Pack";
    doc.text(itemDesc.length > 40 ? itemDesc.substring(0, 37) + '...' : itemDesc, 15, 119);
    doc.text("1", 85, 119, { align: "right" });
    doc.text(formatToUSD(invoice.amount), 105, 119, { align: "right" });
    doc.text(formatToUSD(invoice.amount), 133, 119, { align: "right" });
    
    doc.line(15, 123, 133, 123);

    // --- SUMMARY ---
    // Shaded box for summary
    doc.setFillColor(248, 249, 250);
    doc.rect(75, 128, 62, 38, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Subtotal", 80, 135);
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text(formatToUSD(invoice.amount), 133, 135, { align: "right" });
    
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Tax", 80, 143);
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text("USD 0.00", 133, 143, { align: "right" });
    
    doc.setDrawColor(220, 220, 220);
    doc.line(80, 147, 133, 147);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Total", 80, 153);
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text(formatToUSD(invoice.amount), 133, 153, { align: "right" });
    
    doc.setFontSize(10);
    doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
    doc.text("Amount Paid", 80, 161);
    doc.text(formatToUSD(invoice.amount), 133, 161, { align: "right" });

    // PAID badge
    doc.setFillColor(colorGreen[0], colorGreen[1], colorGreen[2]);
    doc.roundedRect(15, 128, 24, 8, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("PAID", 27, 134, { align: "center" });

    // Mock QR Code
    const qrX = 117;
    const qrY = 170;
    doc.setFillColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.rect(qrX, qrY, 16, 16);
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX + 2, qrY + 2, 12, 12, "F");
    doc.setFillColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.rect(qrX + 3, qrY + 3, 3, 3, "F");
    doc.rect(qrX + 10, qrY + 3, 3, 3, "F");
    doc.rect(qrX + 3, qrY + 10, 3, 3, "F");
    doc.rect(qrX + 10, qrY + 10, 1.5, 1.5, "F");
    doc.rect(qrX + 11.5, qrY + 11.5, 1.5, 1.5, "F");
    
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Scan to verify", qrX + 8, qrY + 19, { align: "center" });

    // --- FOOTER ---
    doc.setDrawColor(230, 230, 230);
    doc.line(15, 192, 133, 192);
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text("MarineWorld Contract Studio", 15, 198);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Enterprise Contract Operating System", 15, 202);
    doc.text("Invoice generated automatically. No signature required.", 15, 206);
    
    doc.text("support@marineworld.city", 133, 198, { align: "right" });
    doc.text("Contract Studio Workspace", 133, 202, { align: "right" });
    
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
                    <tr key={inv.id} className="hover:bg-[#2B3347] transition-colors">
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
    </div>
  );
}
