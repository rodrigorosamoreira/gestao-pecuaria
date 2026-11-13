import React, { useState } from 'react';
import { 
  Handshake, 
  ExternalLink, 
  Edit3, 
  CheckCircle2, 
  Store, 
  Tractor, 
  Beef, 
  Scale, 
  HeartPulse, 
  ShieldCheck, 
  Sparkles,
  Settings,
  Plus,
  RefreshCw,
  ArrowRight,
  MessageCircle,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Ticket,
  Copy,
  Check,
  X,
  Gift
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

const MASTER_ADMIN_EMAILS = [
  'rodrigorosamoreira@gmail.com',
  'admin@gestaopeccuaria.com',
  'vivendoapecuaria@gmail.com'
];

const MASTER_ADMIN_PIN = 'pecuaria2025';
const ADMIN_SESSION_KEY = 'gestao_pecuaria_admin_unlocked';

const PartnersBanner: React.FC<PartnersBannerProps> = ({ currentUser }) => {
  const [partnerSlots, setPartnerSlots] = useState<PartnerSlot[]>(getStoredPartnerSlots());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedSlotForCoupon, setSelectedSlotForCoupon] = useState<PartnerSlot | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [copiedCardSlotId, setCopiedCardSlotId] = useState<string | null>(null);
  
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedSlotForContact, setSelectedSlotForContact] = useState<PartnerSlot | null>(null);

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

  const handleDirectCopyCoupon = (slot: PartnerSlot, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!slot.couponCode) return;
    try {
      navigator.clipboard.writeText(slot.couponCode);
    } catch {
      // Fallback
    }
    const slotKey = slot.id || `slot-${slot.slotNumber}`;
    setCopiedCardSlotId(slotKey);
    setTimeout(() => {
      setCopiedCardSlotId(prev => prev === slotKey ? null : prev);
    }, 2500);
  };

  const handleOpenCoupon = (slot: PartnerSlot) => {
    setSelectedSlotForCoupon(slot);
    setCopiedCoupon(false);
    setIsCouponModalOpen(true);
  };

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const renderCategoryIcon = (category: string, isOccupied: boolean) => {
    const cat = (category || '').toLowerCase();
    if (!isOccupied) return <Sparkles size={22} className="text-amber-500" />;
    if (cat.includes('nutri') || cat.includes('suplement') || cat.includes('ração')) {
      return <Beef size={22} className="text-emerald-500" />;
    }
    if (cat.includes('balan') || cat.includes('tronco') || cat.includes('pes')) {
      return <Scale size={22} className="text-amber-400" />;
    }
    if (cat.includes('genét') || cat.includes('reprodu') || cat.includes('sêmen') || cat.includes('iatf')) {
      return <ShieldCheck size={22} className="text-teal-400" />;
    }
    if (cat.includes('saúd') || cat.includes('medic') || cat.includes('veterin')) {
      return <HeartPulse size={22} className="text-rose-400" />;
    }
    if (cat.includes('máquin') || cat.includes('trator') || cat.includes('curral')) {
      return <Tractor size={22} className="text-amber-500" />;
    }
    return <Store size={22} className="text-emerald-400" />;
  };

  const currentEditSlot = editingSlots[activeEditSlotIndex] || editingSlots[0];

  const updateCurrentEditField = (field: keyof PartnerSlot, value: any) => {
    setEditingSlots(prev => prev.map((s, idx) => idx === activeEditSlotIndex ? { ...s, [field]: value } : s));
  };

  const occupiedCount = partnerSlots.filter(s => s.isOccupied).length;
  const availableCount = 3 - occupiedCount;

  return (
    <div className="w-full font-sans">
      <div className="bg-white rounded-xl p-4 sm:p-5 text-[#20332C] shadow-xs border border-[#E3EAE6] relative overflow-hidden">
        
        {/* Top Header of Banner */}
        <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[#E3EAE6]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#DCEDE4] text-[#145C46] flex items-center justify-center shrink-0 border border-[#DCEDE4]">
              <Handshake size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#20332C] tracking-normal truncate">
                  Vitrine de Parceiros & Soluções
                </h3>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#DCEDE4] text-[#145C46] shrink-0">
                  3 Espaços
                </span>

                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    <ShieldCheck size={12} />
                    <span>Admin</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64766C] truncate mt-0.5">
                Insumos, equipamentos e cupons de desconto para pecuária de alta rentabilidade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenContact()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[#145C46] hover:bg-[#0E4434] rounded-lg transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Informações para anunciar sua empresa"
            >
              <Megaphone size={14} />
              <span>Anuncie Aqui</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => openEditor(0)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-all active:scale-95 shadow-xs cursor-pointer"
                title="Gerenciar e editar os 3 espaços de parceiros (Apenas Administrador)"
              >
                <Settings size={14} className="text-amber-700" />
                <span className="hidden md:inline">Gerenciar</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Partner Slots - Spacious Grid with 10-15% more height and comfortable typography */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {partnerSlots.map((slot, index) => {
            const isOccupied = slot.isOccupied;
            const hasCoupon = Boolean(slot.couponCode && slot.couponCode.trim().length > 0);

            return (
              <div 
                key={slot.id || `slot-${index}`}
                className={`
                  rounded-xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col justify-between relative group min-h-[195px]
                  ${isOccupied 
                    ? 'bg-[#FAFCFA] border border-[#E3EAE6] hover:border-[#145C46] shadow-xs' 
                    : 'bg-[#F6F8F5] border border-dashed border-[#CBD5E1] hover:border-[#145C46]'}
                `}
              >
                {/* Header Tag and Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-medium text-[#64766C] bg-white border border-[#E3EAE6] px-2 py-0.5 rounded-md">
                    Espaço #{String(slot.slotNumber || index + 1).padStart(2, '0')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {hasCoupon && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Ticket size={11} />
                        <span>{slot.couponDiscount || 'Cupom'}</span>
                      </span>
                    )}

                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                      isOccupied 
                        ? 'bg-[#DCEDE4] text-[#145C46] border-[#DCEDE4]' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {slot.badge || (isOccupied ? 'Parceiro' : 'Disponível')}
                    </span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden p-1 ${
                      isOccupied 
                        ? 'bg-white border-[#E3EAE6] shadow-xs' 
                        : 'bg-white border-dashed border-[#CBD5E1]'
                    }`}>
                      {slot.logoUrl ? (
                        <img 
                          src={slot.logoUrl} 
                          alt={slot.name} 
                          className="w-full h-full object-contain" 
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
                      <h4 className="text-sm font-semibold text-[#20332C] truncate group-hover:text-[#145C46] transition-colors leading-snug">
                        {slot.name}
                      </h4>
                      <p className="text-xs font-medium text-[#145C46] truncate leading-tight mt-0.5">
                        {slot.category}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#64766C] line-clamp-2 leading-relaxed font-normal">
                    {slot.description}
                  </p>

                  {/* Coupon Strip Component inside Card */}
                  {isOccupied && hasCoupon && (
                    <div 
                      onClick={(e) => handleDirectCopyCoupon(slot, e)}
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer border transition-all active:scale-98 ${
                        copiedCardSlotId === (slot.id || `slot-${slot.slotNumber}`)
                          ? 'bg-[#DCEDE4] border-[#145C46] text-[#145C46]'
                          : 'bg-amber-50/90 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50'
                      }`}
                      title={`Clique para copiar o cupom ${slot.couponCode}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1 rounded shrink-0 ${
                          copiedCardSlotId === (slot.id || `slot-${slot.slotNumber}`)
                            ? 'bg-[#145C46] text-white'
                            : 'bg-amber-200 text-amber-900'
                        }`}>
                          <Ticket size={12} />
                        </div>
                        <div className="truncate flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-amber-900">
                            {slot.couponDiscount ? slot.couponDiscount : 'Cupom'}:
                          </span>
                          <span className="text-xs font-nums font-semibold text-[#20332C] truncate">
                            {slot.couponCode}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDirectCopyCoupon(slot, e)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition-all ${
                          copiedCardSlotId === (slot.id || `slot-${slot.slotNumber}`)
                            ? 'bg-[#145C46] text-white'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                      >
                        {copiedCardSlotId === (slot.id || `slot-${slot.slotNumber}`) ? (
                          <>
                            <Check size={12} className="stroke-[2.5]" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Actions - 14px Buttons */}
                <div className="pt-2.5 border-t border-[#E3EAE6] flex items-center justify-between gap-2 mt-auto">
                  {isOccupied ? (
                    <>
                      <a
                        href={slot.linkUrl || 'https://instagram.com.br/vivendoapecuaria'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#145C46] hover:bg-[#0E4434] text-white rounded-lg font-semibold text-sm shadow-xs transition-all active:scale-95"
                      >
                        <span>Conhecer Parceiro</span>
                        <ExternalLink size={13} />
                      </a>

                      {hasCoupon && (
                        <button
                          onClick={(e) => handleDirectCopyCoupon(slot, e)}
                          className={`p-2 rounded-lg border transition-colors ${
                            copiedCardSlotId === (slot.id || `slot-${slot.slotNumber}`)
                              ? 'text-[#145C46] bg-[#DCEDE4] border-[#145C46]'
                              : 'text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-200'
                          }`}
                          title={copiedCardSlotId === (slot.id || `slot-${slot.slotNumber}`) ? "Cupom copiado!" : `Copiar cupom (${slot.couponCode})`}
                        >
                          {copiedCardSlotId === (slot.id || `slot-${slot.slotNumber}`) ? (
                            <Check size={14} className="text-[#145C46] stroke-[2.5]" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => openEditor(index)}
                          className="p-2 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
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
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#218568] hover:bg-[#145C46] text-white rounded-lg font-semibold text-sm shadow-xs transition-all active:scale-95"
                      >
                        <span>Quero Anunciar</span>
                        <ArrowRight size={13} />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => openEditor(index)}
                          className="p-2 text-[#145C46] hover:text-[#0E4434] bg-[#DCEDE4] hover:bg-[#E5F2EB] rounded-lg border border-[#DCEDE4] transition-colors"
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

        {/* Footer info & Admin lock - Compact */}
        <div className="mt-2.5 pt-2.5 border-t border-[#E3EAE6] flex flex-wrap items-center justify-between gap-2 text-xs text-[#64766C]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#145C46]" />
              <span>{occupiedCount} Parceiro(s) Ativo(s)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{availableCount} Disponível(is)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#64766C]">
              Interesse em parcerias? Contate <a href="https://instagram.com.br/vivendoapecuaria" target="_blank" rel="noopener noreferrer" className="text-[#145C46] font-semibold hover:underline">@vivendoapecuaria</a>
            </span>

            <button
              onClick={() => {
                if (sessionAdminUnlocked) {
                  handleLockAdmin();
                } else {
                  setIsPinModalOpen(true);
                }
              }}
              className="text-[#64766C] hover:text-[#20332C] transition-colors p-1 cursor-pointer"
              title={isAdmin ? "Modo Admin Ativo (clique para fechar sessão)" : "Acesso do Administrador"}
            >
              {isAdmin ? <Unlock size={13} className="text-amber-600" /> : <Lock size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Exibir Cupom de Desconto */}
      {isCouponModalOpen && selectedSlotForCoupon && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-[#E3EAE6] text-[#20332C] relative">
            
            <button 
              onClick={() => setIsCouponModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors z-10 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="bg-[#145C46] p-6 text-center relative overflow-hidden text-white">
              <div className="inline-flex p-3 bg-white/10 rounded-xl mb-2 border border-white/20">
                <Gift size={26} className="text-amber-200" />
              </div>
              <h3 className="text-lg font-semibold leading-snug text-white">
                Cupom Exclusivo de Parceiro
              </h3>
              <p className="text-xs text-[#DCEDE4] font-normal mt-1">
                {selectedSlotForCoupon.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              
              {selectedSlotForCoupon.couponDiscount && (
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-semibold">
                    {selectedSlotForCoupon.couponDiscount}
                  </span>
                </div>
              )}

              {selectedSlotForCoupon.couponDescription && (
                <p className="text-[13px] text-[#64766C] text-center leading-relaxed">
                  {selectedSlotForCoupon.couponDescription}
                </p>
              )}

              {/* Cupom Box with Copy */}
              <div className="p-4 bg-[#F6F8F5] border border-dashed border-amber-400 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-[#64766C] block">Código do cupom:</span>
                  <span className="text-lg font-nums font-semibold text-[#20332C]">
                    {selectedSlotForCoupon.couponCode}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyCouponCode(selectedSlotForCoupon.couponCode || '')}
                  className={`px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedCoupon
                      ? 'bg-[#145C46] text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                  }`}
                >
                  {copiedCoupon ? (
                    <>
                      <Check size={15} />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instructions */}
              <div className="p-3.5 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6] text-xs text-[#64766C] space-y-1 leading-relaxed">
                <p className="font-semibold text-[#20332C]">Como usar:</p>
                <p>1. Copie o código acima.</p>
                <p>2. Informe ao parceiro no WhatsApp ou no carrinho de compras no site oficial.</p>
              </div>

              <div className="space-y-2.5 pt-2">
                {selectedSlotForCoupon.phoneOrWhatsapp && (
                  <a
                    href={`https://wa.me/55${selectedSlotForCoupon.phoneOrWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá! Vi o cupom ${selectedSlotForCoupon.couponCode} na plataforma Gestão Pecuária e gostaria de solicitar um orçamento.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#145C46] hover:bg-[#0E4434] text-white rounded-lg font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageCircle size={16} />
                    <span>Usar via WhatsApp ({selectedSlotForCoupon.phoneOrWhatsapp})</span>
                  </a>
                )}

                {selectedSlotForCoupon.linkUrl && (
                  <a
                    href={selectedSlotForCoupon.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#F6F8F5] hover:bg-[#E5F2EB] text-[#20332C] rounded-lg font-semibold text-sm border border-[#E3EAE6] flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Ir para o Site do Parceiro</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Validação de PIN de Administrador */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-[#E3EAE6]">
            <div className="bg-[#145C46] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white leading-snug">Acesso do Administrador</h4>
                  <p className="text-xs text-[#DCEDE4] font-normal">Gerenciamento dos Parceiros</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsPinModalOpen(false); setPinError(''); setInputPin(''); }}
                className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleVerifyPin} className="p-5 space-y-4">
              <p className="text-[13px] text-[#64766C] leading-relaxed">
                Insira a senha mestra ou PIN de administrador para desbloquear o gerenciamento dos espaços de parceiros:
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#64766C] block">
                  PIN administrativo
                </label>
                <input 
                  type="password"
                  autoFocus
                  required
                  value={inputPin}
                  onChange={(e) => { setInputPin(e.target.value); setPinError(''); }}
                  placeholder="Digite a senha..."
                  className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none"
                />
              </div>

              {pinError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium flex items-center gap-2">
                  <ShieldAlert size={15} className="shrink-0 text-rose-600" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsPinModalOpen(false); setPinError(''); setInputPin(''); }}
                  className="px-4 py-2 text-[#64766C] hover:bg-[#F6F8F5] rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#145C46] hover:bg-[#0E4434] text-white rounded-lg text-sm font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-[#E3EAE6] animate-in zoom-in-95 duration-200 my-8">
            
            <div className="bg-[#145C46] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-white/10 text-white">
                  <Settings size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white leading-snug">
                      Configuração dos 3 Espaços de Parceiros
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-white/15 text-white">
                      Painel Admin
                    </span>
                  </div>
                  <p className="text-xs text-[#DCEDE4] font-normal mt-0.5">
                    Defina marcas, cupons de desconto, logos e links de cada slot.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Slot Tab Switcher (Slots 1, 2, 3) */}
            <div className="p-3.5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex items-center gap-2">
              {[0, 1, 2].map((idx) => {
                const s = editingSlots[idx];
                const isActive = activeEditSlotIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveEditSlotIndex(idx)}
                    className={`
                      flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer
                      ${isActive 
                        ? 'bg-white text-[#145C46] shadow-2xs border border-[#218568]' 
                        : 'bg-transparent text-[#64766C] hover:bg-white hover:text-[#20332C]'}
                    `}
                  >
                    <span>Espaço 0{idx + 1}</span>
                    <span className={`w-2 h-2 rounded-full ${s?.isOccupied ? 'bg-[#218568]' : 'bg-amber-400'}`} />
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdits} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Status do Espaço */}
              <div className="p-4 bg-[#F6F8F5] border border-[#E3EAE6] rounded-xl flex items-center justify-between gap-3">
                <div>
                  <label className="text-sm font-semibold text-[#20332C] block">
                    Status do Espaço #{activeEditSlotIndex + 1}
                  </label>
                  <p className="text-xs text-[#64766C] mt-0.5">
                    {currentEditSlot?.isOccupied 
                      ? 'Espaço ativo com dados da empresa preenchidos.' 
                      : 'Espaço disponível com convite para anunciantes.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCurrentEditField('isOccupied', true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentEditSlot?.isOccupied 
                        ? 'bg-[#145C46] text-white shadow-2xs' 
                        : 'bg-white border border-[#E3EAE6] text-[#64766C] hover:text-[#20332C]'
                    }`}
                  >
                    Ativo / Ocupado
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentEditField('isOccupied', false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      !currentEditSlot?.isOccupied 
                        ? 'bg-amber-500 text-white shadow-2xs' 
                        : 'bg-white border border-[#E3EAE6] text-[#64766C] hover:text-[#20332C]'
                    }`}
                  >
                    Disponível (Vago)
                  </button>
                </div>
              </div>

              {/* Nome e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64766C] block">Nome da marca / parceiro</label>
                  <input 
                    type="text"
                    required
                    value={currentEditSlot?.name || ''}
                    onChange={(e) => updateCurrentEditField('name', e.target.value)}
                    placeholder="Ex: Constant Balanças"
                    className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64766C] block">Categoria / segmento</label>
                  <input 
                    type="text"
                    required
                    value={currentEditSlot?.category || ''}
                    onChange={(e) => updateCurrentEditField('category', e.target.value)}
                    placeholder="Ex: Balanças & Pesagem Pecuária"
                    className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none"
                  />
                </div>
              </div>

              {/* Seção de Cupom de Desconto */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Ticket size={16} className="text-amber-700" />
                  <label className="text-sm font-semibold text-amber-900">
                    Cupom de Desconto & Vantagem Promocional
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#64766C] block">Código do cupom</label>
                    <input 
                      type="text"
                      value={currentEditSlot?.couponCode || ''}
                      onChange={(e) => updateCurrentEditField('couponCode', e.target.value.toUpperCase())}
                      placeholder="Ex: CONSTANTVIP"
                      className="w-full border border-[#E3EAE6] rounded-lg px-3 py-2 text-sm font-nums text-[#20332C] focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#64766C] block">Texto de destaque / desconto</label>
                    <input 
                      type="text"
                      value={currentEditSlot?.couponDiscount || ''}
                      onChange={(e) => updateCurrentEditField('couponDiscount', e.target.value)}
                      placeholder="Ex: 10% OFF ou Frete Grátis"
                      className="w-full border border-[#E3EAE6] rounded-lg px-3 py-2 text-sm text-[#20332C] focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#64766C] block">Regulamento / descrição do cupom</label>
                  <input 
                    type="text"
                    value={currentEditSlot?.couponDescription || ''}
                    onChange={(e) => updateCurrentEditField('couponDescription', e.target.value)}
                    placeholder="Ex: Desconto exclusivo na compra de balanças para fazendas cadastradas."
                    className="w-full border border-[#E3EAE6] rounded-lg px-3 py-2 text-sm text-[#20332C] focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  />
                </div>
              </div>

              {/* Selo / Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64766C] block">Selo / badge de destaque</label>
                  <input 
                    type="text"
                    value={currentEditSlot?.badge || ''}
                    onChange={(e) => updateCurrentEditField('badge', e.target.value)}
                    placeholder="Ex: Parceiro Oficial, Destaque"
                    className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64766C] block">Telefone / WhatsApp de contato</label>
                  <input 
                    type="text"
                    value={currentEditSlot?.phoneOrWhatsapp || ''}
                    onChange={(e) => updateCurrentEditField('phoneOrWhatsapp', e.target.value)}
                    placeholder="Ex: (27) 99631-4111"
                    className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none"
                  />
                </div>
              </div>

              {/* Descrição Curta */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#64766C] block">Descrição comercial curta</label>
                <textarea 
                  rows={2}
                  value={currentEditSlot?.description || ''}
                  onChange={(e) => updateCurrentEditField('description', e.target.value)}
                  placeholder="Resumo dos produtos ou serviços oferecidos..."
                  className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Links e Imagem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64766C] block">Link de destino (Site / WhatsApp)</label>
                  <input 
                    type="url"
                    value={currentEditSlot?.linkUrl || ''}
                    onChange={(e) => updateCurrentEditField('linkUrl', e.target.value)}
                    placeholder="https://suaempresa.com.br"
                    className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64766C] block">URL do logotipo (opcional)</label>
                  <input 
                    type="text"
                    value={currentEditSlot?.logoUrl || ''}
                    onChange={(e) => updateCurrentEditField('logoUrl', e.target.value)}
                    placeholder="URL da imagem do logo"
                    className="w-full border border-[#E3EAE6] rounded-lg px-3.5 py-2.5 text-sm text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46] outline-none"
                  />
                </div>
              </div>

              {saveSuccessNotice && (
                <div className="p-3 bg-[#DCEDE4] border border-[#218568]/40 text-[#145C46] rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={16} className="text-[#145C46]" />
                  <span>Espaços atualizados com sucesso!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E3EAE6] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 text-[#64766C] hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Restaurar padrão</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 text-[#64766C] hover:bg-[#F6F8F5] rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#145C46] hover:bg-[#0E4434] text-white rounded-lg text-sm font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
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

      {/* Modal: Quero Anunciar */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-[#E3EAE6] animate-in zoom-in-95 duration-200">
            
            <div className="bg-[#145C46] p-6 text-white relative">
              <button 
                onClick={() => setIsContactModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
              
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 text-white text-xs font-medium mb-2">
                <Sparkles size={13} />
                <span>Parcerias & Divulgação</span>
              </div>

              <h3 className="text-lg font-semibold leading-snug text-white">
                Anuncie no Espaço de Parceiros
              </h3>
              <p className="text-xs text-[#DCEDE4] font-normal mt-1">
                Conecte sua empresa a pecuaristas e gestores de fazendas em todo o Brasil.
              </p>
            </div>

            <div className="p-6 space-y-4">
              
              {selectedSlotForContact && (
                <div className="p-3.5 bg-[#DCEDE4]/60 border border-[#DCEDE4] rounded-xl text-xs text-[#20332C]">
                  <p className="font-semibold text-[#145C46] text-sm">
                    Interesse no Espaço #{selectedSlotForContact.slotNumber}: {selectedSlotForContact.category}
                  </p>
                  <p className="text-xs text-[#64766C] mt-1 leading-relaxed">
                    Garanta a visibilidade exclusiva da sua marca neste nicho dentro da plataforma.
                  </p>
                </div>
              )}

              <div className="space-y-2.5 text-[13px] text-[#64766C]">
                <div className="flex items-start gap-3 p-3 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6]">
                  <div className="w-7 h-7 rounded-lg bg-[#DCEDE4] text-[#145C46] flex items-center justify-center font-semibold text-xs shrink-0">1</div>
                  <p className="pt-0.5 leading-relaxed"><strong className="font-semibold text-[#20332C]">Público Qualificado:</strong> Produtores rurais com foco em ganho de peso, pesagem e rentabilidade.</p>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6]">
                  <div className="w-7 h-7 rounded-lg bg-[#DCEDE4] text-[#145C46] flex items-center justify-center font-semibold text-xs shrink-0">2</div>
                  <p className="pt-0.5 leading-relaxed"><strong className="font-semibold text-[#20332C]">Cupom de Desconto:</strong> Destaque com código promocional para impulsionar suas conversões.</p>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6]">
                  <div className="w-7 h-7 rounded-lg bg-[#DCEDE4] text-[#145C46] flex items-center justify-center font-semibold text-xs shrink-0">3</div>
                  <p className="pt-0.5 leading-relaxed"><strong className="font-semibold text-[#20332C]">Apenas 3 Vagas:</strong> Exclusividade garantida sem poluição visual ou concorrência excessiva.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E3EAE6] space-y-2.5">
                <a
                  href={`https://wa.me/5567999990000?text=${encodeURIComponent(
                    `Olá! Tenho interesse em anunciar no Espaço de Parceiros da plataforma Gestão Pecuária ${
                      selectedSlotForContact ? `(Espaço #${selectedSlotForContact.slotNumber} - ${selectedSlotForContact.category})` : ''
                    }.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#145C46] hover:bg-[#0E4434] text-white rounded-lg font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle size={16} />
                  <span>Falar via WhatsApp Comercial</span>
                </a>

                <a
                  href="https://instagram.com.br/vivendoapecuaria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#F6F8F5] hover:bg-[#E5F2EB] text-[#20332C] border border-[#E3EAE6] rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span>Contatar no Instagram @vivendoapecuaria</span>
                </a>
              </div>
            </div>

            <div className="p-3.5 bg-[#F6F8F5] border-t border-[#E3EAE6] text-center">
              <button 
                onClick={() => setIsContactModalOpen(false)}
                className="text-sm font-semibold text-[#64766C] hover:text-[#20332C] cursor-pointer"
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
