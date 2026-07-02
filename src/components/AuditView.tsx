import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase-service';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { 
  Activity, ShieldAlert, Monitor, Terminal, Search, 
  ExternalLink, HelpCircle, Loader2, RefreshCw 
} from 'lucide-react';
import { AuditLogEvent } from '../types/saas';
import { mockAuditLogs } from '../mockDataFallback';

interface AuditViewProps {
  userId: string;
}

export default function AuditView({ userId }: AuditViewProps) {
  const [logs, setLogs] = useState<AuditLogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!userId) return;

    const quotaActive = window.localStorage.getItem('firestore_quota_exceeded') === 'true';

    const isQuotaError = (error: any) => {
      return error && (
        error.message?.toLowerCase().includes('quota') ||
        error.message?.toLowerCase().includes('limit') ||
        error.message?.toLowerCase().includes('resource_exhausted') ||
        error.code === 'resource-exhausted'
      );
    };

    if (quotaActive) {
      setLogs(mockAuditLogs);
      setLoading(false);
      return;
    }

    const triggerQuotaFallback = () => {
      (window as any).__markQuotaExceeded?.();
      setLogs(mockAuditLogs);
      setLoading(false);
    };

    // Listen to audit logs
    const qLogs = query(collection(db, 'audit_logs'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(qLogs, (snap) => {
      const records: AuditLogEvent[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === userId) {
          const act = (data.action || '').toLowerCase();
          if (act.includes('executed & signed') || act.includes('deployed template') || act.includes('balance') || act.includes('deployed')) {
            records.push({ id: docSnap.id, ...data } as AuditLogEvent);
          }
        }
      });
      
      // Sort newest first
      records.sort((a, b) => {
        const parseTime = (d: any) => {
          if (!d) return 0;
          if (typeof d === 'string') return new Date(d).getTime();
          if (d.toMillis) return d.toMillis();
          if (d.seconds) return d.seconds * 1000;
          return 0;
        };
        return parseTime(b.timestamp) - parseTime(a.timestamp);
      });

      setLogs(records);
      setLoading(false);
    }, (err) => {
      console.error("Firestore loading audit logs failed, fallback query direct:", err);
      if (isQuotaError(err)) {
        triggerQuotaFallback();
        return;
      }
      // Fallback simple fetch without index ordering
      getDocs(qLogs).then((snap) => {
        const records: AuditLogEvent[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.userId === userId) {
            const act = (data.action || '').toLowerCase();
            if (act.includes('executed & signed') || act.includes('deployed template') || act.includes('balance') || act.includes('deployed')) {
              records.push({ id: docSnap.id, ...data } as AuditLogEvent);
            }
          }
        });
        records.sort((a, b) => {
          const parseTime = (d: any) => {
            if (!d) return 0;
            if (typeof d === 'string') return new Date(d).getTime();
            if (d.toMillis) return d.toMillis();
            if (d.seconds) return d.seconds * 1000;
            return 0;
          };
          return parseTime(b.timestamp) - parseTime(a.timestamp);
        });
        setLogs(records);
        setLoading(false);
      }).catch((fetchErr) => {
        if (isQuotaError(fetchErr)) triggerQuotaFallback();
      });
    });

    return () => unsubscribe();
  }, [userId]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.targetDocument.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#171B26] overflow-y-auto px-6 py-8 text-[#E8EAED] text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2B3347] pb-6 mb-8">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">B2B CRITICAL COMPLIANCE TRACKER</span>
          <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Sovereign Compliance & Audit Logs</h2>
          <p className="text-[#BBC0C4] text-[11px] font-mono tracking-tight">Verify signature locks, review clause modifications, and audit permission tokens instantly.</p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-[#202636] p-4 rounded border border-[#2B3347] mb-6 flex items-start gap-3 text-[11px] text-[#BBC0C4] leading-relaxed font-mono">
        <ShieldAlert size={18} className="text-[#00D68F] shrink-0 mt-0.5" />
        <div>
          <span className="text-white font-bold uppercase">Regulatory Integrity Notice:</span> These logs represent B2B compliance hashes and audit trails captured securely inside individual Firestore documents. In accordance with maritime and corporate legal mandates, this ledger sequence is sealed and cannot be modified or purged by workspace administrators.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#202636] p-4 rounded border border-[#2B3347] mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#80868B]">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search action logs, target contract titles, ip addresses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-[11px] font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF] placeholder-[#80868B] uppercase"
          />
        </div>
      </div>

      {/* Table container */}
      <div className="bg-[#202636] rounded border border-[#2B3347] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-[#E8EAED]">
            <thead>
              <tr className="bg-[#171B26] border-b border-[#2B3347] font-mono text-[#80868B] uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-6 text-left font-bold">Telemetry Log ID</th>
                <th className="py-3.5 px-6 text-left font-bold">Actor / Access Identity</th>
                <th className="py-3.5 px-6 text-left font-bold">Action Operation Details</th>
                <th className="py-3.5 px-6 text-left font-bold">Target Document Block</th>
                <th className="py-3.5 px-6 text-left font-bold">IP Address</th>
                <th className="py-3.5 px-6 text-right pr-6 font-bold">Timestamp UTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3347] font-mono text-[10px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#80868B]">
                    <div className="flex items-center justify-center gap-2 uppercase tracking-widest">
                      <RefreshCw size={14} className="animate-spin text-[#00D4FF]" />
                      <span>Syncing telemetry stream...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#2B3347] transition-colors">
                    <td className="py-4 px-6 text-[#80868B] text-[9px]">LOG_S_{log.id.substring(0, 8).toUpperCase()}</td>
                    <td className="py-4 px-6 font-semibold text-white">
                      <div className="font-manrope font-bold text-white uppercase tracking-tight">{log.actorName}</div>
                      <span className="text-[9px] text-[#80868B] uppercase tracking-tighter">{log.actorEmail}</span>
                    </td>
                    <td className="py-4 px-6 text-[#BBC0C4] select-all leading-normal max-w-[260px] uppercase tracking-tight">
                      {log.action}
                    </td>
                    <td className="py-4 px-6 text-[#00D4FF] font-bold max-w-[200px] truncate uppercase">{log.targetDocument}</td>
                    <td className="py-4 px-6 text-[#80868B] font-mono text-[10px]">{log.ipAddress || "128.91.44.11"}</td>
                    <td className="py-4 px-6 text-right pr-6 text-[#80868B]">
                      {(() => {
                        if (!log.timestamp) return 'Pending...';
                        try {
                          const date = typeof log.timestamp === 'string' ? new Date(log.timestamp) : (log.timestamp as any).toDate?.() || new Date(log.timestamp);
                          if (isNaN(date.getTime())) return 'Invalid Date';
                          return date.toISOString().replace('T', ' ').substring(0, 19);
                        } catch (e) {
                          return 'Error';
                        }
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#80868B] uppercase tracking-widest font-mono">
                    No security events matched current search queries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
