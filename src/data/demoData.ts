import { 
  Farm, 
  User, 
  AnimalStatus, 
  AnimalGender, 
  HealthSeverity, 
  TaskPriority, 
  TransactionType 
} from '../../types';

export const DEMO_USER: User = {
  id: 'guest-review-user',
  name: 'Produtor Rural',
  email: 'visitante@gestaopecuaria.com',
  provider: 'guest',
  role: 'user'
};

export const DEMO_FARM_DATA: Farm = {
  id: 'farm-modelo-demo',
  user_id: 'guest-review-user',
  name: 'Fazenda Modelo (Demonstração)',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  data: {
    lots: [
      {
        id: 'lot-recria-01',
        name: 'Lote 01 - Recria Nelore',
        description: 'Pasto de Brachiaria Brizantha com suplementação proteico-energética',
        dailyCost: 4.85
      },
      {
        id: 'lot-engorda-02',
        name: 'Lote 02 - Terminação Intensiva',
        description: 'Piquete com cocho coberto e ração concentrada 1.5% PV',
        dailyCost: 8.90
      },
      {
        id: 'lot-cria-03',
        name: 'Lote 03 - Matrizes & Bezerros',
        description: 'Área de maternidade e pastejo rotacionado',
        dailyCost: 3.20
      }
    ],
    animals: [
      {
        id: 'anim-001',
        earTag: 'BR-1020',
        breed: 'Nelore',
        gender: AnimalGender.MALE,
        status: AnimalStatus.ACTIVE,
        birthDate: '2023-04-10',
        weightKg: 460,
        gmd: 0.80,
        lastWeighingDate: '2024-08-10',
        purchaseValue: 2800,
        lotId: 'lot-recria-01',
        history: [
          { date: '2023-11-15', weightKg: 240, gmd: 0 },
          { date: '2024-02-15', weightKg: 310, gmd: 0.77 },
          { date: '2024-05-20', weightKg: 395, gmd: 0.89 },
          { date: '2024-08-10', weightKg: 460, gmd: 0.80 }
        ]
      },
      {
        id: 'anim-002',
        earTag: 'BR-1021',
        breed: 'Angus x Nelore',
        gender: AnimalGender.MALE,
        status: AnimalStatus.ACTIVE,
        birthDate: '2023-03-22',
        weightKg: 545,
        gmd: 0.71,
        lastWeighingDate: '2024-08-01',
        purchaseValue: 3100,
        lotId: 'lot-engorda-02',
        history: [
          { date: '2023-10-10', weightKg: 280, gmd: 0 },
          { date: '2024-01-15', weightKg: 375, gmd: 0.98 },
          { date: '2024-04-18', weightKg: 470, gmd: 1.02 },
          { date: '2024-08-01', weightKg: 545, gmd: 0.71 }
        ]
      },
      {
        id: 'anim-003',
        earTag: 'BR-1022',
        breed: 'Nelore',
        gender: AnimalGender.FEMALE,
        status: AnimalStatus.ACTIVE,
        birthDate: '2022-09-14',
        weightKg: 485,
        gmd: 0.14,
        lastWeighingDate: '2024-07-15',
        purchaseValue: 3400,
        lotId: 'lot-cria-03',
        history: [
          { date: '2023-06-01', weightKg: 410, gmd: 0 },
          { date: '2024-01-20', weightKg: 460, gmd: 0.21 },
          { date: '2024-07-15', weightKg: 485, gmd: 0.14 }
        ]
      },
      {
        id: 'anim-004',
        earTag: 'BR-1023',
        breed: 'Senepol',
        gender: AnimalGender.MALE,
        status: AnimalStatus.ACTIVE,
        birthDate: '2023-05-02',
        weightKg: 415,
        gmd: 0.79,
        lastWeighingDate: '2024-07-28',
        purchaseValue: 2950,
        lotId: 'lot-recria-01',
        history: [
          { date: '2023-12-05', weightKg: 230, gmd: 0 },
          { date: '2024-03-10', weightKg: 305, gmd: 0.78 },
          { date: '2024-07-28', weightKg: 415, gmd: 0.79 }
        ]
      },
      {
        id: 'anim-005',
        earTag: 'BR-1024',
        breed: 'Nelore Mocho',
        gender: AnimalGender.MALE,
        status: AnimalStatus.ACTIVE,
        birthDate: '2023-01-18',
        weightKg: 510,
        gmd: 0.67,
        lastWeighingDate: '2024-06-25',
        purchaseValue: 3200,
        lotId: 'lot-engorda-02',
        history: [
          { date: '2023-09-20', weightKg: 310, gmd: 0 },
          { date: '2024-02-10', weightKg: 420, gmd: 0.77 },
          { date: '2024-06-25', weightKg: 510, gmd: 0.67 }
        ]
      }
    ],
    inventory: [
      {
        id: 'inv-001',
        name: 'Sal Mineral com Ureia 80',
        category: 'Suplemento',
        quantity: 45,
        unit: 'Sacos 30kg',
        minQuantity: 15,
        unitCost: 82.50
      },
      {
        id: 'inv-002',
        name: 'Ração Concentrada Terminação 18% PB',
        category: 'Ração',
        quantity: 120,
        unit: 'Sacos 40kg',
        minQuantity: 30,
        unitCost: 74.00
      },
      {
        id: 'inv-003',
        name: 'Vacina Aftosa Bivalente',
        category: 'Medicamento',
        quantity: 8,
        unit: 'Frascos 50 doses',
        minQuantity: 10,
        unitCost: 145.00
      },
      {
        id: 'inv-004',
        name: 'Ivermectina 3.15% Longa Ação',
        category: 'Medicamento',
        quantity: 12,
        unit: 'Frascos 500ml',
        minQuantity: 5,
        unitCost: 110.00
      }
    ],
    transactions: [
      {
        id: 'trans-001',
        description: 'Venda de Lote de Bois Gordos (18 cab)',
        amount: 88560.00,
        type: TransactionType.INCOME,
        category: 'Venda de Animais',
        date: '2024-07-25'
      },
      {
        id: 'trans-002',
        description: 'Aquisição de Ração Concentrada e Suplementos',
        amount: 14250.00,
        type: TransactionType.EXPENSE,
        category: 'Alimentação & Nutrição',
        date: '2024-08-05'
      },
      {
        id: 'trans-003',
        description: 'Manutenção de Cercas e Cochos de Pasto',
        amount: 2800.00,
        type: TransactionType.EXPENSE,
        category: 'Manutenção & Infraestrutura',
        date: '2024-08-12'
      },
      {
        id: 'trans-004',
        description: 'Medicamentos Veterinários e Protocolo IATF',
        amount: 4350.00,
        type: TransactionType.EXPENSE,
        category: 'Sanidade & Veterinária',
        date: '2024-08-18'
      }
    ],
    healthRecords: [
      {
        id: 'health-001',
        animalId: 'anim-001',
        type: 'Vermífugo',
        title: 'Controle Estratégico de Endoparasitas',
        startDate: '2024-08-01',
        severity: HealthSeverity.LOW,
        protocol: 'Aplicação de Ivermectina 3.15% - 1ml para cada 50kg PV',
        notifyAsReminder: false,
        status: 'Concluído'
      },
      {
        id: 'health-002',
        animalId: 'anim-004',
        type: 'Doença',
        title: 'Tratamento Preventivo Podal',
        startDate: '2024-08-20',
        severity: HealthSeverity.MODERATE,
        protocol: 'Pedilúvio com sulfato de cobre e antibiótico tópico',
        notifyAsReminder: true,
        status: 'Em Tratamento'
      }
    ],
    tasks: [
      {
        id: 'task-001',
        description: 'Pesagem Geral do Lote 01 (Recria)',
        dueDate: '2024-08-30',
        priority: TaskPriority.HIGH,
        responsible: 'Equipe de Manejo',
        status: 'Pendente'
      },
      {
        id: 'task-002',
        description: 'Reposição de Sal Mineral nos Cochos do Retiro',
        dueDate: '2024-08-28',
        priority: TaskPriority.MEDIUM,
        responsible: 'Vaqueiro João',
        status: 'Pendente'
      },
      {
        id: 'task-003',
        description: 'Revisão dos Bebedouros e Cercas Elétricas',
        dueDate: '2024-08-25',
        priority: TaskPriority.LOW,
        responsible: 'Carlos Manutenção',
        status: 'Concluída'
      }
    ],
    globalDailyCost: 5.60,
    calculatorConfig: {
      predSellPrice: 295,
      predBuyPrice: 260,
      rentCost: 45,
      suppCostMonthly: 85,
      extraCostMonthly: 25,
      totalAnimalsDaily: 60,
      gmdDailyVal: 0.85,
      ingredients: [],
      avgLotWeight: 420,
      numAnimals: 60,
      pvPercent: 2.2
    }
  }
};
