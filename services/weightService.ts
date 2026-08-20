import { Animal, WeightRecord, Lot } from '../types';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Retorna os detalhes da última pesagem oficial do animal.
 */
export function getAnimalLastWeighing(animal: Animal): {
  date: string;
  weightKg: number;
  gmd: number;
} {
  if (animal.history && animal.history.length > 0) {
    const lastRecord = animal.history[animal.history.length - 1];
    return {
      date: lastRecord.date || animal.lastWeighingDate || animal.entryDate || getTodayDateString(),
      weightKg: typeof lastRecord.weightKg === 'number' ? lastRecord.weightKg : animal.weightKg,
      gmd: typeof lastRecord.gmd === 'number' ? lastRecord.gmd : (animal.gmd || 0)
    };
  }

  return {
    date: animal.lastWeighingDate || animal.entryDate || getTodayDateString(),
    weightKg: animal.weightKg || 0,
    gmd: animal.gmd || 0
  };
}

/**
 * Calcula a diferença em dias corridos entre duas datas YYYY-MM-DD.
 */
export function getDaysDifference(fromDateStr: string, toDateStr: string = getTodayDateString()): number {
  try {
    const from = new Date(fromDateStr + 'T00:00:00');
    const to = new Date(toDateStr + 'T00:00:00');
    const diffTime = to.getTime() - from.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch {
    return 0;
  }
}

/**
 * Obtém o GMD efetivo a ser aplicado no animal, priorizando o GMD médio guardado no lote do animal.
 */
export function getEffectiveAnimalGmd(
  animal: Animal, 
  lotOrLots?: Lot | Lot[]
): {
  gmd: number;
  source: 'lot' | 'animal' | 'default';
  lotName?: string;
} {
  if (lotOrLots) {
    let matchedLot: Lot | undefined;
    if (Array.isArray(lotOrLots)) {
      matchedLot = lotOrLots.find(l => l.id === animal.lotId);
    } else if (lotOrLots.id === animal.lotId || !animal.lotId) {
      matchedLot = lotOrLots;
    }

    if (matchedLot && typeof matchedLot.averageGmd === 'number' && !isNaN(matchedLot.averageGmd)) {
      return {
        gmd: Number(matchedLot.averageGmd),
        source: 'lot',
        lotName: matchedLot.name
      };
    }
  }

  const lastWeighing = getAnimalLastWeighing(animal);
  if (typeof lastWeighing.gmd === 'number' && !isNaN(lastWeighing.gmd) && lastWeighing.gmd !== 0) {
    return {
      gmd: Number(lastWeighing.gmd),
      source: 'animal'
    };
  }

  if (typeof animal.gmd === 'number' && !isNaN(animal.gmd) && animal.gmd !== 0) {
    return {
      gmd: Number(animal.gmd),
      source: 'animal'
    };
  }

  return {
    gmd: 0.8,
    source: 'default'
  };
}

export interface PredictedWeightResult {
  baseWeightKg: number;
  baseArroba: number;
  baseDate: string;
  gmd: number;
  gmdSource: 'lot' | 'animal' | 'default';
  lotName?: string;
  daysElapsed: number;
  weightGainKg: number;
  predictedWeightKg: number;
  predictedArroba: number;
}

/**
 * Calcula o Peso Previsto adicionando diariamente o último GMD médio cadastrado para o lote do animal.
 */
export function calculatePredictedWeight(
  animal: Animal,
  targetDateStr: string = getTodayDateString(),
  lotOrLots?: Lot | Lot[]
): PredictedWeightResult {
  const lastWeighing = getAnimalLastWeighing(animal);
  const effective = getEffectiveAnimalGmd(animal, lotOrLots);
  const daysElapsed = getDaysDifference(lastWeighing.date, targetDateStr);
  const gmd = effective.gmd;
  const weightGainKg = daysElapsed * gmd;
  const predictedWeightKg = Math.max(0, Number((lastWeighing.weightKg + weightGainKg).toFixed(2)));

  return {
    baseWeightKg: lastWeighing.weightKg,
    baseArroba: Number((lastWeighing.weightKg / 30).toFixed(2)),
    baseDate: lastWeighing.date,
    gmd,
    gmdSource: effective.source,
    lotName: effective.lotName,
    daysElapsed,
    weightGainKg: Number(weightGainKg.toFixed(2)),
    predictedWeightKg,
    predictedArroba: Number((predictedWeightKg / 30).toFixed(2))
  };
}

/**
 * Calcula o GMD a partir de uma nova pesagem.
 */
export function calculateGMDFromWeighing(
  prevWeightKg: number,
  newWeightKg: number,
  prevDateStr: string,
  newDateStr: string = getTodayDateString()
): {
  gmd: number;
  days: number;
  weightDiffKg: number;
} {
  const days = Math.max(1, getDaysDifference(prevDateStr, newDateStr));
  const weightDiffKg = newWeightKg - prevWeightKg;
  const gmd = Number((weightDiffKg / days).toFixed(3));

  return {
    gmd,
    days,
    weightDiffKg: Number(weightDiffKg.toFixed(2))
  };
}

export interface LotWeighingStats {
  headCount: number;
  avgRecordedWeightKg: number;
  avgRecordedArroba: number;
  avgPredictedWeightKg: number;
  avgPredictedArroba: number;
  avgGmd: number;
  isLotGmdConfigured: boolean;
  totalPredictedWeightKg: number;
  totalPredictedArrobas: number;
  totalWeightGainKg: number;
  mostRecentWeighingDate: string;
}

/**
 * Calcula estatísticas completas de peso e projeção para um lote de animais ativos,
 * respeitando o GMD médio guardado no lote.
 */
export function calculateLotWeighingStats(
  animalsInLot: Animal[],
  targetDateStr: string = getTodayDateString(),
  lotOrLots?: Lot | Lot[]
): LotWeighingStats {
  const singleLot = lotOrLots && !Array.isArray(lotOrLots) ? (lotOrLots as Lot) : undefined;
  const lotHasGmd = typeof singleLot?.averageGmd === 'number' && !isNaN(singleLot.averageGmd);
  const lotGmd = lotHasGmd ? Number(singleLot!.averageGmd) : 0;

  if (!animalsInLot || animalsInLot.length === 0) {
    return {
      headCount: 0,
      avgRecordedWeightKg: singleLot?.lastRecordedAvgWeightKg || 0,
      avgRecordedArroba: Number(((singleLot?.lastRecordedAvgWeightKg || 0) / 30).toFixed(2)),
      avgPredictedWeightKg: singleLot?.lastRecordedAvgWeightKg || 0,
      avgPredictedArroba: Number(((singleLot?.lastRecordedAvgWeightKg || 0) / 30).toFixed(2)),
      avgGmd: lotHasGmd ? lotGmd : 0,
      isLotGmdConfigured: lotHasGmd,
      totalPredictedWeightKg: 0,
      totalPredictedArrobas: 0,
      totalWeightGainKg: 0,
      mostRecentWeighingDate: singleLot?.lastWeighingDate || targetDateStr
    };
  }

  let totalRecordedWeight = 0;
  let totalPredictedWeight = 0;
  let totalGmdSum = 0;
  let totalGain = 0;
  let mostRecentDate = singleLot?.lastWeighingDate || '';

  animalsInLot.forEach(animal => {
    const lastWeighing = getAnimalLastWeighing(animal);
    totalRecordedWeight += lastWeighing.weightKg;

    const pred = calculatePredictedWeight(animal, targetDateStr, lotOrLots);
    totalPredictedWeight += pred.predictedWeightKg;
    totalGmdSum += pred.gmd;
    totalGain += pred.weightGainKg;

    if (!mostRecentDate || (lastWeighing.date && lastWeighing.date > mostRecentDate)) {
      mostRecentDate = lastWeighing.date;
    }
  });

  const count = animalsInLot.length;
  const avgRecordedWeightKg = Number((totalRecordedWeight / count).toFixed(2));
  const avgPredictedWeightKg = Number((totalPredictedWeight / count).toFixed(2));
  const effectiveLotGmd = lotHasGmd ? lotGmd : Number((totalGmdSum / count).toFixed(3));

  return {
    headCount: count,
    avgRecordedWeightKg,
    avgRecordedArroba: Number((avgRecordedWeightKg / 30).toFixed(2)),
    avgPredictedWeightKg,
    avgPredictedArroba: Number((avgPredictedWeightKg / 30).toFixed(2)),
    avgGmd: effectiveLotGmd,
    isLotGmdConfigured: lotHasGmd,
    totalPredictedWeightKg: Number(totalPredictedWeight.toFixed(2)),
    totalPredictedArrobas: Number((totalPredictedWeight / 30).toFixed(2)),
    totalWeightGainKg: Number(totalGain.toFixed(2)),
    mostRecentWeighingDate: mostRecentDate || targetDateStr
  };
}
