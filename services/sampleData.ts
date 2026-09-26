import { Farm, FarmData, AnimalStatus, AnimalGender, HealthSeverity, TaskPriority, TransactionType } from '../types';

export const createDefaultSampleFarm = (userId: string, farmName: string = 'Fazenda Modelo'): Farm => {
  const lot1Id = `lot-recria-${Date.now()}`;
  const lot2Id = `lot-engorda-${Date.now()}`;
  const lotPastoId = `lot-fazenda-${Date.now()}`;

  const today = new Date();
  const dateStr = (offsetDays: number = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  const sampleData: FarmData = {
    globalDailyCost: 5.80,
    lots: [
      {
        id: lot1Id,
        name: 'Pasto 01 - Recria Nelore',
        description: 'Pasto de braquiária com suplementação mineral adensada',
        dailyCost: 4.50,
        averageGmd: 0.720,
        lastWeighingDate: dateStr(15),
        lastRecordedAvgWeightKg: 335.5,
        history: [
          {
            id: `lh-1-${Date.now()}`,
            date: dateStr(45),
            avgWeightKg: 314.0,
            avgArroba: 10.47,
            gmd: 0.680,
            headCount: 4,
            notes: 'Entrada no piquete'
          },
          {
            id: `lh-2-${Date.now()}`,
            date: dateStr(15),
            avgWeightKg: 335.5,
            avgArroba: 11.18,
            gmd: 0.720,
            headCount: 4,
            notes: 'Pesagem periódica de controle'
          }
        ]
      },
      {
        id: lot2Id,
        name: 'Piquete 02 - Terminação & Cruzamento',
        description: 'Área com suplementação concentrada para acabamento',
        dailyCost: 7.20,
        averageGmd: 1.150,
        lastWeighingDate: dateStr(10),
        lastRecordedAvgWeightKg: 492.0,
        history: [
          {
            id: `lh-3-${Date.now()}`,
            date: dateStr(40),
            avgWeightKg: 457.5,
            avgArroba: 15.25,
            gmd: 1.100,
            headCount: 4,
            notes: 'Início da fase de engorda'
          },
          {
            id: `lh-4-${Date.now()}`,
            date: dateStr(10),
            avgWeightKg: 492.0,
            avgArroba: 16.40,
            gmd: 1.150,
            headCount: 4,
            notes: 'Pesagem de acompanhamento'
          }
        ]
      },
      {
        id: lotPastoId,
        name: 'Fazenda (Lote Geral)',
        description: 'Lote geral de recepção e quarentena',
        dailyCost: 5.00
      }
    ],
    animals: [
      {
        id: `an-1-${Date.now()}`,
        earTag: 'NEL-101',
        breed: 'Nelore',
        gender: AnimalGender.MALE,
        birthDate: dateStr(420),
        entryDate: dateStr(90),
        weightKg: 345,
        gmd: 0.750,
        lastWeighingDate: dateStr(15),
        status: AnimalStatus.ACTIVE,
        purchaseValue: 2600,
        lotId: lot1Id,
        notes: 'Garrote padrão, excelente carcaça',
        history: [
          { date: dateStr(90), weightKg: 290, gmd: 0.700 },
          { date: dateStr(45), weightKg: 322, gmd: 0.710 },
          { date: dateStr(15), weightKg: 345, gmd: 0.750 }
        ]
      },
      {
        id: `an-2-${Date.now()}`,
        earTag: 'NEL-102',
        breed: 'Nelore',
        gender: AnimalGender.MALE,
        birthDate: dateStr(400),
        entryDate: dateStr(90),
        weightKg: 338,
        gmd: 0.710,
        lastWeighingDate: dateStr(15),
        status: AnimalStatus.ACTIVE,
        purchaseValue: 2550,
        lotId: lot1Id,
        history: [
          { date: dateStr(90), weightKg: 285, gmd: 0.680 },
          { date: dateStr(45), weightKg: 316, gmd: 0.690 },
          { date: dateStr(15), weightKg: 338, gmd: 0.710 }
        ]
      },
      {
        id: `an-3-${Date.now()}`,
        earTag: 'ANG-201',
        breed: 'Angus',
        gender: AnimalGender.MALE,
        birthDate: dateStr(520),
        entryDate: dateStr(120),
        weightKg: 510,
        gmd: 1.200,
        lastWeighingDate: dateStr(10),
        status: AnimalStatus.ACTIVE,
        purchaseValue: 3200,
        lotId: lot2Id,
        notes: 'Cruzamento industrial - ótimo marmoreio',
        history: [
          { date: dateStr(120), weightKg: 380, gmd: 1.050 },
          { date: dateStr(40), weightKg: 474, gmd: 1.175 },
          { date: dateStr(10), weightKg: 510, gmd: 1.200 }
        ]
      },
      {
        id: `an-4-${Date.now()}`,
        earTag: 'ANG-202',
        breed: 'Angus',
        gender: AnimalGender.MALE,
        birthDate: dateStr(510),
        entryDate: dateStr(120),
        weightKg: 498,
        gmd: 1.120,
        lastWeighingDate: dateStr(10),
        status: AnimalStatus.ACTIVE,
        purchaseValue: 3150,
        lotId: lot2Id,
        history: [
          { date: dateStr(120), weightKg: 375, gmd: 1.020 },
          { date: dateStr(40), weightKg: 464, gmd: 1.110 },
          { date: dateStr(10), weightKg: 498, gmd: 1.120 }
        ]
      },
      {
        id: `an-5-${Date.now()}`,
        earTag: 'BRG-301',
        breed: 'Brangus',
        gender: AnimalGender.MALE,
        birthDate: dateStr(480),
        entryDate: dateStr(100),
        weightKg: 475,
        gmd: 1.100,
        lastWeighingDate: dateStr(10),
        status: AnimalStatus.ACTIVE,
        purchaseValue: 3000,
        lotId: lot2Id,
        history: [
          { date: dateStr(100), weightKg: 365, gmd: 1.000 },
          { date: dateStr(40), weightKg: 442, gmd: 1.080 },
          { date: dateStr(10), weightKg: 475, gmd: 1.100 }
        ]
      }
    ],
    transactions: [
      {
        id: `tr-1-${Date.now()}`,
        date: dateStr(5),
        description: 'Venda de Lote Terminado (3 animais abatidos)',
        amount: 19850.00,
        type: TransactionType.INCOME,
        category: 'Vendas'
      },
      {
        id: `tr-2-${Date.now()}`,
        date: dateStr(12),
        description: 'Compra de Suplemento Mineral e Vitaminas',
        amount: 3200.00,
        type: TransactionType.EXPENSE,
        category: 'Nutrição'
      },
      {
        id: `tr-3-${Date.now()}`,
        date: dateStr(20),
        description: 'Medicamentos & Vacinas Rebanho',
        amount: 850.00,
        type: TransactionType.EXPENSE,
        category: 'Sanidade'
      },
      {
        id: `tr-4-${Date.now()}`,
        date: dateStr(25),
        description: 'Manutenção de Cercas e Bebedouros',
        amount: 620.00,
        type: TransactionType.EXPENSE,
        category: 'Manutenção'
      }
    ],
    inventory: [
      {
        id: `inv-1-${Date.now()}`,
        name: 'Sal Mineral Fósforo 80',
        category: 'Suplemento',
        quantity: 45,
        minQuantity: 15,
        unit: 'Sacos 30kg',
        unitCost: 110.00,
        totalCost: 4950.00,
        lastPurchaseDate: dateStr(12),
        history: []
      },
      {
        id: `inv-2-${Date.now()}`,
        name: 'Ração Concentrada Proteica 20%',
        category: 'Ração',
        quantity: 60,
        minQuantity: 20,
        unit: 'Sacos 40kg',
        unitCost: 85.00,
        totalCost: 5100.00,
        lastPurchaseDate: dateStr(18),
        history: []
      },
      {
        id: `inv-3-${Date.now()}`,
        name: 'Ivermectina 3.15% Longa Ação',
        category: 'Medicamento',
        quantity: 4,
        minQuantity: 2,
        unit: 'Frascos 500ml',
        unitCost: 145.00,
        totalCost: 580.00,
        lastPurchaseDate: dateStr(20),
        history: []
      }
    ],
    healthRecords: [
      {
        id: `hr-1-${Date.now()}`,
        animalId: `an-1-${Date.now()}`,
        type: 'Vacina',
        title: 'Campanha Febre Aftosa & Clostridiose',
        startDate: dateStr(18),
        severity: HealthSeverity.LOW,
        protocol: 'Dose 2ml subcutânea',
        notifyAsReminder: false,
        status: 'Concluído'
      }
    ],
    tasks: [
      {
        id: `tk-1-${Date.now()}`,
        description: 'Pesagem e apartação do Lote 01 (Recria)',
        dueDate: dateStr(-3), // Daqui a 3 dias
        priority: TaskPriority.HIGH,
        responsible: 'Equipe de Campo / Zootecnia',
        status: 'Pendente'
      },
      {
        id: `tk-2-${Date.now()}`,
        description: 'Limpeza e revisão de bebedouros dos piquetes',
        dueDate: dateStr(-1),
        priority: TaskPriority.MEDIUM,
        responsible: 'Manejo Geral',
        status: 'Pendente'
      }
    ]
  };

  return {
    id: `farm-sample-${Date.now()}`,
    user_id: userId,
    name: farmName,
    data: sampleData,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
};
