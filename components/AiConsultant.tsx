import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  FileText, 
  Send, 
  RefreshCcw, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Lightbulb, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Beef, 
  DollarSign, 
  Warehouse, 
  Layers,
  HeartPulse,
  CornerDownLeft,
  ChevronRight
} from 'lucide-react';
import { FarmData } from '../types';
import { fetchConsultantReport, sendConsultantChatMessage } from '../services/geminiService';

interface AiConsultantProps {
  farmData: FarmData;
  farmName?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const AiConsultant: React.FC<AiConsultantProps> = ({ farmData, farmName = "Sua Fazenda" }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report');

  // Relatório State
  const [reportText, setReportText] = useState<string>('');
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Olá, parceiro! Sou o seu **Consultor Pecuário IA** na fazenda **${farmName}**. 🤠\n\nEstou aqui para te ajudar a tomar as melhores decisões para o seu negócio pecuário, sempre guiado por três pilares essenciais:\n\n1. **Lucro Líquido & Margem por Arroba**: Foco em custo de produção, GMD e rentabilidade real.\n2. **Bem-Estar Animal**: Manejo calmo, água limpa, sombra e saúde no pasto e curral.\n3. **Realidade do Campo**: Sem invenções teóricas. Soluções práticas adaptadas ao dia a dia da roça.\n\nComo posso te ajudar hoje na sua propriedade?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll no chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, isSendingChat]);

  // Handler para gerar relatório
  const handleGenerateReport = async () => {
    setIsLoadingReport(true);
    setCopiedReport(false);
    try {
      const text = await fetchConsultantReport(farmData, farmName);
      setReportText(text);
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
      setReportText("Ocorreu um erro ao gerar o relatório diagnóstico. Tente novamente em instantes.");
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Gerar relatório inicial se estiver vazio ao entrar na aba
  useEffect(() => {
    if (activeTab === 'report' && !reportText && !isLoadingReport) {
      handleGenerateReport();
    }
  }, [activeTab]);

  const handleCopyReport = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // Handler do Chat
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    if (!customPrompt) setInputMessage('');
    setIsSendingChat(true);

    try {
      const formattedHistory = newHistory.map(m => ({ role: m.role, content: m.content }));
      const responseText = await sendConsultantChatMessage(textToSend, formattedHistory, farmData, farmName);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Erro no chat:", err);
      setChatMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: 'assistant',
          content: 'Desculpe, tive uma oscilação na conexão com a IA. Pode repetir sua dúvida?',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Métricas rápidas da fazenda para o header
  const activeAnimalsCount = farmData.animals.filter(a => a.status === 'Ativo').length;
  const totalIncome = farmData.transactions.filter(t => t.type === 'Receita').reduce((a, b) => a + Number(b.amount || 0), 0);
  const totalExpense = farmData.transactions.filter(t => t.type === 'Despesa').reduce((a, b) => a + Number(b.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const quickQuestions = [
    "Como reduzir o custo por arroba produzida na minha fazenda?",
    "Qual a melhor estratégia de suplementação na seca para o meu rebanho?",
    "Como melhorar o bem-estar animal no curral de manejo sem altos custos?",
    "Com base nas despesas atuais, como aumentar a margem de lucro líquido?"
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header do Consultor */}
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-950 rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest backdrop-blur-md">
              <Sparkles size={14} className="animate-pulse" /> Consultor Pecuário Sênior IA
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Análise Técnica & Inteligência Operacional
            </h2>
            <p className="text-sm text-green-100 font-medium leading-relaxed">
              Foco inegociável em <strong className="text-emerald-300">Lucro Líquido</strong> e <strong className="text-emerald-300">Bem-Estar Animal</strong>, entendendo perfeitamente as <strong className="text-emerald-300">dificuldades reais do campo</strong>.
            </p>
          </div>

          {/* Resumo da Fazenda em Cards compactos */}
          <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="text-center">
              <p className="text-[10px] font-bold text-green-300 uppercase tracking-wider">Rebanho</p>
              <p className="text-lg font-black text-white">{activeAnimalsCount} <span className="text-xs font-normal text-green-200">cab</span></p>
            </div>
            <div className="text-center border-x border-white/10 px-2">
              <p className="text-[10px] font-bold text-green-300 uppercase tracking-wider">Saldo Geral</p>
              <p className={`text-sm md:text-base font-black ${balance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-green-300 uppercase tracking-wider">Lotes</p>
              <p className="text-lg font-black text-white">{farmData.lots.length}</p>
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="mt-8 flex items-center gap-3 border-t border-green-700/50 pt-6">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'report'
                ? 'bg-white text-green-900 shadow-lg scale-105 font-black'
                : 'bg-green-800/60 text-green-200 hover:bg-green-800 hover:text-white'
            }`}
          >
            <FileText size={16} /> Relatório IA (Diagnóstico da Fazenda)
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-green-900 shadow-lg scale-105 font-black'
                : 'bg-green-800/60 text-green-200 hover:bg-green-800 hover:text-white'
            }`}
          >
            <MessageSquare size={16} /> Chat com Consultor IA
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: RELATÓRIO IA */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="text-green-600" size={20} />
                Diagnóstico Geral de Desempenho
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Leitura completa dos dados de rebanho, lotes, finanças, estoque e tratamentos de <strong className="text-gray-700">{farmName}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {reportText && (
                <button
                  onClick={handleCopyReport}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {copiedReport ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  {copiedReport ? 'Copiado!' : 'Copiar Texto'}
                </button>
              )}

              <button
                onClick={handleGenerateReport}
                disabled={isLoadingReport}
                className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <RefreshCcw size={16} className={isLoadingReport ? 'animate-spin' : ''} />
                {isLoadingReport ? 'Analisando...' : 'Atualizar Diagnóstico'}
              </button>
            </div>
          </div>

          {isLoadingReport ? (
            <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-gray-100 text-center space-y-4">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Sparkles size={32} className="animate-spin" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-base font-black text-gray-900">O Consultor IA está auditando a sua fazenda...</h4>
                <p className="text-xs text-gray-500 font-medium">
                  Cruzando peso médio dos animais, histórico de GMD, saldo financeiro, custos diários e insumos em estoque.
                </p>
              </div>
            </div>
          ) : reportText ? (
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="prose prose-green max-w-none text-gray-800 leading-relaxed text-sm">
                {/* Formatação estilizada do Markdown recebido da IA */}
                {reportText.split('### ').map((section, idx) => {
                  if (!section.trim()) return null;
                  const lines = section.split('\n');
                  const title = lines[0];
                  const body = lines.slice(1).join('\n');

                  let cardStyle = "bg-gray-50 border-gray-200 text-gray-800";
                  let titleColor = "text-gray-900";

                  if (title.includes("Pontos Positivos")) {
                    cardStyle = "bg-emerald-50/70 border-emerald-200/80 text-emerald-950";
                    titleColor = "text-emerald-900";
                  } else if (title.includes("Pontos Negativos")) {
                    cardStyle = "bg-red-50/70 border-red-200/80 text-red-950";
                    titleColor = "text-red-900";
                  } else if (title.includes("Gargalos")) {
                    cardStyle = "bg-amber-50/70 border-amber-200/80 text-amber-950";
                    titleColor = "text-amber-900";
                  } else if (title.includes("Preocupações")) {
                    cardStyle = "bg-blue-50/70 border-blue-200/80 text-blue-950";
                    titleColor = "text-blue-900";
                  } else if (title.includes("Plano de Ação") || title.includes("Como Melhorar")) {
                    cardStyle = "bg-gradient-to-br from-green-900 to-emerald-900 border-green-700 text-white shadow-lg";
                    titleColor = "text-emerald-300";
                  }

                  return (
                    <div key={idx} className={`p-6 rounded-2xl border ${cardStyle} transition-all space-y-3`}>
                      <h3 className={`text-base font-black tracking-tight flex items-center gap-2 ${titleColor}`}>
                        {title}
                      </h3>
                      <div className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-line">
                        {body}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-gray-100 text-center space-y-4">
              <Bot size={48} className="text-green-300 mx-auto" />
              <p className="text-sm font-bold text-gray-600">Clique em "Atualizar Diagnóstico" para ler os dados da sua fazenda.</p>
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: CHAT IA */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px]">
          {/* Header do Chat */}
          <div className="p-4 md:p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-700 text-white flex items-center justify-center font-bold shadow-sm">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Consultor Pecuário IA</h3>
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Online para orientar a fazenda {farmName}
                </p>
              </div>
            </div>

            <button
              onClick={() => setChatMessages([
                {
                  id: `welcome-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  role: 'assistant',
                  content: `Nova conversa iniciada. Em que posso ajudar a melhorar a operação ou rentabilidade de **${farmName}**?`,
                  timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                }
              ])}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold transition-colors flex items-center gap-1"
              title="Reiniciar Conversa"
            >
              <RefreshCcw size={14} /> Limpar Conversa
            </button>
          </div>

          {/* Histórico do Chat */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 custom-scrollbar bg-gray-50/50">
            {chatMessages.map((msg, idx) => (
              <div
                key={`${msg.id}-${idx}`}
                className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                    msg.role === 'user' ? 'bg-green-800' : 'bg-emerald-600'
                  }`}
                >
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed space-y-1 ${
                    msg.role === 'user'
                      ? 'bg-green-800 text-white font-medium rounded-tr-none'
                      : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-none font-normal'
                  }`}
                >
                  <div className="whitespace-pre-line font-medium">{msg.content}</div>
                  <p className={`text-[10px] text-right ${msg.role === 'user' ? 'text-green-200' : 'text-gray-400'}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {isSendingChat && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 font-bold text-gray-600">Consultor calculando recomendação...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Dúvidas Rápidas */}
          <div className="px-4 py-2 bg-white border-t border-gray-100 overflow-x-auto custom-scrollbar flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Lightbulb size={12} className="text-amber-500" /> Dúvidas Frequentes:
            </span>
            {quickQuestions.map((q, i) => (
              <button
                key={`quick-${i}-${q.slice(0, 15)}`}
                onClick={() => handleSendMessage(q)}
                disabled={isSendingChat}
                className="bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-800 border border-gray-200 hover:border-green-300 px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input de Envio */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pergunte ao Consultor sobre manejo, nutrição, custos, sanidade..."
                disabled={isSendingChat}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSendingChat}
                className="bg-green-700 hover:bg-green-800 text-white p-3 rounded-2xl shadow-md transition-all disabled:opacity-40 cursor-pointer active:scale-95 shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiConsultant;
