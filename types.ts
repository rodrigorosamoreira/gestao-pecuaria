
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
  provider: 'google' | 'email';
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

export interface Lot {
  id: string;
  name: string;
  description?: string;
  dailyCost?: number; 
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Ração' | 'Medicamento' | 'Equipamento' | 'Outro';
  quantity: number;
  minQuantity: number;
  unit: string;
  unitCost: number;
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

export interface FarmData {
  animals: Animal[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  lots: Lot[];
  healthRecords: HealthRecord[];
  tasks: Task[];
  globalDailyCost: number;
}
