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
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-purple-600" /> Inteligência Artificial
          </h2>
          <p className="text-gray-500 text-sm">Use o Gemini para analisar sua fazenda e tirar dúvidas técnicas.</p>
        </div>
        
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'report' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Relatório Completo
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Chat Técnico
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {activeTab === 'report' ? (
          <div className="p-6 flex flex-col h-full">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-semibold text-gray-800">Análise da Fazenda</h3>
                <p className="text-xs text-gray-500">Cruza dados zootécnicos e financeiros para insights.</p>
              </div>
              <button 
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                {isLoading ? 'Analisando...' : 'Gerar Relatório'}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-6 border border-gray-200 prose prose-sm max-w-none">
              {report ? (
                <ReactMarkdown>{report}</ReactMarkdown>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Sparkles size={48} className="mb-4 opacity-30" />
                  <p>Clique em "Gerar Relatório" para receber uma análise completa.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {chatResponse ? (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="font-semibold text-purple-900 text-sm mb-2">Resposta do Assistente:</p>
                  <div className="text-gray-800 text-sm whitespace-pre-line leading-relaxed">
                    <ReactMarkdown>{chatResponse}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                   <p className="text-center max-w-md">Pergunte sobre manejo, vacinação, nutrição ou qualquer dúvida técnica sobre pecuária.</p>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ex: Qual a melhor época para vacinação de aftosa?"
                className="w-full border border-gray-300 rounded-lg pl-4 pr-12 py-3 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                disabled={chatLoading}
              />
              <button 
                type="submit" 
                disabled={chatLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
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