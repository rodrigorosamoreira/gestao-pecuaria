import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Beef, 
  RefreshCw, 
  Zap, 
  Bot, 
  DollarSign, 
  Lightbulb, 
  BookOpen, 
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Scale
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Animal, Transaction, InventoryItem, Lot, HealthRecord, Task } from '../types';

interface LivestockAgentProps {
  farmName?: string;
  animals?: Animal[];
  lots?: Lot[];
  inventory?: InventoryItem[];
  transactions?: Transaction[];
  healthRecords?: HealthRecord[];
  tasks?: Task[];
  calculatorConfig?: any;
  globalDailyCost?: number;
  onChangeView?: (view: string) => void;
}

export const LivestockAgent: React.FC<LivestockAgentProps> = ({
  farmName = 'Minha Fazenda',
  animals = [],
  lots = [],
  inventory = [],
  transactions = [],
  healthRecords = [],
  tasks = [],
  calculatorConfig,
  globalDailyCost = 0,
  onChangeView
}) => {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'chat'>('diagnosis');
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    {
      sender: 'agent',
      text: `Olá! Sou o seu **Agente IA Especialista em Pecuária**. Analisei os dados da fazenda **"${farmName}"** (${animals.length} cabeças, ${lots.length} lotes). Como posso te ajudar a tomar as melhores decisões hoje?`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Quick Stats calculated from real app data
  const activeAnimals = animals.filter(a => a.status === 'Ativo');
  const totalWeight = activeAnimals.reduce((acc, a) => acc + (Number(a.weightKg) || 0), 0);
  const avgWeight = activeAnimals.length > 0 ? totalWeight / activeAnimals.length : 0;
  const avgArrobas = (avgWeight / 30).toFixed(1);

  const lowStockCount = inventory.filter(i => Number(i.quantity) <= Number(i.minQuantity)).length;
  const criticalHealthCount = healthRecords.filter(r => r.status === 'Em Tratamento').length;

  const totalIncome = transactions
    .filter(t => t.type === 'Receita')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalExpense = transactions
    .filter(t => t.type === 'Despesa')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const runAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/ai/analyze-farm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmName,
          animals,
          lots,
          inventory,
          transactions,
          healthRecords,
          tasks,
          calculatorConfig,
          globalDailyCost
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao conectar com o serviço de IA no servidor.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setReport(data.analysis);
    } catch (err: any) {
      console.error('Erro ao chamar o Agente IA:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao gerar o diagnóstico. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Carregar análise inicial automaticamente se o relatório estiver vazio
    if (!report && !isLoading) {
      runAnalysis();
    }
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const question = textToSend || chatInput;
    if (!question.trim() || isChatLoading) return;

    const userTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...chatMessages, { sender: 'user' as const, text: question, time: userTime }];
    setChatMessages(newMessages);
    if (!textToSend) setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat-specialist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          farmContext: {
            farmName,
            totalActiveAnimals: activeAnimals.length,
            avgWeightKg: avgWeight.toFixed(1),
            avgArrobas,
            lotsCount: lots.length,
            globalDailyCost,
            netBalance,
            lowStockCount,
            criticalHealthCount
          }
        })
      });

      const data = await response.json();
      const agentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      setChatMessages([
        ...newMessages,
        {
          sender: 'agent',
          text: data.answer || 'Não consegui obter a resposta no momento.',
          time: agentTime
        }
      ]);
    } catch (err) {
      setChatMessages([
        ...newMessages,
        {
          sender: 'agent',
          text: 'Desculpe, ocorreu uma falha na comunicação. Tente enviar novamente.',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const quickQuestions = [
    "Como reduzir o custo da diária mantendo o GMD?",
    "Qual a meta ideal de peso para abate dos animais?",
    "Como identificar os animais 'fundo de lote' para descarte?",
    "Qual o momento mais lucrativo para comprar novos garrotes?"
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-green-800 to-teal-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-widest backdrop-blur-md">
              <Brain size={14} className="animate-pulse text-emerald-400" /> Consultoria Zootécnica de Alta Precisão
            </div>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Agente IA Especialista em Pecuária
            </h2>
            <p className="text-emerald-100/90 text-sm md:text-base font-medium leading-relaxed">
              Diagnosticando em tempo real todos os dados da unidade <strong className="text-white underline decoration-emerald-400 underline-offset-4">{farmName}</strong> para identificar gargalos, destacar pontos fortes e alavancar sua margem de lucro.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('diagnosis')}
              className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                activeTab === 'diagnosis'
                  ? 'bg-white text-emerald-950 shadow-white/10 scale-105'
                  : 'bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100'
              }`}
            >
              <BarChart3 size={16} /> Diagnóstico Executivo
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-emerald-950 shadow-white/10 scale-105'
                  : 'bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100'
              }`}
            >
              <Bot size={16} /> Chat Zootécnico
            </button>
          </div>
        </div>

        {/* Data Cards Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-emerald-700/50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">
              <Beef size={14} /> Rebanho Lançado
            </div>
            <p className="text-xl md:text-2xl font-black">{activeAnimals.length} <span className="text-xs font-bold opacity-75">cab.</span></p>
            <p className="text-[11px] text-emerald-200 mt-1 font-medium">Média: {avgWeight.toFixed(0)} kg ({avgArrobas} @)</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">
              <DollarSign size={14} /> Custo Diária Padrão
            </div>
            <p className="text-xl md:text-2xl font-black">R$ {Number(globalDailyCost).toFixed(2)}</p>
            <p className="text-[11px] text-emerald-200 mt-1 font-medium">{lots.length} Lotes configurados</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">
              <TrendingUp size={14} /> Resultado Líquido
            </div>
            <p className={`text-xl md:text-2xl font-black ${netBalance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-emerald-200 mt-1 font-medium">{transactions.length} Lançamentos financeiros</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">
              <ShieldAlert size={14} /> Nível de Atenção
            </div>
            <p className="text-xl md:text-2xl font-black">
              {lowStockCount + criticalHealthCount > 0 ? (
                <span className="text-amber-300">{lowStockCount + criticalHealthCount} Alertas</span>
              ) : (
                <span className="text-emerald-300">Saudável</span>
              )}
            </p>
            <p className="text-[11px] text-emerald-200 mt-1 font-medium">
              {lowStockCount} estoque baixo | {criticalHealthCount} saúde
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'diagnosis' ? (
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <Sparkles size={20} className="text-emerald-600" /> Diagnóstico da Fazenda & Recomendações
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Leitura cruzada de animais, ganho diário, finanças, compras e parâmetros do simulador.
              </p>
            </div>

            <button
              onClick={runAnalysis}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Processando Dados...
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Atualizar Análise
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 flex items-start gap-3 text-sm">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold">Falha ao gerar o diagnóstico</p>
                <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
                <button
                  onClick={runAnalysis}
                  className="mt-3 text-xs font-bold underline hover:text-red-900 cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 animate-bounce">
                <Brain size={32} />
              </div>
              <div>
                <h4 className="font-black text-gray-800 text-base uppercase tracking-wider">
                  O Agente Especialista está analisando a fazenda...
                </h4>
                <p className="text-xs text-gray-400 font-medium max-w-md mx-auto mt-1">
                  Cruzando dados de arrobas, ganho diário (GMD), finanças, consumo alimentar e diárias de confinamento/pasto.
                </p>
              </div>
            </div>
          ) : report ? (
            <div className="prose prose-emerald max-w-none text-gray-800 leading-relaxed space-y-4 font-sans bg-emerald-50/30 p-6 md:p-8 rounded-3xl border border-emerald-100/60 shadow-inner">
              <ReactMarkdown>{report}</ReactMarkdown>

              {/* Action Banner below report */}
              <div className="mt-8 pt-6 border-t border-emerald-200/60 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Lightbulb size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-800 text-sm">Ficou com alguma dúvida sobre as recomendações?</h5>
                    <p className="text-xs text-gray-500">Converse diretamente com o Agente Especialista para tirar dúvidas específicas.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="w-full md:w-auto bg-emerald-950 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Abrir Chat Tático <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 space-y-3">
              <Bot size={48} className="mx-auto text-gray-300" />
              <p className="font-bold text-gray-600 text-sm">Nenhuma análise gerada ainda.</p>
              <button
                onClick={runAnalysis}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all cursor-pointer"
              >
                Gerar Análise Agora
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Chat Tab */
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col h-[650px]">
          <div className="border-b border-gray-100 pb-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-sm uppercase tracking-tight">Chat com Consultor IA Pecuária</h3>
                <p className="text-xs text-gray-400 font-medium">Respondendo com contexto total dos seus lotes, finanças e animais.</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {farmName}
            </span>
          </div>

          {/* Quick Questions suggestion chips */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Perguntas Rápidas:</span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isChatLoading}
                className="shrink-0 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 text-gray-600 text-xs px-3 py-1.5 rounded-xl font-medium transition-all text-left cursor-pointer disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Stream Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50/60 rounded-3xl border border-gray-100 mb-4 custom-scrollbar">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm ${
                    msg.sender === 'user'
                      ? 'bg-emerald-700 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none prose prose-sm max-w-none'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 font-bold mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-white p-3 rounded-2xl w-fit border border-gray-100 animate-pulse">
                <Loader2 className="animate-spin" size={16} /> Especialista digitando...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Digite sua dúvida sobre manejo, nutrição, custos, preço da arroba..."
              disabled={isChatLoading}
              className="flex-1 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-2xl shadow-md disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LivestockAgent;
