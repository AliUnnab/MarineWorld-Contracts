import React, { useState, useEffect } from 'react';
import { db, logAuditEvent } from '../../services/firebase-service';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  FileText, Copy, ArrowRight, CornerDownRight, Scale, 
  Layers, Lock, Sparkles, RefreshCw, Loader2 
} from 'lucide-react';
import { SaaSContract } from '../types/saas';

interface TemplateItem {
  id: string;
  title: string;
  category: string;
  agreementType: string;
  description: string;
  premium: boolean;
  value: string;
  version?: string;
  lastUpdated?: string;
}

interface TemplatesViewProps {
  userId: string;
  companyName: string;
  onDeployTemplate: (agreementType: string, contractId?: string) => void;
}

export default function TemplatesView({ userId, companyName, onDeployTemplate }: TemplatesViewProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Templates');

  useEffect(() => {
    // Listen to shared B2B templates collection
    const unsubscribe = onSnapshot(collection(db, 'templates'), (snap) => {
      if (snap.empty) {
        // Seed initial templates if collection is empty
        const initialTemplates = [
          { 
            title: "Yacht Sale Agreement", 
            category: "Commercial", 
            agreementType: "Sales", 
            description: "Comprehensive vessel transfer framework covering LOI, surveys, and ownership handover.", 
            premium: true, 
            value: "2,500,000",
            version: "2.1",
            lastUpdated: "22 Jun 2026"
          },
          { 
            title: "Shipyard Refit Agreement", 
            category: "Technical Services", 
            agreementType: "Technical", 
            description: "Structured shipyard maintenance contract with defined milestone gates and technical specs.", 
            premium: true, 
            value: "850,000",
            version: "3.4",
            lastUpdated: "15 Jun 2026"
          },
          { 
            title: "Marine Supply Agreement", 
            category: "Procurement", 
            agreementType: "Supply", 
            description: "Master supply framework for provisioning, technical parts, and fleet support services.", 
            premium: false, 
            value: "125,000",
            version: "1.8",
            lastUpdated: "03 Jun 2026"
          }
        ];
        initialTemplates.forEach(t => addDoc(collection(db, 'templates'), t));
      }
      
      const items: TemplateItem[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as TemplateItem);
      });
      // Sort so premium is at top or alphabetically
      items.sort((a,b) => (a.premium === b.premium) ? 0 : a.premium ? -1 : 1);
      setTemplates(items);
      setLoading(false);
    }, (err) => {
      console.error("Firestore read templates failed:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDuplicateTemplate = async (template: TemplateItem) => {
    setDeployingId(template.id);
    try {
      const targetTitle = `${companyName} - ${template.title} Draft`;
      
      const newContractRecord = {
        userId: userId,
        title: targetTitle,
        agreementType: template.agreementType,
        seller: "Sovereign Logistics Inc & Castings",
        buyer: companyName || "Global Dynamic Trading House Ltd",
        contractValue: template.value?.toString().replace(/,/g, '') || '0',
        currency: "USD",
        status: "Draft",
        version: "v1 Generated",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'contracts'), newContractRecord);
      
      try {
        await logAuditEvent(userId, `Deployed template blueprint: ${template.title}`, template.title);
      } catch (logErr) {
        console.error("Template deploy log failed:", logErr);
      }
      
      // Navigate straight into the editor with the new contract template
      onDeployTemplate(template.agreementType, docRef.id);
    } catch (err) {
      console.error("Failed to duplicate template to contracts store:", err);
    } finally {
      setDeployingId(null);
    }
  };

  const categories = [
    'All Templates', 
    'Commercial', 
    'Procurement', 
    'Maritime Operations', 
    'Technical Services', 
    'Consulting', 
    'Distribution', 
    'Agency & Brokerage'
  ];

  const filteredTemplates = templates.filter(t => selectedCategory === 'All Templates' || selectedCategory === 'ALL' || t.category === selectedCategory);

  return (
    <div className="flex-1 bg-[#171B26] overflow-y-auto px-6 py-8 text-[#E8EAED] text-left">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2B3347] pb-6 mb-8">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">B2B Covenant Blueprints</span>
          <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Master Templates Library</h2>
          <p className="text-[#BBC0C4] text-[11px] font-mono tracking-tight">Deploy production-ready framework agreements designed by elite maritime legal counsels.</p>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#202636] rounded border border-[#2B3347] mb-8 max-w-2xl overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded text-[10px] uppercase tracking-wider font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat 
                ? 'bg-[#00D4FF] text-[#171B26]' 
                : 'text-[#80868B] hover:text-white hover:bg-[#2B3347]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-[#00D4FF] mx-auto mb-4" size={32} />
          <p className="text-xs font-mono text-[#80868B]">Syncing Master Blueprints from Cloud database...</p>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((temp) => (
            <div 
              key={temp.id} 
              className="p-6 bg-[#202636] rounded border border-[#2B3347] hover:border-[#00D4FF]/30 transition-all flex flex-col justify-between relative overflow-hidden group"
            >
              {temp.premium && (
                <span className="absolute top-0 right-0 px-2.5 py-1 bg-[#00D4FF]/10 border-l border-b border-[#00D4FF]/20 text-[#00D4FF] text-[9px] font-mono uppercase font-bold tracking-wider rounded-bl">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00D4FF] mr-1 animate-pulse"></span> Premium
                </span>
              )}

              <div>
                <span className="text-[9px] font-bold font-mono text-[#00D4FF] bg-[#171B26] px-2 py-0.5 rounded uppercase border border-[#2B3347]">{temp.category}</span>
                <h4 className="text-base font-bold text-white mt-3 min-h-[44px] uppercase tracking-tight">{temp.title}</h4>
                <p className="text-[#BBC0C4] text-[11px] mt-2 leading-relaxed min-h-[60px] font-mono tracking-tight">{temp.description}</p>
                
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#2B3347]/50">
                  <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest">
                    <span className="text-[#80868B]">Version</span>
                    <span className="text-[#E8EAED]">{temp.version || '1.0'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest">
                    <span className="text-[#80868B]">Last Updated</span>
                    <span className="text-[#E8EAED]">{temp.lastUpdated || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#80868B] mt-4 uppercase tracking-tighter">
                  <Scale size={12} className="text-[#00D68F]" /> Standard Target: {temp.value} USD
                </div>
              </div>

              <div className="border-t border-[#2B3347] mt-6 pt-4 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                <span className="text-[9px] font-mono text-[#80868B] uppercase">{temp.agreementType}</span>
                <button
                  disabled={deployingId === temp.id}
                  onClick={() => handleDuplicateTemplate(temp)}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#00D4FF] hover:text-[#33DDFF] py-1 px-1.5 hover:bg-[#00D4FF]/5 rounded transition-all uppercase tracking-wider"
                >
                  {deployingId === temp.id ? (
                    <span className="flex items-center gap-1 justify-center">
                      <Loader2 size={12} className="animate-spin" /> Deploying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 justify-center">
                      Deploy Template <ArrowRight size={12} />
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-[#2B3347] rounded bg-[#202636]/50">
          <p className="text-sm text-[#80868B] uppercase font-mono tracking-widest">No template blueprints matched selection filters.</p>
        </div>
      )}
    </div>
  );
}
export {  };
