import { PartnerSlot } from '../types';

const STORAGE_KEY = 'gestao_pecuaria_partner_slots_v1';

export const DEFAULT_PARTNERS: PartnerSlot[] = [
  {
    id: 'slot-1',
    slotNumber: 1,
    isOccupied: true,
    name: 'NutriCampo Nutrição Animal',
    category: 'Nutrição & Suplementação',
    description: 'Suplementos minerais, proteicos e aditivos de alta performance para máxima conversão alimentar no pasto e confinamento.',
    logoUrl: '',
    linkUrl: 'https://instagram.com.br/vivendoapecuaria',
    phoneOrWhatsapp: '(67) 99999-0001',
    badge: 'Parceiro Oficial',
    highlightColor: 'emerald'
  },
  {
    id: 'slot-2',
    slotNumber: 2,
    isOccupied: false,
    name: 'Espaço Parceiro 02',
    category: 'Genética & Reprodução Bovina',
    description: 'Espaço disponível para empresas de sêmen, IATF, melhoramento zootécnico ou laboratórios veterinários.',
    logoUrl: '',
    linkUrl: 'https://instagram.com.br/vivendoapecuaria',
    phoneOrWhatsapp: '',
    badge: 'Espaço Disponível',
    highlightColor: 'teal'
  },
  {
    id: 'slot-3',
    slotNumber: 3,
    isOccupied: false,
    name: 'Espaço Parceiro 03',
    category: 'Troncos, Balanças & Máquinas',
    description: 'Espaço reservado para divulgação de balanças eletrônicas, currais, maquinários e soluções para o campo.',
    logoUrl: '',
    linkUrl: 'https://instagram.com.br/vivendoapecuaria',
    phoneOrWhatsapp: '',
    badge: 'Espaço Disponível',
    highlightColor: 'blue'
  }
];

export const getStoredPartnerSlots = (): PartnerSlot[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PARTNERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 3) {
      return parsed;
    }
    return DEFAULT_PARTNERS;
  } catch (err) {
    console.warn('Erro ao carregar parceiros do localStorage:', err);
    return DEFAULT_PARTNERS;
  }
};

export const savePartnerSlots = (slots: PartnerSlot[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch (err) {
    console.warn('Erro ao salvar parceiros no localStorage:', err);
  }
};

export const resetPartnerSlotsToDefault = (): PartnerSlot[] => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {}
  return DEFAULT_PARTNERS;
};
