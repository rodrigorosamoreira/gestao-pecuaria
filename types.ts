
export enum AnimalStatus {
  ACTIVE = 'Ativo',
  SOLD = 'Vendido',
  SICK = 'Doente',
  QUARANTINE = 'Quarentena',
  DEAD = 'Morto'
}

export enum AnimalGender {
  MALE = 'Macho',
  FEMALE = 'Fêmea'
}

export interface WeightRecord {
  date: string;
  weightKg: number;
  gmd?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
  provider: 'google' | 'email' | 'guest';
  role?: 'admin' | 'user' | string;
}

export enum HealthSeverity {
  LOW = 'Leve',
  MODERATE = 'Moderada',
  CRITICAL = 'Crítica'
}

export interface HealthRecord {
  id: string;
  animalId: string;
  type: 'Doença' | 'Vacina' | 'Vermífugo' | 'Suplementação' | 'Outro';
  title: string;
  startDate: string;
  severity: HealthSeverity;
  protocol: string;
  repeatAfterDays?: number;
  notifyAsReminder: boolean;
  status: 'Em Tratamento' | 'Concluído' | 'Agendado';
}

export enum TaskPriority {
  HIGH = 'Alta',
  MEDIUM = 'Média',
  LOW = 'Baixa'
}

export interface Task {
  id: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  responsible: string;
  status: 'Pendente' | 'Concluída';
}

export interface Animal {
  id: string;
  earTag: string;
  breed: string;
  gender: AnimalGender;
  birthDate: string;
  entryDate?: string;
  weightKg: number;
  gmd?: number;
  lastWeighingDate?: string;
  status: AnimalStatus;
  notes?: string;
  lastVaccinationDate?: string;
  purchaseValue?: number;
  lotId?: string;
  history: WeightRecord[];
  deathDate?: string;
  deathCause?: string;
  motherId?: string;
  fatherId?: string;
}

export interface LotWeighingRecord {
  id: string;
  date: string;
  avgWeightKg: number;
  avgArroba: number;
  gmd: number;
  headCount: number;
  notes?: string;
}

export interface Lot {
  id: string;
  name: string;
  description?: string;
  dailyCost?: number; 
  averageGmd?: number; // GMD médio cadastrado e guardado separadamente para o lote
  lastWeighingDate?: string; // Data da última pesagem do lote
  lastRecordedAvgWeightKg?: number; // Último peso médio apurado
  history?: LotWeighingRecord[]; // Histórico de pesagens do lote
  calculatorConfig?: CalculatorConfig;
}

export interface StockMovement {
  id: string;
  date: string;
  type: 'entrada' | 'consumo' | 'ajuste';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  notes?: string;
  lotId?: string;
  lotName?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Ração' | 'Medicamento' | 'Equipamento' | 'Suplemento' | 'Pastagem' | 'Outro' | string;
  quantity: number;
  minQuantity: number;
  unit: string;
  unitCost: number;
  totalCost?: number;
  lastPurchaseDate?: string;
  history?: StockMovement[];
}

export enum TransactionType {
  INCOME = 'Receita',
  EXPENSE = 'Despesa'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export interface Ingredient {
  id: string;
  name: string;
  percent: number;
  priceKg: number;
}

export interface CalculatorConfig {
  rentCost: number;
  rentMode?: 'total' | 'per_animal';
  rentPerAnimal?: number;
  suppCostMonthly: number;
  extraCostMonthly: number;
  totalAnimalsDaily: number;
  gmdDailyVal: number;
  ingredients: Ingredient[];
  avgLotWeight: number;
  numAnimals: number;
  pvPercent: number;
  isMineralSalt?: boolean;
  mineralPriceTotal?: number;
  mineralBagWeight?: number;
  mineralConsumptionGrams?: number;
  predQty?: number;
  predEntryWeight?: number;
  predBuyPrice?: number;
  predTargetMode?: 'final_weight' | 'gmd' | 'days';
  predExitWeight?: number;
  predCarcassYield?: number;
  predSellPrice?: number;
  predDailyRate?: number;
  predGmd?: number;
  predDays?: number;
}

export interface FarmData {
  animals: Animal[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  lots: Lot[];
  healthRecords: HealthRecord[];
  tasks: Task[];
  globalDailyCost: number;
  calculatorConfig?: CalculatorConfig;
}

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  data: FarmData;
  updated_at: string;
  created_at?: string;
}

export interface PartnerSlot {
  id: string;
  slotNumber: number; // 1, 2, 3
  isOccupied: boolean;
  name: string;
  category: string;
  description: string;
  logoUrl?: string;
  linkUrl?: string;
  phoneOrWhatsapp?: string;
  badge?: string;
  highlightColor?: string;
  couponCode?: string;
  couponDiscount?: string;
  couponDescription?: string;
  couponExpiration?: string;
}
