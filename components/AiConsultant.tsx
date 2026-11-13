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
    <div className="space-y-6 pb-12 font-sans">
      {/* Header do Consultor */}
      <div className="agro-card p-6 md:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#DCEDE4] text-[#145C46] px-3 py-1 rounded-md text-xs font-medium">
              <Sparkles size={14} /> Consultor Pecuário Sênior IA
            </div>
            <h2 className="text-2xl font-semibold text-[#20332C] leading-snug">
              Análise Técnica & Inteligência Operacional
            </h2>
            <p className="text-sm text-[#64766C] font-normal leading-relaxed">
              Foco inegociável em <strong className="font-semibold text-[#20332C]">Lucro Líquido</strong> e <strong className="font-semibold text-[#20332C]">Bem-Estar Animal</strong>, entendendo perfeitamente as <strong className="font-semibold text-[#20332C]">dificuldades reais do campo</strong>.
            </p>
          </div>

          {/* Resumo da Fazenda em Cards compactos */}
          <div className="grid grid-cols-3 gap-4 bg-[#F6F8F5] p-4 rounded-xl border border-[#E3EAE6] shrink-0">
            <div className="text-center px-2">
              <p className="text-xs font-medium text-[#64766C]">Rebanho</p>
              <p className="text-xl font-semibold text-[#20332C] font-nums mt-0.5">{activeAnimalsCount}<span className="text-xs font-normal text-[#64766C] ml-1">cab</span></p>
            </div>
            <div className="text-center border-x border-[#E3EAE6] px-4">
              <p className="text-xs font-medium text-[#64766C]">Saldo geral</p>
              <p className={`text-lg font-semibold font-nums mt-0.5 ${balance >= 0 ? 'text-[#145C46]' : 'text-rose-600'}`}>
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-center px-2">
              <p className="text-xs font-medium text-[#64766C]">Lotes</p>
              <p className="text-xl font-semibold text-[#20332C] font-nums mt-0.5">{farmData.lots.length}</p>
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex flex-wrap items-center gap-2.5 border-t border-[#E3EAE6] pt-5">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
              activeTab === 'report'
                ? 'bg-[#145C46] text-white shadow-xs'
                : 'bg-[#F6F8F5] text-[#64766C] hover:bg-[#E5F2EB] hover:text-[#145C46] border border-[#E3EAE6]'
            }`}
          >
            <FileText size={16} /> Relatório IA (Diagnóstico da Fazenda)
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[#145C46] text-white shadow-xs'
                : 'bg-[#F6F8F5] text-[#64766C] hover:bg-[#E5F2EB] hover:text-[#145C46] border border-[#E3EAE6]'
            }`}
          >
            <MessageSquare size={16} /> Chat com Consultor IA
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: RELATÓRIO IA */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="agro-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#20332C] leading-snug flex items-center gap-2">
                <FileText className="text-[#145C46]" size={20} />
                Diagnóstico Geral de Desempenho
              </h3>
              <p className="text-[13px] text-[#64766C] font-normal leading-normal mt-1">
                Leitura completa dos dados de rebanho, lotes, finanças, estoque e tratamentos de <strong className="font-semibold text-[#20332C]">{farmName}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {reportText && (
                <button
                  onClick={handleCopyReport}
                  className="bg-white hover:bg-[#E5F2EB] border border-[#E3EAE6] text-[#20332C] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {copiedReport ? <Check size={16} className="text-[#145C46]" /> : <Copy size={16} />}
                  {copiedReport ? 'Copiado!' : 'Copiar Texto'}
                </button>
              )}

              <button
                onClick={handleGenerateReport}
                disabled={isLoadingReport}
                className="bg-[#145C46] hover:bg-[#0E4434] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <RefreshCcw size={16} className={isLoadingReport ? 'animate-spin' : ''} />
                {isLoadingReport ? 'Analisando...' : 'Atualizar Diagnóstico'}
              </button>
            </div>
          </div>

          {isLoadingReport ? (
            <div className="agro-card p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-[#DCEDE4] text-[#145C46] rounded-full flex items-center justify-center mx-auto">
                <Sparkles size={28} className="animate-spin" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="text-base font-semibold text-[#20332C]">O Consultor IA está auditando a sua fazenda...</h4>
                <p className="text-[13px] text-[#64766C] font-normal leading-relaxed">
                  Cruzando peso médio dos animais, histórico de GMD, saldo financeiro, custos diários e insumos em estoque.
                </p>
              </div>
            </div>
          ) : reportText ? (
            <div className="agro-card p-6 md:p-8 space-y-5">
              <div className="space-y-4 text-[#20332C] leading-relaxed text-sm">
                {/* Formatação estilizada do Markdown recebido da IA */}
                {reportText.split('### ').map((section, idx) => {
                  if (!section.trim()) return null;
                  const lines = section.split('\n');
                  const title = lines[0];
                  const body = lines.slice(1).join('\n');

                  let cardStyle = "bg-[#F6F8F5] border-[#E3EAE6] text-[#20332C]";
                  let titleColor = "text-[#20332C]";

                  if (title.includes("Pontos Positivos")) {
                    cardStyle = "bg-[#DCEDE4]/50 border-[#DCEDE4] text-[#20332C]";
                    titleColor = "text-[#145C46]";
                  } else if (title.includes("Pontos Negativos")) {
                    cardStyle = "bg-rose-50/70 border-rose-200 text-rose-950";
                    titleColor = "text-rose-800";
                  } else if (title.includes("Gargalos")) {
                    cardStyle = "bg-amber-50/70 border-amber-200 text-amber-950";
                    titleColor = "text-amber-800";
                  } else if (title.includes("Preocupações")) {
                    cardStyle = "bg-sky-50/70 border-sky-200 text-sky-950";
                    titleColor = "text-sky-800";
                  } else if (title.includes("Plano de Ação") || title.includes("Como Melhorar")) {
                    cardStyle = "bg-[#DCEDE4]/80 border-[#218568]/40 text-[#20332C]";
                    titleColor = "text-[#145C46]";
                  }

                  return (
                    <div key={idx} className={`p-5 rounded-xl border ${cardStyle} transition-all space-y-2.5`}>
                      <h3 className={`text-base font-semibold leading-snug flex items-center gap-2 ${titleColor}`}>
                        {title}
                      </h3>
                      <div className="text-sm font-normal leading-relaxed whitespace-pre-line">
                        {body}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="agro-card p-12 text-center space-y-3">
              <Bot size={44} className="text-[#218568] mx-auto" />
              <p className="text-sm font-medium text-[#64766C]">Clique em "Atualizar Diagnóstico" para ler os dados da sua fazenda.</p>
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: CHAT IA */}
      {activeTab === 'chat' && (
        <div className="agro-card overflow-hidden flex flex-col h-[650px]">
          {/* Header do Chat */}
          <div className="p-4 md:p-5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#145C46] text-white flex items-center justify-center shadow-xs">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#20332C] leading-snug">Consultor Pecuário IA</h3>
                <p className="text-xs font-normal text-[#145C46] flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#218568]"></span> Online para orientar a fazenda {farmName}
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
              className="text-[#64766C] hover:text-[#20332C] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reiniciar Conversa"
            >
              <RefreshCcw size={14} /> Limpar conversa
            </button>
          </div>

          {/* Histórico do Chat */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 custom-scrollbar bg-[#F6F8F5]/40">
            {chatMessages.map((msg, idx) => (
              <div
                key={`${msg.id}-${idx}`}
                className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-semibold text-xs ${
                    msg.role === 'user' ? 'bg-[#145C46]' : 'bg-[#218568]'
                  }`}
                >
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div
                  className={`p-4 rounded-xl text-sm leading-relaxed space-y-1.5 ${
                    msg.role === 'user'
                      ? 'bg-[#145C46] text-white font-normal rounded-tr-none'
                      : 'bg-white border border-[#E3EAE6] text-[#20332C] shadow-2xs rounded-tl-none font-normal'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>
                  <p className={`text-xs text-right font-nums ${msg.role === 'user' ? 'text-[#DCEDE4]' : 'text-[#64766C]'}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {isSendingChat && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#218568] text-white flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-[#E3EAE6] p-4 rounded-xl rounded-tl-none shadow-2xs flex items-center gap-2 text-xs text-[#64766C]">
                  <span className="w-2 h-2 rounded-full bg-[#218568] animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-[#218568] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#218568] animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 font-medium text-[#20332C]">Consultor calculando recomendação...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Dúvidas Rápidas */}
          <div className="px-4 py-2.5 bg-white border-t border-[#E3EAE6] overflow-x-auto custom-scrollbar flex items-center gap-2">
            <span className="text-xs font-medium text-[#64766C] shrink-0 flex items-center gap-1">
              <Lightbulb size={13} className="text-amber-500" /> Dúvidas frequentes:
            </span>
            {quickQuestions.map((q, i) => (
              <button
                key={`quick-${i}-${q.slice(0, 15)}`}
                onClick={() => handleSendMessage(q)}
                disabled={isSendingChat}
                className="bg-[#F6F8F5] hover:bg-[#E5F2EB] text-[#20332C] hover:text-[#145C46] border border-[#E3EAE6] px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input de Envio */}
          <div className="p-4 bg-white border-t border-[#E3EAE6]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2.5"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pergunte ao Consultor sobre manejo, nutrição, custos, sanidade..."
                disabled={isSendingChat}
                className="flex-1 bg-[#F6F8F5] border border-[#E3EAE6] rounded-lg px-4 py-2.5 text-sm font-normal text-[#20332C] focus:outline-none focus:ring-2 focus:ring-[#145C46] focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSendingChat}
                className="bg-[#145C46] hover:bg-[#0E4434] text-white p-2.5 rounded-lg shadow-xs transition-all disabled:opacity-40 cursor-pointer active:scale-95 shrink-0"
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
