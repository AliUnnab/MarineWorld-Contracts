import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase-service';
import { Shield, FileCheck, XCircle, FileEdit, AlertCircle, Loader2, Copy } from 'lucide-react';
import { AgreementRegistryService } from '../../services/registry-service';

export default function ExecutionPortal() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [tokenData, setTokenData] = useState<any>(null);
  const [contractData, setContractData] = useState<any>(null);
  const [deploymentData, setDeploymentData] = useState<any>(null);
  const [recipientData, setRecipientData] = useState<any>(null);
  const [allRecipients, setAllRecipients] = useState<any[]>([]);

  const [declineReason, setDeclineReason] = useState('');
  const [revisionComment, setRevisionComment] = useState('');
  
  const [viewState, setViewState] = useState<'view' | 'decline' | 'revision'>('view');
  
  const token = window.location.pathname.split('/execute/')[1];

  useEffect(() => {
    if (!token) {
      setError("Invalid Execution Link");
      setLoading(false);
      return;
    }

    const fetchContext = async () => {
      try {
        const tokenRef = doc(db, 'execution_tokens', token);
        const tokenSnap = await getDoc(tokenRef);
        
        if (!tokenSnap.exists()) {
          setError("Execution link is invalid or has expired.");
          return;
        }

        const tData = tokenSnap.data();
        setTokenData(tData);

        const { contractId, deploymentId, recipientId } = tData;

        // Fetch Contract
        const contractRef = doc(db, 'contracts', contractId);
        const contractSnap = await getDoc(contractRef);
        if (!contractSnap.exists()) {
          setError("Agreement not found.");
          return;
        }
        setContractData({ id: contractSnap.id, ...contractSnap.data() });

        // Fetch Deployment
        const deploymentRef = doc(db, `contracts/${contractId}/deployments/${deploymentId}`);
        const deploymentSnap = await getDoc(deploymentRef);
        if (!deploymentSnap.exists()) {
          setError("Deployment record not found.");
          return;
        }
        setDeploymentData({ id: deploymentSnap.id, ...deploymentSnap.data() });

        // Fetch All Recipients
        const recipientsRef = collection(db, `contracts/${contractId}/deployments/${deploymentId}/recipients`);
        const recipientsSnap = await getDocs(recipientsRef);
        const recipients = recipientsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        setAllRecipients(recipients);

        const me = recipients.find(r => r.id === recipientId);
        if (!me) {
          setError("Recipient record not found.");
          return;
        }
        setRecipientData(me);

        // Record Audit: Viewed
        if (me.status === 'PENDING' || me.status === 'VIEWED' || !me.status) {
          const rRef = doc(db, `contracts/${contractId}/deployments/${deploymentId}/recipients/${recipientId}`);
          await updateDoc(rRef, {
            status: 'UNDER_REVIEW',
            reviewTimestamp: new Date().toISOString()
          });
          me.status = 'UNDER_REVIEW';
          setRecipientData({ ...me, status: 'UNDER_REVIEW' });
        }

      } catch (err: any) {
        console.error("Execution Portal Error:", err);
        setError("An error occurred while loading the agreement. " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [token]);

  const handleAccept = async () => {
    try {
      setLoading(true);
      const { contractId, deploymentId, recipientId } = tokenData;
      const recipientRef = doc(db, `contracts/${contractId}/deployments/${deploymentId}/recipients/${recipientId}`);
      
      await updateDoc(recipientRef, {
        status: 'ACCEPTED',
        executionTimestamp: new Date().toISOString()
      });

      // Check if all are accepted
      const updatedRecipients = allRecipients.map(r => r.id === recipientId ? { ...r, status: 'ACCEPTED' } : r);
      const allAccepted = updatedRecipients.every(r => r.status === 'ACCEPTED' || r.role.includes('Advisor'));
      
      if (allAccepted) {
        // Finalize contract
        const contractRef = doc(db, 'contracts', contractId);
        await updateDoc(contractRef, {
          status: 'executed',
          updatedAt: new Date().toISOString()
        });
      }
      
      setRecipientData(prev => ({ ...prev, status: 'ACCEPTED' }));
      setViewState('view');
    } catch (err) {
      console.error(err);
      alert("Failed to accept agreement.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason) return alert("Please provide a reason.");
    try {
      setLoading(true);
      const { contractId, deploymentId, recipientId } = tokenData;
      const recipientRef = doc(db, `contracts/${contractId}/deployments/${deploymentId}/recipients/${recipientId}`);
      
      await updateDoc(recipientRef, {
        status: 'DECLINED',
        declineReason,
        reviewTimestamp: new Date().toISOString()
      });
      
      setRecipientData(prev => ({ ...prev, status: 'DECLINED' }));
      setViewState('view');
    } catch (err) {
      console.error(err);
      alert("Failed to decline.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevision = async () => {
    if (!revisionComment) return alert("Please provide revision notes.");
    try {
      setLoading(true);
      const { contractId, deploymentId, recipientId } = tokenData;
      const recipientRef = doc(db, `contracts/${contractId}/deployments/${deploymentId}/recipients/${recipientId}`);
      
      await updateDoc(recipientRef, {
        status: 'REVISION REQUESTED',
        declineReason: revisionComment,
        reviewTimestamp: new Date().toISOString()
      });

      // Add revision to contract
      const contractRef = doc(db, 'contracts', contractId);
      const currentRevisions = contractData.revisions || [];
      await updateDoc(contractRef, {
        revisions: [...currentRevisions, {
          id: `REV-${Date.now()}`,
          date: new Date().toISOString(),
          author: recipientData.name,
          comment: revisionComment,
          status: 'pending'
        }]
      });
      
      setRecipientData(prev => ({ ...prev, status: 'REVISION REQUESTED' }));
      setViewState('view');
    } catch (err) {
      console.error(err);
      alert("Failed to request revision.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071326] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#00D4FF] mb-4" size={48} />
        <h2 className="text-xl font-bold font-manrope">Loading Secure Execution Environment...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#071326] flex flex-col items-center justify-center text-white p-6">
        <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-2xl max-w-lg text-center">
          <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  const isCompleted = recipientData?.status === 'ACCEPTED' || recipientData?.status === 'DECLINED' || recipientData?.status === 'REVISION REQUESTED';

  return (
    <div className="min-h-screen bg-[#071326] text-slate-300 font-sans flex flex-col">
      <div className="h-16 bg-[#040B18] border-b border-white/10 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="text-[#00D4FF]" size={24} />
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider font-manrope">MarineWorld Contract Execution Portal</h1>
            <p className="text-xs text-slate-500">Secure One-Time Access Link</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-white font-bold">{recipientData.name}</div>
            <div className="text-[10px] text-slate-400">{recipientData.email}</div>
          </div>
          <div className="px-3 py-1 rounded bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 text-xs font-bold uppercase tracking-wider">
            {recipientData.role}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document Viewer */}
        <div className="flex-[2] bg-white text-black overflow-y-auto p-12 relative shadow-inner">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center mb-12 border-b-2 border-black pb-8">
              <h1 className="text-4xl font-serif font-bold mb-4">{contractData.title}</h1>
              <div className="text-sm font-mono text-gray-500 space-y-1">
                <p>AGREEMENT REF: {contractData.id}</p>
                <p>DEPLOYMENT REF: {deploymentData.id}</p>
                <p>CURRENT REVISION: {deploymentData.currentRevision}</p>
                <p>FINGERPRINT: {deploymentData.currentHash}</p>
              </div>
            </div>

            {contractData.clauses?.map((c: any, i: number) => (
              <div key={i} className="mb-8">
                <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{c.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions Panel */}
        <div className="flex-1 bg-[#171B26] border-l border-white/10 flex flex-col">
          <div className="p-8 flex-1 overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider font-manrope">Execution Actions</h2>
            
            {isCompleted ? (
              <div className="bg-[#0a1c34] border border-[#00D4FF]/30 rounded-xl p-6 text-center">
                <FileCheck className="text-[#00D4FF] mx-auto mb-4" size={48} />
                <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">Action Recorded</h3>
                <p className="text-sm text-slate-300">You have already responded to this agreement.</p>
                <div className="mt-4 inline-block px-4 py-2 bg-black/40 rounded-lg text-sm font-bold text-white">
                  STATUS: <span className={
                    recipientData.status === 'ACCEPTED' ? 'text-emerald-400' :
                    recipientData.status === 'DECLINED' ? 'text-rose-400' : 'text-amber-400'
                  }>{recipientData.status}</span>
                </div>
              </div>
            ) : viewState === 'view' ? (
              <div className="space-y-4">
                <button 
                  onClick={handleAccept}
                  className="w-full py-4 bg-[#10B981] hover:bg-[#10B981]/90 text-black font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20"
                >
                  <FileCheck size={20} /> Review & Accept
                </button>
                
                <button 
                  onClick={() => setViewState('revision')}
                  className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <FileEdit size={20} /> Request Revision
                </button>
                
                <button 
                  onClick={() => setViewState('decline')}
                  className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={20} /> Decline Agreement
                </button>
              </div>
            ) : viewState === 'revision' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="mb-4">
                  <h3 className="text-white font-bold mb-2 uppercase tracking-wider font-manrope text-sm">Request Revision</h3>
                  <p className="text-xs text-slate-400 mb-4">Specify the clauses or terms you want revised. This will notify the sender and create a new editable revision draft.</p>
                  <textarea 
                    value={revisionComment}
                    onChange={e => setRevisionComment(e.target.value)}
                    placeholder="E.g., Please update the Payment Terms in Clause 5..."
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white focus:border-amber-500/50 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setViewState('view')} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg">Cancel</button>
                  <button onClick={handleRevision} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg">Submit Request</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="mb-4">
                  <h3 className="text-white font-bold mb-2 uppercase tracking-wider font-manrope text-sm">Decline Agreement</h3>
                  <p className="text-xs text-slate-400 mb-4">Please provide a reason for declining. The sender will be notified.</p>
                  <textarea 
                    value={declineReason}
                    onChange={e => setDeclineReason(e.target.value)}
                    placeholder="Reason for declining..."
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white focus:border-rose-500/50 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setViewState('view')} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg">Cancel</button>
                  <button onClick={handleDecline} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg">Confirm Decline</button>
                </div>
              </div>
            )}
            
            {/* Agreement Summary Box */}
            <div className="mt-8 bg-black/40 border border-white/5 rounded-xl p-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Agreement Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-slate-400">Type</span>
                  <span className="text-xs text-white font-medium">{contractData.agreementType}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-slate-400">Value</span>
                  <span className="text-xs text-white font-medium">{contractData.currency} {contractData.contractValue}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-xs text-slate-400">Governing Law</span>
                  <span className="text-xs text-white font-medium">{contractData.applicableLaw}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
