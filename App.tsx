
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AnimalManager from './components/AnimalManager';
import FinanceManager from './components/FinanceManager';
import InventoryManager from './components/InventoryManager';
import LotManager from './components/LotManager';
import ToolsCalculator from './components/ToolsCalculator';
import MarketMonitor from './components/MarketMonitor';
import AiConsultant from './components/AiConsultant';
import HealthManager from './components/HealthManager';
import TaskManager from './components/TaskManager';
import ResetPasswordModal from './components/ResetPasswordModal';
import { createDefaultSampleFarm } from './services/sampleData';
import { supabase, clearSupabaseAuth } from './lib/supabase';
import { 
  Animal, 
  AnimalStatus, 
  Transaction, 
  TransactionType, 
  InventoryItem, 
  StockMovement,
  Lot, 
  User,
  FarmData,
  HealthRecord,
  Task,
  Farm
} from './types';
import { Database, AlertTriangle, X, RefreshCw } from 'lucide-react';

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const normalizeFarmData = (raw: any, defaultLot: Lot): FarmData => {
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
  }
  const obj = parsed && typeof parsed === 'object' ? parsed : {};
  return {
    animals: Array.isArray(obj.animals) ? obj.animals : [],
    transactions: Array.isArray(obj.transactions) ? obj.transactions : [],
    inventory: Array.isArray(obj.inventory) ? obj.inventory : [],
    lots: Array.isArray(obj.lots) ? obj.lots : [defaultLot],
    healthRecords: Array.isArray(obj.healthRecords) ? obj.healthRecords : [],
    tasks: Array.isArray(obj.tasks) ? obj.tasks : [],
    globalDailyCost: typeof obj.globalDailyCost === 'number' ? obj.globalDailyCost : 0,
    calculatorConfig: obj.calculatorConfig
  };
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [isCreatingFarm, setIsCreatingFarm] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  const farmsRef = useRef<Farm[]>([]);
  const userRef = useRef<User | null>(null);
  const dirtyFarmIdsRef = useRef<Set<string>>(new Set());
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);

  farmsRef.current = farms;
  userRef.current = user;

  const DEFAULT_FAZENDA_LOT: Lot = {
    id: 'lot-fazenda-default',
    name: 'Fazenda',
    description: 'Lote principal da fazenda'
  };

  const activeFarm = farms.find(f => f.id === activeFarmId);
  const rawFarmData = activeFarm?.data || {
    animals: [],
    transactions: [],
    inventory: [],
    lots: [],
    healthRecords: [],
    tasks: [],
    globalDailyCost: 0,
    calculatorConfig: undefined
  };

  const farmData: FarmData = {
    ...rawFarmData,
    lots: Array.isArray(rawFarmData.lots)
      ? rawFarmData.lots
      : [DEFAULT_FAZENDA_LOT]
  };

  useEffect(() => {
    // Remove qualquer vestígio antigo do modo local para exigir autenticação em nuvem
    try {
      localStorage.removeItem('local_user');
    } catch (_) {}

    if (window.location.hash && window.location.hash.includes('type=recovery')) {
      setIsResetPasswordOpen(true);
    }

    const applyAuthenticatedUser = (sessionUser: any) => {
      const nextUser: User = {
        id: sessionUser.id,
        name: String(sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Usuário'),
        email: sessionUser.email || '',
        provider: 'email'
      };
      setUser(prev =>
        prev && prev.id === nextUser.id && prev.email === nextUser.email && prev.name === nextUser.name
          ? prev
          : nextUser
      );
    };

    const resetSessionState = () => {
      dirtyFarmIdsRef.current.clear();
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      setUser(null);
      setIsLoaded(false);
      setFarms([]);
      setActiveFarmId(null);
      setDbError(null);
      setSyncError(null);
    };

    const handleAuthError = (err: any) => {
      const msg = String(err?.message || err || '');
      if (
        msg.includes('Invalid Refresh Token') ||
        msg.includes('Refresh Token Not Found') ||
        msg.includes('refresh_token')
      ) {
        console.warn('Sessão expirada detectada. Limpando armazenamento de autenticação...');
        clearSupabaseAuth();
        resetSessionState();
      }
    };

    const handleSessionExpiredEvent = () => {
      clearSupabaseAuth();
      resetSessionState();
    };
    window.addEventListener('supabase-session-expired', handleSessionExpiredEvent);

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        handleAuthError(error);
        return;
      }
      if (data?.session?.user) {
        applyAuthenticatedUser(data.session.user);
      }
    }).catch(err => {
      console.warn('Falha ao obter sessão do Supabase:', err);
      handleAuthError(err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true);
      }

      if (session?.user) {
        applyAuthenticatedUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        resetSessionState();
      }
    });

    return () => {
      window.removeEventListener('supabase-session-expired', handleSessionExpiredEvent);
      subscription.unsubscribe();
    };
  }, []);

  const insertFarmToDatabase = useCallback(async (userId: string, name: string, data: FarmData): Promise<Farm | null> => {
    let { data: inserted, error } = await supabase
      .from('user_data')
      .insert({
        user_id: userId,
        name,
        data
      })
      .select()
      .single();

    if (error) {
      const retry = await supabase
        .from('user_data')
        .insert({
          id: generateUuid(),
          user_id: userId,
          name,
          data
        })
        .select()
        .single();
      inserted = retry.data;
      error = retry.error;
    }

    if (error || !inserted) {
      console.error('Erro ao gravar fazenda no banco de dados:', error);
      return null;
    }

    return {
      ...inserted,
      data: normalizeFarmData(inserted.data, DEFAULT_FAZENDA_LOT)
    };
  }, []);

  const fetchFarmsFromDatabase = useCallback(async (targetUser: User) => {
    setIsLoaded(false);
    setDbError(null);
    dirtyFarmIdsRef.current.clear();

    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', targetUser.id);

      if (error) {
        console.error('Erro ao buscar fazendas no banco de dados:', error);
        setDbError(error.message || 'Falha ao carregar os dados salvos no banco de dados.');
        return;
      }

      if (data && data.length > 0) {
        const normalizedFarms: Farm[] = data
          .map((row: any) => ({
            ...row,
            data: normalizeFarmData(row.data, DEFAULT_FAZENDA_LOT)
          }))
          .sort((a: Farm, b: Farm) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
            return ta - tb;
          });

        setFarms(normalizedFarms);
        const savedActiveId = localStorage.getItem(`activeFarm_${targetUser.id}`);
        if (savedActiveId && normalizedFarms.some(f => f.id === savedActiveId)) {
          setActiveFarmId(savedActiveId);
        } else {
          setActiveFarmId(normalizedFarms[0].id);
        }
        // Limpa eventual cache legado do modo antigo
        localStorage.removeItem(`farms_${targetUser.id}`);
      } else {
        // Verifica se existem dados pendentes de migração do armazenamento antigo antes de criar amostra
        let legacyFarms: Farm[] = [];
        try {
          const legacyRaw = localStorage.getItem(`farms_${targetUser.id}`);
          if (legacyRaw) {
            const parsed = JSON.parse(legacyRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              legacyFarms = parsed;
            }
          }
        } catch (_) {}

        if (legacyFarms.length > 0) {
          const insertedList: Farm[] = [];
          for (const lf of legacyFarms) {
            const created = await insertFarmToDatabase(
              targetUser.id,
              lf.name || 'Minha Fazenda',
              normalizeFarmData(lf.data, DEFAULT_FAZENDA_LOT)
            );
            if (created) insertedList.push(created);
          }
          if (insertedList.length > 0) {
            setFarms(insertedList);
            setActiveFarmId(insertedList[0].id);
            localStorage.setItem(`activeFarm_${targetUser.id}`, insertedList[0].id);
            localStorage.removeItem(`farms_${targetUser.id}`);
            return;
          }
        }

        // Primeiro acesso do usuário: cria fazenda inicial e salva imediatamente no banco de dados
        const sample = createDefaultSampleFarm(targetUser.id, 'Minha Fazenda');
        const createdSample = await insertFarmToDatabase(targetUser.id, sample.name, sample.data);
        if (createdSample) {
          setFarms([createdSample]);
          setActiveFarmId(createdSample.id);
          localStorage.setItem(`activeFarm_${targetUser.id}`, createdSample.id);
        } else {
          setDbError('Não foi possível inicializar seus dados no servidor. Clique em "Recarregar Dados" para tentar novamente.');
        }
      }
    } catch (err: any) {
      console.error('Exceção ao carregar dados do banco:', err);
      setDbError(err?.message || 'Erro de conexão com o banco de dados.');
    } finally {
      setIsLoaded(true);
    }
  }, [insertFarmToDatabase]);

  useEffect(() => {
    if (user?.id) {
      fetchFarmsFromDatabase(user);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && isLoaded) {
      const hasSeen = localStorage.getItem(`welcome_seen_${user.id}`);
      if (!hasSeen) {
        setShowWelcome(true);
      }
    }
  }, [user, isLoaded]);

  const flushPendingSync = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || dirtyFarmIdsRef.current.size === 0 || isSyncingRef.current) return;

    const idsToSync = Array.from(dirtyFarmIdsRef.current);
    dirtyFarmIdsRef.current.clear();

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      for (const farmId of idsToSync) {
        const farm = farmsRef.current.find(f => f.id === farmId);
        if (!farm) continue;

        let { data: updatedRows, error } = await supabase
          .from('user_data')
          .update({
            name: farm.name,
            data: farm.data,
            updated_at: new Date().toISOString()
          })
          .eq('id', farm.id)
          .eq('user_id', currentUser.id)
          .select('id');

        if (error && String(error.message || '').toLowerCase().includes('updated_at')) {
          const retryNoTimestamp = await supabase
            .from('user_data')
            .update({
              name: farm.name,
              data: farm.data
            })
            .eq('id', farm.id)
            .eq('user_id', currentUser.id)
            .select('id');
          updatedRows = retryNoTimestamp.data;
          error = retryNoTimestamp.error;
        }

        if (error) {
          console.error('Erro ao salvar alterações no banco de dados:', error);
          dirtyFarmIdsRef.current.add(farmId);
          setSyncError('Falha ao salvar alterações no banco de dados. Tentando sincronizar...');
          continue;
        }

        // Caso a linha ainda não exista no banco (ex.: id antigo), insere e atualiza o id real
        if (!updatedRows || updatedRows.length === 0) {
          const inserted = await insertFarmToDatabase(currentUser.id, farm.name, farm.data);
          if (inserted) {
            setFarms(prev => prev.map(f => (f.id === farmId ? inserted : f)));
            setActiveFarmId(prevId => (prevId === farmId ? inserted.id : prevId));
          } else {
            dirtyFarmIdsRef.current.add(farmId);
            setSyncError('Não foi possível gravar os dados no banco de dados.');
          }
        }
      }
    } catch (err: any) {
      console.error('Falha de conexão ao salvar no banco:', err);
      idsToSync.forEach(id => dirtyFarmIdsRef.current.add(id));
      setSyncError('Erro de conexão ao salvar no banco de dados.');
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      // Se novas edições ocorreram durante o envio, agenda nova sincronização imediata
      if (dirtyFarmIdsRef.current.size > 0) {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => {
          flushPendingSync();
        }, 400);
      }
    }
  }, [insertFarmToDatabase]);

  useEffect(() => {
    const handleVisibilityOrHide = () => {
      if (document.visibilityState === 'hidden' && dirtyFarmIdsRef.current.size > 0) {
        flushPendingSync();
      }
    };
    const handleBeforeUnload = () => {
      if (dirtyFarmIdsRef.current.size > 0) {
        flushPendingSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrHide);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrHide);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flushPendingSync]);

  const handleCreateFarm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFarmName.trim() || !user) return;

    try {
      const defaultFazendaLot: Lot = {
        id: `lot-fazenda-${Date.now()}`,
        name: 'Fazenda',
        description: 'Lote principal da fazenda'
      };

      const initialFarmData: FarmData = {
        animals: [],
        transactions: [],
        inventory: [],
        lots: [defaultFazendaLot],
        healthRecords: [],
        tasks: [],
        globalDailyCost: 0,
        calculatorConfig: undefined
      };

      setIsSyncing(true);
      const createdFarm = await insertFarmToDatabase(user.id, newFarmName.trim(), initialFarmData);
      if (!createdFarm) {
        setSyncError('Não foi possível salvar a nova fazenda no banco de dados. Tente novamente.');
        return;
      }

      const updated = [...farms, createdFarm];
      setFarms(updated);
      setActiveFarmId(createdFarm.id);
      localStorage.setItem(`activeFarm_${user.id}`, createdFarm.id);
      setIsCreatingFarm(false);
      setNewFarmName('');
      setSyncError(null);
    } catch (err: any) {
      console.error(err);
      setSyncError('Erro ao criar fazenda no banco: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteFarm = async (id: string) => {
    const farmToDelete = farms.find(f => f.id === id);
    if (!farmToDelete || !user) return;

    const confirmMsg = `EXCLUIR FAZENDA: "${farmToDelete.name.toUpperCase()}"?\n\nEsta ação é IRREVERSÍVEL. Todos os dados de animais, finanças e estoque desta fazenda serão apagados do banco de dados.`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsSyncing(true);
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao excluir fazenda do banco:', error);
        setSyncError(`Erro ao excluir fazenda no banco: ${error.message}`);
        return;
      }

      dirtyFarmIdsRef.current.delete(id);
      const updatedFarms = farms.filter(f => f.id !== id);
      setFarms(updatedFarms);

      if (activeFarmId === id) {
        if (updatedFarms.length > 0) {
          const nextId = updatedFarms[0].id;
          setActiveFarmId(nextId);
          localStorage.setItem(`activeFarm_${user.id}`, nextId);
        } else {
          setActiveFarmId(null);
          localStorage.removeItem(`activeFarm_${user.id}`);
        }
      }
      setSyncError(null);
    } catch (err: any) {
      console.error('Falha na exclusão:', err);
      setSyncError(`Erro ao excluir fazenda: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateActiveFarmData = (updater: (prev: FarmData) => FarmData) => {
    if (!activeFarmId) return;
    const targetFarmId = activeFarmId;

    setFarms(prev => {
      const next = prev.map(f => {
        if (f.id !== targetFarmId) return f;
        const currentData = f.data || {
          animals: [],
          transactions: [],
          inventory: [],
          lots: [],
          healthRecords: [],
          tasks: [],
          globalDailyCost: 0
        };
        const ensuredLots = Array.isArray(currentData.lots)
          ? currentData.lots
          : [DEFAULT_FAZENDA_LOT];
        const dataWithLots: FarmData = { ...currentData, lots: ensuredLots };
        const updatedData = updater(dataWithLots);
        return { ...f, data: updatedData };
      });
      farmsRef.current = next;
      return next;
    });

    dirtyFarmIdsRef.current.add(targetFarmId);
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      flushPendingSync();
    }, 500);
  };

  const handleSelectFarm = (id: string) => {
    if (dirtyFarmIdsRef.current.size > 0) {
      flushPendingSync();
    }
    setActiveFarmId(id);
    if (user) localStorage.setItem(`activeFarm_${user.id}`, id);
  };

  const closeWelcome = () => {
    if (user) {
      localStorage.setItem(`welcome_seen_${user.id}`, 'true');
    }
    setShowWelcome(false);
  };

  const handleLogout = async () => {
    try {
      await flushPendingSync();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao encerrar sessão:', e);
    } finally {
      clearSupabaseAuth();
      localStorage.removeItem('local_user');
      dirtyFarmIdsRef.current.clear();
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      setFarms([]);
      setActiveFarmId(null);
      setUser(null);
      setIsLoaded(false);
      setDbError(null);
      setSyncError(null);
      setCurrentView('dashboard');
    }
  };

  const renderContent = () => {
    if (!activeFarm) return null;
    switch (currentView) {
      case 'dashboard': return (
        <Dashboard 
          animals={farmData.animals} 
          lots={farmData.lots}
          transactions={farmData.transactions} 
          inventory={farmData.inventory} 
          healthRecords={farmData.healthRecords} 
          onChangeView={setCurrentView} 
          currentUser={user}
        />
      );
      case 'animals': return (
        <AnimalManager 
          animals={farmData.animals} 
          lots={farmData.lots} 
          onAddAnimal={a => updateActiveFarmData(d => ({ ...d, animals: [...d.animals, a], transactions: a.purchaseValue ? [...d.transactions, { id: `buy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, date: a.entryDate || new Date().toISOString().split('T')[0], description: `Compra: ${a.earTag}`, amount: a.purchaseValue, type: TransactionType.EXPENSE, category: 'Compra Animais' }] : d.transactions }))} 
          onAddBatch={(ans, cost) => updateActiveFarmData(d => ({ ...d, animals: [...d.animals, ...ans], transactions: cost > 0 ? [...d.transactions, { id: `bt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, date: ans[0].entryDate || new Date().toISOString().split('T')[0], description: `Lote: ${ans.length} cab.`, amount: cost, type: TransactionType.EXPENSE, category: 'Compra Animais' }] : d.transactions }))}
          onUpdateAnimal={a => updateActiveFarmData(d => ({ ...d, animals: d.animals.map(old => old.id === a.id ? a : old) }))} 
          onDeleteAnimal={id => updateActiveFarmData(d => ({ ...d, animals: d.animals.filter(a => a.id !== id), healthRecords: d.healthRecords.filter(r => r.animalId !== id) }))}
          onSellAnimal={(id, date, val, w) => updateActiveFarmData(d => {
            const animal = d.animals.find(a => a.id === id);
            if (!animal) return d;
            const lot = d.lots.find(l => l.id === animal.lotId);
            const daily = lot?.dailyCost || d.globalDailyCost;
            const days = Math.max(0, Math.ceil((new Date(date).getTime() - new Date(animal.entryDate || date).getTime()) / (1000 * 3600 * 24)));
            const stayCost = days * daily;
            const purchaseValue = animal.purchaseValue || 0;
            const profit = val - purchaseValue - stayCost;
            return { 
              ...d, 
              animals: d.animals.map(a => a.id === id ? { ...a, status: AnimalStatus.SOLD, weightKg: w } : a), 
              transactions: [
                ...d.transactions, 
                { 
                  id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, 
                  date, 
                  description: `Venda: ${animal.earTag} (Lucro: R$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, 
                  amount: val, 
                  type: TransactionType.INCOME, 
                  category: 'Vendas' 
                },
                {
                  id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  date,
                  description: `Custo Estadia: ${animal.earTag} (${days} dias)`,
                  amount: stayCost,
                  type: TransactionType.EXPENSE,
                  category: 'Produção'
                }
              ] 
            };
          })}
          onAnimalDeath={(id, date, cause) => updateActiveFarmData(d => ({ ...d, animals: d.animals.map(a => a.id === id ? { ...a, status: AnimalStatus.DEAD, deathDate: date, deathCause: cause } : a) }))}
          onSellLot={(lotId, date, avgW, mode, val) => {
            const lotAns = farmData.animals.filter(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE);
            const lot = farmData.lots.find(l => l.id === lotId);
            const daily = lot?.dailyCost || farmData.globalDailyCost;
            let totalStay = 0;
            let totalBuy = 0;
            lotAns.forEach(a => {
              totalBuy += (a.purchaseValue || 0);
              const days = Math.max(0, Math.ceil((new Date(date).getTime() - new Date(a.entryDate || date).getTime()) / (1000 * 3600 * 24)));
              totalStay += (days * daily);
            });
            const rev = mode === 'head' ? lotAns.length * val : lotAns.length * (avgW / 30) * val;
            const profit = rev - totalBuy - totalStay;
            updateActiveFarmData(d => ({
              ...d,
              animals: d.animals.map(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE ? { ...a, status: AnimalStatus.SOLD, weightKg: avgW } : a),
              transactions: [
                ...d.transactions,
                { id: `ls-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, date, description: `Venda Lote: ${lot?.name} (Lucro: R$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, amount: rev, type: TransactionType.INCOME, category: 'Vendas' },
                { id: `lm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, date, description: `Custo Estadia Lote: ${lot?.name}`, amount: totalStay, type: TransactionType.EXPENSE, category: 'Produção' }
              ]
            }));
          }}
          onBatchWeighLot={(lotId, date, newAvgWeight, gmd, applyMode) => {
            updateActiveFarmData(d => {
              const lotAnimals = d.animals.filter(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE);
              if (lotAnimals.length === 0) return d;
              const prevAvg = lotAnimals.reduce((acc, a) => acc + (a.weightKg || 0), 0) / lotAnimals.length;
              const deltaGain = newAvgWeight - prevAvg;

              const updatedAnimals = d.animals.map(a => {
                if (a.lotId !== lotId || a.status !== AnimalStatus.ACTIVE) return a;
                const newWeight = applyMode === 'gain_delta'
                  ? Math.max(1, Number(((a.weightKg || 0) + deltaGain).toFixed(2)))
                  : newAvgWeight;
                const newHistory = [...(a.history || []), { date, weightKg: newWeight, gmd }];
                return {
                  ...a,
                  weightKg: newWeight,
                  gmd,
                  lastWeighingDate: date,
                  history: newHistory
                };
              });

              const lotRecord = {
                id: `lot-w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                date,
                avgWeightKg: newAvgWeight,
                avgArroba: Number((newAvgWeight / 30).toFixed(2)),
                gmd,
                headCount: lotAnimals.length,
                notes: `Pesagem do lote (${lotAnimals.length} cab.)`
              };

              const updatedLots = d.lots.map(l => {
                if (l.id !== lotId) return l;
                return {
                  ...l,
                  averageGmd: gmd,
                  lastWeighingDate: date,
                  lastRecordedAvgWeightKg: newAvgWeight,
                  history: [...(l.history || []), lotRecord]
                };
              });

              return { ...d, animals: updatedAnimals, lots: updatedLots };
            });
          }}
          savedDailyCost={farmData.globalDailyCost} 
        />
      );
      case 'health': return <HealthManager animals={farmData.animals} healthRecords={farmData.healthRecords} onAddRecord={r => updateActiveFarmData(d => ({ ...d, healthRecords: [...d.healthRecords, r] }))} onUpdateRecord={r => updateActiveFarmData(d => ({ ...d, healthRecords: d.healthRecords.map(old => old.id === r.id ? r : old) }))} />;
      case 'tasks': return <TaskManager tasks={farmData.tasks} onAddTask={t => updateActiveFarmData(d => ({ ...d, tasks: [...d.tasks, t] }))} onUpdateTask={t => updateActiveFarmData(d => ({ ...d, tasks: d.tasks.map(old => old.id === t.id ? t : old) }))} onDeleteTask={id => updateActiveFarmData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }))} />;
      case 'lots': return (
        <LotManager 
          lots={farmData.lots} 
          animals={farmData.animals} 
          onAddLot={l => updateActiveFarmData(d => ({ ...d, lots: [...d.lots, l] }))} 
          onUpdateLot={l => updateActiveFarmData(d => ({ ...d, lots: d.lots.map(old => old.id === l.id ? l : old) }))} 
          onDeleteLot={id => updateActiveFarmData(d => ({
            ...d,
            lots: d.lots.filter(l => l.id !== id),
            animals: d.animals.map(a => a.lotId === id ? { ...a, lotId: '' } : a)
          }))} 
          onBatchWeighLot={(lotId, date, newAvgWeight, gmd, applyMode) => {
            updateActiveFarmData(d => {
              const lotAnimals = d.animals.filter(a => a.lotId === lotId && a.status === AnimalStatus.ACTIVE);
              if (lotAnimals.length === 0) return d;
              const prevAvg = lotAnimals.reduce((acc, a) => acc + (a.weightKg || 0), 0) / lotAnimals.length;
              const deltaGain = newAvgWeight - prevAvg;

              const updatedAnimals = d.animals.map(a => {
                if (a.lotId !== lotId || a.status !== AnimalStatus.ACTIVE) return a;
                const newWeight = applyMode === 'gain_delta'
                  ? Math.max(1, Number(((a.weightKg || 0) + deltaGain).toFixed(2)))
                  : newAvgWeight;
                const newHistory = [...(a.history || []), { date, weightKg: newWeight, gmd }];
                return {
                  ...a,
                  weightKg: newWeight,
                  gmd,
                  lastWeighingDate: date,
                  history: newHistory
                };
              });

              const lotRecord = {
                id: `lot-w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                date,
                avgWeightKg: newAvgWeight,
                avgArroba: Number((newAvgWeight / 30).toFixed(2)),
                gmd,
                headCount: lotAnimals.length,
                notes: `Pesagem do lote (${lotAnimals.length} cab.)`
              };

              const updatedLots = d.lots.map(l => {
                if (l.id !== lotId) return l;
                return {
                  ...l,
                  averageGmd: gmd,
                  lastWeighingDate: date,
                  lastRecordedAvgWeightKg: newAvgWeight,
                  history: [...(l.history || []), lotRecord]
                };
              });

              return { ...d, animals: updatedAnimals, lots: updatedLots };
            });
          }}
          onSellLot={(id, date, total) => alert('Utilize a venda por lote no Rebanho para cálculo de lucro')} 
        />
      );
      case 'inventory': return (
        <InventoryManager 
          inventory={farmData.inventory} 
          lots={farmData.lots}
          onAddStock={(item, financialExpense) => updateActiveFarmData(d => {
            const newTransactions = [...d.transactions];
            if (financialExpense && financialExpense.amount > 0) {
              newTransactions.push({
                id: `exp-inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                date: financialExpense.date || new Date().toISOString().split('T')[0],
                description: financialExpense.description || `Compra de Estoque: ${item.name} (${item.quantity} ${item.unit})`,
                amount: financialExpense.amount,
                type: TransactionType.EXPENSE,
                category: financialExpense.category || (item.category === 'Medicamento' ? 'Sanidade' : item.category === 'Ração' || item.category === 'Suplemento' ? 'Nutrição' : 'Insumos/Estoque')
              });
            }
            return {
              ...d,
              inventory: [...d.inventory, item],
              transactions: newTransactions
            };
          })} 
          onUpdateStock={(item, financialExpense) => updateActiveFarmData(d => {
            const newTransactions = [...d.transactions];
            if (financialExpense && financialExpense.amount > 0) {
              newTransactions.push({
                id: `exp-inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                date: financialExpense.date || new Date().toISOString().split('T')[0],
                description: financialExpense.description || `Compra de Estoque: ${item.name}`,
                amount: financialExpense.amount,
                type: TransactionType.EXPENSE,
                category: financialExpense.category || (item.category === 'Medicamento' ? 'Sanidade' : item.category === 'Ração' || item.category === 'Suplemento' ? 'Nutrição' : 'Insumos/Estoque')
              });
            }
            return {
              ...d,
              inventory: d.inventory.map(old => old.id === item.id ? item : old),
              transactions: newTransactions
            };
          })}
          onConsumeStock={(itemId, consumedQuantity, details) => updateActiveFarmData(d => {
            const item = d.inventory.find(i => i.id === itemId);
            if (!item) return d;
            const newQty = Math.max(0, Number((item.quantity - consumedQuantity).toFixed(2)));
            const movement: StockMovement = {
              id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              date: details?.date || new Date().toISOString().split('T')[0],
              type: 'consumo',
              quantity: consumedQuantity,
              unitCost: item.unitCost,
              totalCost: Number((consumedQuantity * item.unitCost).toFixed(2)),
              notes: details?.notes || 'Consumo operacional',
              lotId: details?.lotId,
              lotName: d.lots.find(l => l.id === details?.lotId)?.name
            };
            const updatedItem: InventoryItem = {
              ...item,
              quantity: newQty,
              history: [movement, ...(item.history || [])]
            };
            return {
              ...d,
              inventory: d.inventory.map(i => i.id === itemId ? updatedItem : i)
            };
          })}
          onDeleteStock={id => updateActiveFarmData(d => ({
            ...d,
            inventory: d.inventory.filter(i => i.id !== id)
          }))}
          onChangeView={setCurrentView}
        />
      );
      case 'finance': return <FinanceManager transactions={farmData.transactions} onAddTransaction={t => updateActiveFarmData(d => ({ ...d, transactions: [...d.transactions, t] }))} />;
      case 'market':
        return (
          <MarketMonitor 
            onNavigateToCalculators={() => setCurrentView('tools')} 
            onApplyPriceToCalculator={(sellPrice) => {
              updateActiveFarmData(d => ({
                ...d,
                calculatorConfig: {
                  ...d.calculatorConfig,
                  predSellPrice: sellPrice,
                  predBuyPrice: d.calculatorConfig?.predBuyPrice || 250,
                  rentCost: d.calculatorConfig?.rentCost || 0,
                  suppCostMonthly: d.calculatorConfig?.suppCostMonthly || 0,
                  extraCostMonthly: d.calculatorConfig?.extraCostMonthly || 0,
                  totalAnimalsDaily: d.calculatorConfig?.totalAnimalsDaily || 50,
                  gmdDailyVal: d.calculatorConfig?.gmdDailyVal || 0,
                  ingredients: d.calculatorConfig?.ingredients || [],
                  avgLotWeight: d.calculatorConfig?.avgLotWeight || 0,
                  numAnimals: d.calculatorConfig?.numAnimals || 50,
                  pvPercent: d.calculatorConfig?.pvPercent || 0
                }
              }));
              setCurrentView('tools');
            }}
          />
        );
      case 'consultant':
        return (
          <AiConsultant 
            farmData={farmData} 
            farmName={activeFarm?.name || "Sua Fazenda"} 
          />
        );
      case 'valor_diario':
      case 'suplementacao':
      case 'tools':
        return (
          <ToolsCalculator 
            initialTab={currentView === 'suplementacao' ? 'diet' : currentView === 'valor_diario' ? 'daily_value' : 'prediction'} 
            onSaveDailyCost={(cost, lId, config) => lId 
              ? updateActiveFarmData(d => ({ 
                  ...d, 
                  lots: d.lots.map(l => l.id === lId ? { ...l, dailyCost: cost, calculatorConfig: config } : l) 
                }))
              : updateActiveFarmData(d => ({ 
                  ...d, 
                  globalDailyCost: cost,
                  calculatorConfig: config
                }))
            } 
            lots={farmData.lots} 
            initialConfig={farmData.calculatorConfig}
          />
        );
      default: return <Dashboard animals={farmData.animals} transactions={farmData.transactions} inventory={farmData.inventory} healthRecords={farmData.healthRecords} lots={farmData.lots} onChangeView={setCurrentView} currentUser={user} />;
    }
  };

  if (!user) {
    return (
      <>
        <Login onLogin={setUser} />
        <ResetPasswordModal 
          isOpen={isResetPasswordOpen} 
          onClose={() => setIsResetPasswordOpen(false)} 
        />
      </>
    );
  }

  return (
    <Layout 
      currentView={currentView} 
      onChangeView={setCurrentView} 
      onLogout={handleLogout} 
      user={user} 
      animals={farmData.animals} 
      inventory={farmData.inventory} 
      healthRecords={farmData.healthRecords} 
      tasks={farmData.tasks}
      farms={farms}
      activeFarmId={activeFarmId}
      onSelectFarm={handleSelectFarm}
      onDeleteFarm={handleDeleteFarm}
      onCreateFarm={() => setIsCreatingFarm(true)}
      onOpenResetPassword={() => setIsResetPasswordOpen(true)}
    >
      <ResetPasswordModal 
        isOpen={isResetPasswordOpen} 
        onClose={() => setIsResetPasswordOpen(false)} 
      />
      {isSyncing && (
        <div className="fixed bottom-4 right-4 bg-[#145C46] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-md z-50 animate-pulse flex items-center gap-2">
          <Database size={14} />
          <span>Salvando no banco...</span>
        </div>
      )}
      {syncError && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-rose-600 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{syncError}</span>
          </div>
          <button
            type="button"
            onClick={() => flushPendingSync()}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-semibold shrink-0 cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}
      {!isLoaded && (
        <div className="fixed inset-0 bg-white/75 backdrop-blur-xs z-50 flex items-center justify-center text-sm font-medium text-[#20332C]">
          Carregando seus dados do banco...
        </div>
      )}
      {isLoaded && dbError && (
        <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Erro de conexão com o banco de dados</p>
              <p className="text-xs text-rose-700 mt-0.5">{dbError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => user && fetchFarmsFromDatabase(user)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            <RefreshCw size={14} />
            <span>Recarregar Dados</span>
          </button>
        </div>
      )}
      
      {showWelcome && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-xs p-3.5 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-[#E3EAE6] p-6 sm:p-8 shadow-xl space-y-6 animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-[#E3EAE6] pb-4">
              <h3 className="text-2xl font-semibold leading-snug text-[#145C46]">Bem-vindo!</h3>
              <button onClick={closeWelcome} className="p-2 text-[#64766C] hover:text-[#20332C] hover:bg-[#F6F8F5] rounded-xl cursor-pointer transition-colors"><X size={20} /></button>
            </div>
            
            <div className="space-y-6 text-[#20332C]">
              <p className="text-base font-medium leading-relaxed">
                Seja bem-vindo ao APP Gestão Pecuária! <br/>
                Aqui, sua gestão e sua pecuária saem do amadorismo e alcançam um novo nível de organização e controle.
              </p>
              
              <div className="space-y-3.5">
                <p className="text-xs font-semibold leading-snug text-[#145C46]">Para começar:</p>
                
                <div className="grid gap-3">
                  {[
                    { step: "1", text: 'Crie sua(s) fazenda(s) clicando em "Unidade selecionada", no canto superior esquerdo.' },
                    { step: "2", text: 'Cadastre seus piquetes em "Gestão de Piquetes".' },
                    { step: "3", text: 'Defina o valor da diária dos seus lotes em "Valor da Diária".' },
                    { step: "4", text: 'Cadastre e gerencie seus animais e o financeiro de forma prática e organizada.' },
                    { step: "5", text: 'Bom proveito!' }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3.5 p-3.5 bg-[#F6F8F5] rounded-xl border border-[#E3EAE6]">
                      <span className="flex-shrink-0 w-7 h-7 bg-[#145C46] text-white rounded-full flex items-center justify-center font-semibold text-xs">{item.step}</span>
                      <p className="text-sm font-normal leading-normal text-[#20332C] pt-0.5">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E3EAE6] space-y-2.5">
                <p className="text-xs font-medium leading-snug text-[#64766C]">Dicas, reclamações ou sugestões:</p>
                <a href="https://instagram.com.br/vivendoapecuaria" target="_blank" rel="noopener noreferrer" className="text-[#145C46] font-semibold hover:underline flex items-center gap-2 text-sm break-all">
                  instagram.com.br/vivendoapecuaria
                </a>
                <a 
                  href="https://chat.whatsapp.com/HVA8xmp93HYJeCWQRs1g8x" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 text-sm font-semibold leading-snug text-[#145C46] bg-[#DCEDE4]/60 hover:bg-[#DCEDE4] border border-[#145C46]/25 px-3.5 py-2 rounded-xl transition-all"
                >
                  <svg 
                    className="w-4 h-4 fill-[#25D366] shrink-0" 
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="WhatsApp"
                  >
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8.01 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 13.99C16.32 13.86 15.12 13.27 14.9 13.19C14.68 13.1 14.52 13.06 14.36 13.3C14.19 13.55 13.73 14.11 13.59 14.27C13.45 14.44 13.31 14.46 13.07 14.34C12.82 14.21 11.79 13.88 10.57 12.79C9.62 11.94 8.98 10.89 8.85 10.65C8.73 10.4 8.83 10.28 8.96 10.15C9.07 10.04 9.21 9.85 9.33 9.71C9.46 9.57 9.5 9.47 9.58 9.31C9.66 9.14 9.62 9 9.56 8.88C9.5 8.76 9.03 7.6 8.84 7.13C8.65 6.67 8.46 6.73 8.31 6.72C8.18 6.72 8.02 6.72 7.87 6.72L8.53 7.33Z" />
                  </svg>
                  <span>Acessa Comunidade</span>
                </a>
              </div>
            </div>

            <button 
              onClick={closeWelcome}
              className="w-full bg-[#145C46] hover:bg-[#0E4434] text-white py-3.5 rounded-xl text-sm font-semibold leading-snug shadow-xs active:scale-[0.99] transition-all mt-2 cursor-pointer"
            >
              Entendi, vamos começar!
            </button>
          </div>
        </div>
      )}

      {isCreatingFarm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-3.5 sm:p-4">
           <div className="bg-white w-full max-w-md rounded-2xl border border-[#E3EAE6] p-6 sm:p-8 shadow-xl space-y-5 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center border-b border-[#E3EAE6] pb-4">
                 <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Nova Unidade</h3>
                 <button onClick={() => setIsCreatingFarm(false)} className="p-2 text-[#64766C] hover:text-[#20332C] hover:bg-[#F6F8F5] rounded-xl cursor-pointer transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateFarm} className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">Nome da Fazenda</label>
                    <input type="text" className="w-full border border-[#E3EAE6] rounded-xl px-4 py-3 text-sm font-normal leading-normal text-[#20332C] bg-[#F6F8F5] focus:bg-white focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] outline-none transition-all" value={newFarmName} onChange={e => setNewFarmName(e.target.value)} required autoFocus />
                 </div>
                 <button type="submit" className="w-full bg-[#145C46] hover:bg-[#0E4434] text-white py-3 rounded-xl text-sm font-semibold leading-snug shadow-xs active:scale-[0.99] transition-all cursor-pointer">Cadastrar e Abrir</button>
              </form>
           </div>
        </div>
      )}

      {renderContent()}
    </Layout>
  );
};

export default App;
