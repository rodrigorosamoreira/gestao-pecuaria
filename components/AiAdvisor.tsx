import React, { useState } from 'react';
import { analyzeFarmStatus, getQuickAdvice } from '../services/geminiService';
import { Animal, Transaction } from '../types';
import { Sparkles, Send, Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AiAdvisorProps {
  animals: Animal[];
  transactions: Transaction[];
}

const AiAdvisor: React.FC<AiAdvisorProps> = ({ animals, transactions }) => {
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report');

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReport('');
    try {
      const result = await analyzeFarmStatus(animals, transactions);
      setReport(result);
    } catch (error) {
      setReport('Erro ao gerar relatório. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatLoading(true);
    try {
      const result = await getQuickAdvice(chatInput);
      setChatResponse(result);
    } catch (error) {
      setChatResponse('Erro ao processar sua pergunta.');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold leading-snug text-[#20332C] flex items-center gap-2">
            <Sparkles className="text-[#145C46]" size={22} /> Inteligência Artificial
          </h2>
          <p className="text-[#64766C] text-sm font-normal leading-normal mt-0.5">Use a inteligência artificial para analisar sua fazenda e tirar dúvidas técnicas.</p>
        </div>
        
        <div className="flex bg-[#F6F8F5] border border-[#E3EAE6] rounded-xl p-1">
          <button 
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold leading-snug transition-all ${activeTab === 'report' ? 'bg-[#145C46] shadow-2xs text-white' : 'text-[#64766C] hover:text-[#20332C]'}`}
          >
            Relatório Completo
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold leading-snug transition-all ${activeTab === 'chat' ? 'bg-[#145C46] shadow-2xs text-white' : 'text-[#64766C] hover:text-[#20332C]'}`}
          >
            Chat Técnico
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-2xs border border-[#E3EAE6] overflow-hidden flex flex-col">
        {activeTab === 'report' ? (
          <div className="p-6 flex flex-col h-full">
            <div className="mb-6 flex items-center justify-between border-b border-[#E3EAE6] pb-4">
              <div>
                <h3 className="text-base font-semibold leading-snug text-[#20332C]">Análise da Fazenda</h3>
                <p className="text-[13px] font-normal leading-normal text-[#64766C]">Cruza dados zootécnicos e financeiros para insights.</p>
              </div>
              <button 
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="bg-[#145C46] hover:bg-[#0E4434] text-white text-sm font-semibold leading-snug px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                {isLoading ? 'Analisando...' : 'Gerar Relatório'}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-[#F6F8F5] rounded-xl p-6 border border-[#E3EAE6] prose prose-sm max-w-none text-[#20332C]">
              {report ? (
                <ReactMarkdown>{report}</ReactMarkdown>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#64766C]">
                  <Sparkles size={40} className="mb-3 opacity-35 text-[#145C46]" />
                  <p className="text-sm font-normal">Clique em "Gerar Relatório" para receber uma análise completa.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {chatResponse ? (
                <div className="bg-[#DCEDE4]/50 p-4 rounded-xl border border-[#145C46]/20">
                  <p className="font-semibold text-[#145C46] text-sm leading-snug mb-2">Resposta do Assistente:</p>
                  <div className="text-[#20332C] text-sm font-normal whitespace-pre-line leading-relaxed">
                    <ReactMarkdown>{chatResponse}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#64766C]">
                   <p className="text-center max-w-md text-sm font-normal leading-normal">Pergunte sobre manejo, vacinação, nutrição ou qualquer dúvida técnica sobre pecuária.</p>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ex: Qual a melhor época para vacinação de aftosa?"
                className="w-full border border-[#E3EAE6] bg-[#F6F8F5] focus:bg-white rounded-xl pl-4 pr-12 py-3 text-sm font-normal leading-normal text-[#20332C] focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] outline-none"
                disabled={chatLoading}
              />
              <button 
                type="submit" 
                disabled={chatLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[#145C46] text-white rounded-lg hover:bg-[#0E4434] disabled:opacity-50 transition-colors"
              >
                {chatLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAdvisor;