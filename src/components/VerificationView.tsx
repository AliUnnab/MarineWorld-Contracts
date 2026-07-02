import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, FileText, CheckCircle2, XCircle, AlertTriangle, Shield, Check, FileCode2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase-service';
import { AgreementRegistryService } from '../../services/registry-service';

export const VerificationView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify/') && path.length > 8) {
      let code = path.substring(8);
      if (code.startsWith('VERIFY-')) {
        code = code.substring(7);
      }
      setSearchQuery(code);
      if (code.length > 3) {
         setTimeout(() => handleVerify(undefined, code), 500);
      }
    }
  }, []);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'idle' | 'success' | 'failed' | 'not_found';
    message?: string;
    registryHash?: string;
    computedHash?: string;
    contractData?: any;
  }>({ status: 'idle' });

  const handleVerify = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const qry = overrideQuery || searchQuery;
    if (!qry.trim()) return;

    setIsVerifying(true);
    setVerificationResult({ status: 'idle' });

    try {
      let contractDoc = null;
      let q;

      // Try searching by Verification Hash (documentHash) or ID
      if (qry.startsWith('0x')) {
        q = query(collection(db, 'contracts'), where('documentHash', '==', qry));
      } else {
        q = query(collection(db, 'contracts'), where('contractFields.verificationCode', '==', qry));
      }

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Fallback: search by document ID
        try {
          const idQuery = query(collection(db, 'contracts'), where('__name__', '==', qry));
          const idSnap = await getDocs(idQuery);
          if (!idSnap.empty) {
             contractDoc = idSnap.docs[0];
          }
        } catch(e) {}
      } else {
        contractDoc = querySnapshot.docs[0];
      }

      if (!contractDoc) {
        setVerificationResult({ status: 'not_found', message: 'No record found in the immutable registry.' });
        setIsVerifying(false);
        return;
      }

      const data = contractDoc.data();

      // Ensure this is an executed contract
      if (data.status !== 'executed') {
         setVerificationResult({ status: 'failed', message: 'Contract is not fully executed or deployed.' });
         setIsVerifying(false);
         return;
      }

      const dataForHash = {
        title: data.foundation?.title,
        agreementType: data.foundation?.type || 'Service Agreement',
        seller: data.partyA?.name,
        buyer: data.partyB?.name,
        contractValue: data.foundation?.value,
        currency: data.foundation?.currency || 'USD',
        applicableLaw: data.jurisdiction?.law,
        jurisdictionSeat: data.jurisdiction?.seat,
        foundation: data.foundation,
        jurisdiction: data.jurisdiction,
        partyA: data.partyA,
        partyB: data.partyB,
        contractFields: data.contractFields,
        participants: data.participants,
        clauses: data.clauses,
        revisions: data.revisions,
        identityDocs: data.identityDocs,
        additionalParties: data.additionalParties,
      };

      // Real-time computation
      const computedHash = await AgreementRegistryService.generateFingerprint(dataForHash);
      const registryHash = data.documentHash;

      if (computedHash === registryHash) {
        setVerificationResult({
          status: 'success',
          computedHash,
          registryHash,
          contractData: data
        });
      } else {
        setVerificationResult({
          status: 'failed',
          message: 'Integrity Check Failed: The registry hash does not match the canonical data model.',
          computedHash,
          registryHash
        });
      }

    } catch (error: any) {
      console.error(error);
      setVerificationResult({ status: 'failed', message: error.message });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#020813] min-h-full">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <ShieldCheck size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-widest font-sans mb-3">Immutable Registry Verification</h1>
          <p className="text-slate-400 text-sm font-manrope leading-relaxed max-w-lg mx-auto">
            Verify the mathematical integrity of any MarineWorld contract. Enter the Verification ID or SHA-256 Fingerprint to re-compute and audit the canonical data model against the ledger.
          </p>
        </div>

        <form onSubmit={handleVerify} className="relative mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Verification Hash (0x...) or ID"
            className="w-full bg-[#0a1c34]/40 border-2 border-white/10 focus:border-emerald-500/50 rounded-xl py-4 pl-12 pr-32 text-white placeholder:text-slate-500 outline-none transition-all font-mono text-sm"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <button 
            type="submit"
            disabled={!searchQuery.trim() || isVerifying}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isVerifying ? <span className="animate-pulse">Auditing...</span> : 'Verify'}
          </button>
        </form>

        {verificationResult.status === 'not_found' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <XCircle size={32} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-red-400 font-bold uppercase tracking-wider mb-1">Record Not Found</h3>
            <p className="text-slate-400 text-xs font-mono">{verificationResult.message}</p>
          </div>
        )}

        {verificationResult.status === 'failed' && verificationResult.message && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
            <h3 className="text-amber-400 font-bold uppercase tracking-wider mb-1">Integrity Violation</h3>
            <p className="text-slate-400 text-xs font-mono">{verificationResult.message}</p>
          </div>
        )}

        {verificationResult.status === 'success' && verificationResult.contractData && (
          <div className="bg-[#0a1c34]/40 border border-emerald-500/30 rounded-xl p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-[#041326] rounded-lg p-8">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                    <Check size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Integrity Verified</h3>
                    <p className="text-slate-400 text-xs font-mono mt-1">Mathematical Hash Match Confirmed</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Execution Date</div>
                  <div className="text-slate-300 font-mono text-xs">
                    {new Date(verificationResult.contractData.updatedAt).toISOString().replace('T', ' ').substring(0, 19)} UTC
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1.5">Agreement Type</div>
                  <div className="text-white text-sm font-medium">{verificationResult.contractData.title}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1.5">Primary Parties</div>
                  <div className="text-slate-300 text-sm font-medium">{verificationResult.contractData.partyA?.name} & {verificationResult.contractData.partyB?.name}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#020813] border border-white/5 rounded-lg p-4">
                  <div className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                    <Shield size={12} /> Registry Hash (Stored)
                  </div>
                  <div className="text-emerald-400 font-mono text-[11px] break-all">
                    {verificationResult.registryHash}
                  </div>
                </div>
                
                <div className="bg-[#020813] border border-white/5 rounded-lg p-4">
                  <div className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                    <FileCode2 size={12} /> Computed Hash (Live from Canonical JSON)
                  </div>
                  <div className="text-emerald-400 font-mono text-[11px] break-all">
                    {verificationResult.computedHash}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
