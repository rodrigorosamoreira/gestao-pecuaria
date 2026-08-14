import React, { useState, useEffect } from 'react';
import { 
  Handshake, 
  ExternalLink, 
  Edit3, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Instagram, 
  X, 
  Check, 
  Store, 
  Tractor, 
  Beef, 
  Scale, 
  HeartPulse, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Settings,
  Plus,
  RefreshCw,
  Tag,
  ArrowRight,
  MessageCircle,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { PartnerSlot, User } from '../types';
import { 
  getStoredPartnerSlots, 
  savePartnerSlots, 
  resetPartnerSlotsToDefault 
} from '../services/partnersData';

interface PartnersBannerProps {
  compact?: boolean;
  currentUser?: User | null;
}

// Emails autorizados por padrão como Administradores Master da plataforma
const MASTER_ADMIN_EMAILS = [
  'rodrigorosamoreira@gmail.com',
  'admin@gestaopeccuaria.com',
  'vivendoapecuaria@gmail.com'
];

// Senha mestra / PIN de liberação administrativa
const MASTER_ADMIN_PIN = 'pecuaria2025';
const ADMIN_SESSION_KEY = 'gestao_pecuaria_admin_unlocked';

const PartnersBanner: React.FC<PartnersBannerProps> = ({ compact = false, currentUser }) => {
  const [partnerSlots, setPartnerSlots] = useState<PartnerSlot[]>(getStoredPartnerSlots());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedSlotForContact, setSelectedSlotForContact] = useState<PartnerSlot | null>(null);

  // Admin state check
  const [sessionAdminUnlocked, setSessionAdminUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const isEmailAdmin = Boolean(
    currentUser?.email && (
      MASTER_ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim()) ||
      currentUser.email.toLowerCase().includes('admin') ||
      currentUser.role === 'admin'
    )
  );

  const isAdmin = isEmailAdmin || sessionAdminUnlocked;
  
  // State for the editor
  const [activeEditSlotIndex, setActiveEditSlotIndex] = useState<number>(0);
  const [editingSlots, setEditingSlots] = useState<PartnerSlot[]>(getStoredPartnerSlots());
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const openEditor = (slotIndex: number = 0) => {
    if (!isAdmin) {
      setIsPinModalOpen(true);
      return;
    }
    setEditingSlots(JSON.parse(JSON.stringify(partnerSlots)));
    setActiveEditSlotIndex(slotIndex);
    setIsEditModalOpen(true);
    setSaveSuccessNotice(false);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin.trim() === MASTER_ADMIN_PIN) {
      setSessionAdminUnlocked(true);
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } catch {}
      setIsPinModalOpen(false);
      setInputPin('');
      setPinError('');
      // Open editor directly
      setEditingSlots(JSON.parse(JSON.stringify(partnerSlots)));
      setIsEditModalOpen(true);
    } else {
      setPinError('PIN administrativo incorreto. Acesso restrito ao administrador.');
    }
  };

  const handleLockAdmin = () => {
    setSessionAdminUnlocked(false);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
    setIsEditModalOpen(false);
  };

  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setPartnerSlots(editingSlots);
    savePartnerSlots(editingSlots);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
      setIsEditModalOpen(false);
    }, 900);
  };

  const handleReset = () => {
    if (!isAdmin) return;
    if (window.confirm('Deseja restaurar os 3 espaços de parceiros para as configurações padrão?')) {
      const defaults = resetPartnerSlotsToDefault();
      setPartnerSlots(defaults);
      setEditingSlots(defaults);
      setIsEditModalOpen(false);
    }
  };

  const handleOpenContact = (slot?: PartnerSlot) => {
    setSelectedSlotForContact(slot || null);
    setIsContactModalOpen(true);
  };

  // Helper to render category icon fallback
  const renderCategoryIcon = (category: string, isOccupied: boolean) => {
    const cat = (category || '').toLowerCase();
    if (!isOccupied) return <Sparkles size={22} className="text-amber-500" />;
    if (cat.includes('nutri') || cat.includes('suplement') || cat.includes('ração')) {
      return <Beef size={22} className="text-emerald-600" />;
    }
    if (cat.includes('balan') || cat.includes('tronco') || cat.includes('pes')) {
      return <Scale size={22} className="text-blue-600" />;
    }
    if (cat.includes('genét') || cat.includes('reprodu') || cat.includes('sêmen') || cat.includes('iatf')) {
      return <ShieldCheck size={22} className="text-teal-600" />;
    }
    if (cat.includes('saúd') || cat.includes('medic') || cat.includes('veterin')) {
      return <HeartPulse size={22} className="text-rose-600" />;
    }
    if (cat.includes('máquin') || cat.includes('trator') || cat.includes('curral')) {
      return <Tractor size={22} className="text-amber-600" />;
    }
    return <Store size={22} className="text-emerald-700" />;
  };

  const currentEditSlot = editingSlots[activeEditSlotIndex] || editingSlots[0];

  const updateCurrentEditField = (field: keyof PartnerSlot, value: any) => {
    setEditingSlots(prev => prev.map((s, idx) => idx === activeEditSlotIndex ? { ...s, [field]: value } : s));
  };

  const occupiedCount = partnerSlots.filter(s => s.isOccupied).length;
  const availableCount = 3 - occupiedCount;

  return (
    <div className="w-full font-sans">
      {/* Container Principal do Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-5 md:p-6 text-white shadow-lg border border-emerald-800/40 relative overflow-hidden">
        
        {/* Subtle glow effect in background */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header of Banner */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-emerald-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/90 text-white flex items-center justify-center shadow-md shadow-emerald-950/40 border border-emerald-400/30">
              <Handshake size={22} className="text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Vitrine de Parceiros & Soluções
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  3 Espaços
                </span>

                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <ShieldCheck size={10} />
                    <span>Admin</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Empresas, insumos e tecnologias recomendadas para potencializar a pecuária de precisão.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => handleOpenContact()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-200 bg-emerald-900/60 hover:bg-emerald-800/80 rounded-xl border border-emerald-700/60 transition-all active:scale-95 shadow-sm"
              title="Informações para anunciar sua empresa"
            >
              <Megaphone size={14} className="text-emerald-300" />
              <span>Anuncie Aqui</span>
            </button>

            {/* Gerenciar Espaços - Exclusivo para Administrador */}
            {isAdmin && (
              <button
                onClick={() => openEditor(0)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 hover:text-white rounded-xl border border-amber-700/50 transition-all active:scale-95 shadow-sm"
                title="Gerenciar e editar os 3 espaços de parceiros (Apenas Administrador)"
              >
                <Settings size={14} className="text-amber-400" />
                <span className="hidden xs:inline">Gerenciar Espaços</span>
              </button>
            )}
          </div>
        </div>

        {/* The 3 Available / Configured Partner Slots */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {partnerSlots.map((slot, index) => {
            const isOccupied = slot.isOccupied;

            return (
              <div 
                key={slot.id || `slot-${index}`}
                className={`
                  rounded-xl p-4 transition-all duration-200 flex flex-col justify-between relative group
                  ${isOccupied 
                    ? 'bg-slate-900/90 border border-emerald-800/60 hover:border-emerald-500/80 shadow-md' 
                    : 'bg-slate-900/40 border border-dashed border-slate-700/90 hover:border-emerald-500/60 hover:bg-slate-900/60'}
                `}
              >
                {/* Slot Number Tag & Status Pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md">
                    Espaço #{String(slot.slotNumber || index + 1).padStart(2, '0')}
                  </span>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isOccupied 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                  }`}>
                    {slot.badge || (isOccupied ? 'Parceiro Oficial' : 'Espaço Disponível')}
                  </span>
                </div>

                {/* Main Content Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden ${
                      isOccupied 
                        ? 'bg-slate-800 border-slate-700 shadow-inner' 
                        : 'bg-slate-800/50 border-dashed border-slate-700'
                    }`}>
                      {slot.logoUrl ? (
                        <img 
                          src={slot.logoUrl} 
                          alt={slot.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        renderCategoryIcon(slot.category, isOccupied)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-emerald-300 transition-colors">
                        {slot.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-emerald-400 truncate">
                        {slot.category}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {slot.description}
                  </p>
                </div>

                {/* Footer Actions for this Slot */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                  {isOccupied ? (
                    <>
                      <a
                        href={slot.linkUrl || 'https://instagram.com.br/vivendoapecuaria'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm transition-all active:scale-95"
                      >
                        <span>Conhecer Parceiro</span>
                        <ExternalLink size={13} />
                      </a>

                      {isAdmin && (
                        <button
                          onClick={() => openEditor(index)}
                          className="p-2 text-amber-300 hover:text-white bg-slate-800 hover:bg-amber-950 rounded-lg border border-slate-700 hover:border-amber-700 transition-colors"
                          title="Editar este espaço (Admin)"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenContact(slot)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm transition-all active:scale-95"
                      >
                        <span>Quero Anunciar</span>
                        <ArrowRight size={13} />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => openEditor(index)}
                          className="p-2 text-emerald-300 hover:text-white bg-emerald-950 hover:bg-emerald-900 rounded-lg border border-emerald-800 transition-colors"
                          title="Cadastrar marca neste espaço (Admin)"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Small Bottom Status Strip */}
        <div className="relative z-10 mt-4 pt-3 border-t border-emerald-900/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{occupiedCount} Parceiro(s) Ativo(s)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{availableCount} Espaço(s) Disponível(is)</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Interesse em parcerias? Contate <a href="https://instagram.com.br/vivendoapecuaria" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:underline">@vivendoapecuaria</a>
            </span>

            {/* Discrete Admin Key Icon for Owner */}
            <button
              onClick={() => {
                if (sessionAdminUnlocked) {
                  handleLockAdmin();
                } else {
                  setIsPinModalOpen(true);
                }
              }}
              className="text-slate-600 hover:text-slate-400 transition-colors p-1"
              title={isAdmin ? "Modo Admin Ativo (clique para fechar sessão)" : "Acesso do Administrador"}
            >
              {isAdmin ? <Unlock size={12} className="text-amber-400" /> : <Lock size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Validação de PIN de Administrador */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Acesso do Administrador</h4>
                  <p className="text-[11px] text-slate-400">Gerenciamento dos Parceiros</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsPinModalOpen(false); setPinError(''); setInputPin(''); }}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleVerifyPin} className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Insira a senha mestra ou PIN de administrador para desbloquear o gerenciamento dos espaços de parceiros:
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  PIN Administrativo
                </label>
                <input 
                  type="password"
                  autoFocus
                  required
                  value={inputPin}
                  onChange={(e) => { setInputPin(e.target.value); setPinError(''); }}
                  placeholder="Digite a senha..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {pinError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                  <ShieldAlert size={15} className="shrink-0 text-rose-600" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsPinModalOpen(false); setPinError(''); setInputPin(''); }}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check size={15} />
                  <span>Confirmar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar / Editar os 3 Espaços (Exclusivo Admin) */}
      {isEditModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-8">
            
            {/* Header Modal */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-600 text-white">
                  <Settings size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      Configuração dos 3 Espaços de Parceiros
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Painel Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Defina quais marcas, links e produtos aparecem no banner do site.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Slot Tab Switcher (Slots 1, 2, 3) */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
              {[0, 1, 2].map((idx) => {
                const s = editingSlots[idx];
                const isActive = activeEditSlotIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveEditSlotIndex(idx)}
                    className={`
                      flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2
                      ${isActive 
                        ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300 ring-2 ring-emerald-500/20' 
                        : 'bg-slate-200/80 text-slate-600 hover:bg-white hover:text-slate-900'}
                    `}
                  >
                    <span>Espaço 0{idx + 1}</span>
                    <span className={`w-2 h-2 rounded-full ${s?.isOccupied ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdits} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Status do Espaço */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-xs font-extrabold text-slate-800 block">
                    Status do Espaço #{activeEditSlotIndex + 1}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {currentEditSlot?.isOccupied 
                      ? 'Espaço ATIVO com dados da empresa preenchidos.' 
                      : 'Espaço DISPONÍVEL com convite para anunciantes.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCurrentEditField('isOccupied', true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentEditSlot?.isOccupied 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Ativo / Ocupado
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentEditField('isOccupied', false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !currentEditSlot?.isOccupied 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Disponível (Vago)
                  </button>
                </div>
              </div>

              {/* Nome e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nome da Marca / Parceiro</label>
                  <input 
                    type="text"
                    required
                    value={currentEditSlot?.name || ''}
                    onChange={(e) => updateCurrentEditField('name', e.target.value)}
                    placeholder="Ex: NutriCampo Nutrição Animal"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Categoria / Segmento</label>
                  <input 
                    type="text"
                    required
                    value={currentEditSlot?.category || ''}
                    onChange={(e) => updateCurrentEditField('category', e.target.value)}
                    placeholder="Ex: Nutrição & Suplementação"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Selo / Badge personalizada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Selo / Badge de Destaque</label>
                  <input 
                    type="text"
                    value={currentEditSlot?.badge || ''}
                    onChange={(e) => updateCurrentEditField('badge', e.target.value)}
                    placeholder="Ex: Parceiro Oficial, Patrocinador Master, Destaque"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Telefone / WhatsApp de Contato</label>
                  <input 
                    type="text"
                    value={currentEditSlot?.phoneOrWhatsapp || ''}
                    onChange={(e) => updateCurrentEditField('phoneOrWhatsapp', e.target.value)}
                    placeholder="Ex: (67) 99999-0000"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Descrição Curta */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Descrição Comercial Curta</label>
                <textarea 
                  rows={2}
                  value={currentEditSlot?.description || ''}
                  onChange={(e) => updateCurrentEditField('description', e.target.value)}
                  placeholder="Resumo dos produtos ou serviços oferecidos..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Links e Imagem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Link de Destino (Site / WhatsApp)</label>
                  <input 
                    type="url"
                    value={currentEditSlot?.linkUrl || ''}
                    onChange={(e) => updateCurrentEditField('linkUrl', e.target.value)}
                    placeholder="https://suaempresa.com.br"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">URL do Logotipo (Opcional)</label>
                  <input 
                    type="url"
                    value={currentEditSlot?.logoUrl || ''}
                    onChange={(e) => updateCurrentEditField('logoUrl', e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Feedback de salvamento */}
              {saveSuccessNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Espaços atualizados com sucesso!</span>
                </div>
              )}

              {/* Botoes de Ação */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2.5 text-slate-500 hover:text-rose-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={14} />
                  <span>Restaurar Padrão</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center gap-2"
                  >
                    <Check size={16} />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quero Anunciar / Seja um Parceiro */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            
            <div className="bg-gradient-to-r from-emerald-950 to-slate-900 p-6 text-white relative">
              <button 
                onClick={() => setIsContactModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={20} />
              </button>
              
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-2">
                <Sparkles size={12} />
                <span>Parcerias & Divulgação</span>
              </div>

              <h3 className="text-xl font-extrabold tracking-tight text-white">
                Anuncie no Espaço de Parceiros
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Conecte sua empresa a pecuaristas e gestores de fazendas em todo o Brasil.
              </p>
            </div>

            <div className="p-6 space-y-4">
              
              {selectedSlotForContact && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <p className="font-extrabold text-emerald-800">
                    Interesse no Espaço #{selectedSlotForContact.slotNumber}: {selectedSlotForContact.category}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Garanta a visibilidade exclusiva da sua marca neste nicho dentro da plataforma.
                  </p>
                </div>
              )}

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">1</div>
                  <p className="pt-0.5 leading-tight"><strong className="text-slate-900">Público Qualificado:</strong> Produtores rurais com foco em ganho de peso, confinamento e rentabilidade.</p>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">2</div>
                  <p className="pt-0.5 leading-tight"><strong className="text-slate-900">Banner Interativo:</strong> Link direto para seu WhatsApp comercial, Instagram ou catálogo de produtos.</p>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">3</div>
                  <p className="pt-0.5 leading-tight"><strong className="text-slate-900">Apenas 3 Vagas:</strong> Exclusividade garantida sem poluição visual ou concorrência excessiva.</p>
                </div>
              </div>

              {/* Botões de Contato */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <a
                  href={`https://wa.me/5567999990000?text=${encodeURIComponent(
                    `Olá! Tenho interesse em anunciar no Espaço de Parceiros da plataforma Gestão Pecuária ${
                      selectedSlotForContact ? `(Espaço #${selectedSlotForContact.slotNumber} - ${selectedSlotForContact.category})` : ''
                    }.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <MessageCircle size={16} />
                  <span>Falar via WhatsApp Comercial</span>
                </a>

                <a
                  href="https://instagram.com.br/vivendoapecuaria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Instagram size={16} />
                  <span>Contatar no Instagram @vivendoapecuaria</span>
                </a>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setIsContactModalOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Simple internal icon component helper
function Megaphone(props: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size || 24} 
      height={props.size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={props.className}
    >
      <path d="m3 11 18-5v12L3 14v-3z"/>
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  );
}

export default PartnersBanner;

