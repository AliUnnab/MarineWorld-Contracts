import React, { useState } from 'react';
import { db } from '../../services/firebase-service';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { X, Save, Copy, FileText, Trash2, Archive, Activity, RefreshCw } from 'lucide-react';

interface TemplateItem {
  id: string;
  title: string;
  category: string;
  agreementType: string;
  industry?: string;
  description: string;
  premium: boolean;
  version: string;
  standardForm?: string;
  complianceFramework?: string;
  governingLaw?: string;
  jurisdiction?: string;
  standardCommercialTarget?: string;
  templateStatus: string;
  lastUpdated: string;
  createdBy?: string;
  publishedBy?: string;
  tags?: string[];
  language?: string;
  templateSections?: string[];
  defaultClauses?: any[];
  defaultCommercialFoundation?: any;
  activeVersion?: string;
}

interface TemplateManagerProps {
  templates: TemplateItem[];
  onClose: () => void;
}

export default function TemplateManager({ templates, onClose }: TemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [formData, setFormData] = useState<Partial<TemplateItem>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleSelect = (t: TemplateItem) => {
    setSelectedTemplate(t);
    setFormData(t);
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    const newT: Partial<TemplateItem> = {
      title: 'New Template',
      category: 'Commercial',
      agreementType: 'Services',
      description: '',
      premium: false,
      version: '1.0',
      templateStatus: 'Draft',
      lastUpdated: new Date().toISOString(),
      standardCommercialTarget: '0 USD',
      language: 'English',
      industry: 'General'
    };
    setSelectedTemplate({ id: 'new', ...newT } as TemplateItem);
    setFormData(newT);
    setIsEditing(true);
  };

  const handleChange = (field: keyof TemplateItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title) return;
    try {
      const payload = {
        ...formData,
        lastUpdated: new Date().toISOString()
      };

      if (selectedTemplate?.id === 'new') {
        await addDoc(collection(db, 'master_templates'), payload);
      } else if (selectedTemplate?.id) {
        await updateDoc(doc(db, 'master_templates', selectedTemplate.id), payload);
      }
      setIsEditing(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedTemplate || selectedTemplate.id === 'new') return;
    try {
      const { id, ...rest } = selectedTemplate;
      const newPayload = {
        ...rest,
        title: `${rest.title} (Copy)`,
        templateStatus: 'Draft',
        lastUpdated: new Date().toISOString()
      };
      await addDoc(collection(db, 'master_templates'), newPayload);
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate || selectedTemplate.id === 'new') return;
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteDoc(doc(db, 'master_templates', selectedTemplate.id));
        setIsEditing(false);
        setSelectedTemplate(null);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedTemplate || selectedTemplate.id === 'new') return;
    try {
      await updateDoc(doc(db, 'master_templates', selectedTemplate.id), { templateStatus: status, lastUpdated: new Date().toISOString() });
      setFormData(prev => ({ ...prev, templateStatus: status }));
      setSelectedTemplate(prev => prev ? { ...prev, templateStatus: status } : null);
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };
  
  const handleVersionIncrement = async () => {
    if (!selectedTemplate || selectedTemplate.id === 'new') return;
    try {
      const v = parseFloat(selectedTemplate.version || '1.0');
      const nextV = (v + 0.1).toFixed(1);
      await updateDoc(doc(db, 'master_templates', selectedTemplate.id), { version: nextV, lastUpdated: new Date().toISOString() });
      setFormData(prev => ({ ...prev, version: nextV }));
      setSelectedTemplate(prev => prev ? { ...prev, version: nextV } : null);
    } catch (err) {
      console.error('Version update failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex bg-[#041326]/95 backdrop-blur-xl p-6 md:p-12 animate-in fade-in duration-300">
      <div className="flex flex-col w-full h-full bg-[#0b1221] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00D4FF] to-blue-500"></div>
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2"><FileText size={20} className="text-[#00D4FF]" /> Master Template Management</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Enterprise Configuration & Lifecycle</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5">
              <button onClick={handleCreateNew} className="w-full py-3 bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#00D4FF]/20 transition-all">
                + Create New Template
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTemplate?.id === t.id ? 'bg-white/5 border-[#00D4FF]/50 text-white' : 'border-transparent hover:bg-white/5 text-slate-300'}`}
                >
                  <div className="text-xs font-bold uppercase tracking-wide truncate">{t.title}</div>
                  <div className="flex justify-between mt-2 text-[9px] font-mono uppercase text-slate-500">
                    <span>{t.agreementType}</span>
                    <span>v{t.version}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-[#080d17] p-8 custom-scrollbar">
            {isEditing && selectedTemplate ? (
              <div className="max-w-3xl w-full mx-auto space-y-8 pb-12">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest">{selectedTemplate.id === 'new' ? 'New Template' : 'Edit Template'}</h3>
                  
                  {selectedTemplate.id !== 'new' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus('Active')} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] uppercase tracking-wider font-bold hover:bg-emerald-500/20 flex items-center gap-1"><Activity size={12} /> Publish</button>
                      <button onClick={() => updateStatus('Archived')} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[9px] uppercase tracking-wider font-bold hover:bg-amber-500/20 flex items-center gap-1"><Archive size={12} /> Archive</button>
                      <button onClick={() => updateStatus('Inactive')} className="px-3 py-1.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-lg text-[9px] uppercase tracking-wider font-bold hover:bg-slate-500/20 flex items-center gap-1"><X size={12} /> Deactivate</button>
                    </div>
                  )}
                </div>

                {selectedTemplate.id !== 'new' && (
                  <div className="flex gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                    <button onClick={handleDuplicate} className="flex-1 py-2 text-[10px] uppercase font-bold text-[#00D4FF] hover:bg-white/5 rounded-lg flex items-center justify-center gap-2"><Copy size={12} /> Duplicate</button>
                    <button onClick={handleVersionIncrement} className="flex-1 py-2 text-[10px] uppercase font-bold text-[#00D4FF] hover:bg-white/5 rounded-lg flex items-center justify-center gap-2"><RefreshCw size={12} /> New Version</button>
                    <button onClick={handleDelete} className="flex-1 py-2 text-[10px] uppercase font-bold text-red-400 hover:bg-white/5 rounded-lg flex items-center justify-center gap-2"><Trash2 size={12} /> Delete</button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Template Title</label>
                    <input type="text" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} className="w-full bg-[#041326]/50 border border-white/10 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00D4FF]/50" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                    <textarea value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} className="w-full h-24 bg-[#041326]/50 border border-white/10 px-4 py-3 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00D4FF]/50" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Agreement Category</label>
                    <input type="text" value={formData.category || ''} onChange={e => handleChange('category', e.target.value)} className="w-full bg-[#041326]/50 border border-white/10 px-3 py-2 rounded-xl text-xs text-white" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Agreement Type</label>
                    <input type="text" value={formData.agreementType || ''} onChange={e => handleChange('agreementType', e.target.value)} className="w-full bg-[#041326]/50 border border-white/10 px-3 py-2 rounded-xl text-xs text-white" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Industry</label>
                    <input type="text" value={formData.industry || ''} onChange={e => handleChange('industry', e.target.value)} className="w-full bg-[#041326]/50 border border-white/10 px-3 py-2 rounded-xl text-xs text-white" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Standard Form</label>
                    <input type="text" value={formData.standardForm || ''} onChange={e => handleChange('standardForm', e.target.value)} className="w-full bg-[#041326]/50 border border-white/10 px-3 py-2 rounded-xl text-xs text-white" />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Compliance Framework</label>
                    <input type="text" value={formData.complianceFramework || ''} onChange={e => handleChange('complianceFramework', e.target.value)} className="w-full bg-[#041326]/50 border border-white/10 px-3 py-2 rounded-xl text-xs text-white" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Standard Commercial Target</label>
                    <input type="text" value={formData.standardCommercialTarget || ''} onChange={e => handleChange('standardCommercialTarget', e.target.value)} className="w-full bg-[#041326]/50 border border-white/10 px-3 py-2 rounded-xl text-xs text-white" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Premium Status</label>
                    <select value={formData.premium ? 'true' : 'false'} onChange={e => handleChange('premium', e.target.value === 'true')} className="w-full bg-[#041326]/50 border border-white/10 px-3 py-2 rounded-xl text-xs text-white">
                      <option value="false">Standard</option>
                      <option value="true">Premium</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                    <select disabled value={formData.templateStatus || 'Draft'} className="w-full bg-[#041326]/50 border border-white/10 px-3 py-2 rounded-xl text-xs text-slate-400 opacity-70">
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button onClick={handleSave} className="px-8 py-3 bg-[#00D4FF] text-[#041326] font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#33DDFF] transition-all flex items-center gap-2">
                    <Save size={14} /> Save Template Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Select a template to manage or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
