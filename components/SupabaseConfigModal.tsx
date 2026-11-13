import React, { useState } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Key, 
  Globe, 
  Info,
  Check
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveCustomSupabaseConfig, 
  resetSupabaseConfig, 
  testSupabaseConnection 
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.hasCustomUrl ? currentConfig.url : '');
  const [anonKey, setAnonKey] = useState(currentConfig.hasCustomUrl ? currentConfig.anonKey : '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection(url.trim() || undefined, anonKey.trim() || undefined);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Falha ao testar conexão com o servidor.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !url.trim().startsWith('http')) {
      setTestResult({
        success: false,
        message: 'A URL deve começar com https:// ou http://'
      });
      return;
    }

    saveCustomSupabaseConfig(url.trim(), anonKey.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onConfigSaved) onConfigSaved();
      onClose();
      // Reload page to re-initialize supabase client with new credentials if changed
      window.location.reload();
    }, 1200);
  };

  const handleReset = () => {
    resetSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: 'Configurações restauradas para os padrões originais.'
    });
    setTimeout(() => {
      if (onConfigSaved) onConfigSaved();
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E3EAE6] w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-xl text-[#20332C] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E3EAE6] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#DCEDE4] text-[#145C46] rounded-xl">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Configuração do Supabase</h3>
              <p className="text-[13px] font-normal leading-normal text-[#64766C]">Gerencie a conexão do banco de dados na nuvem</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#64766C] hover:text-[#20332C] hover:bg-[#F6F8F5] rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3.5 bg-[#F6F8F5] border border-[#E3EAE6] rounded-xl flex items-start gap-3 text-xs font-normal text-[#64766C]">
          <Info size={18} className="text-[#145C46] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#20332C] leading-snug">Armazenamento Híbrido</p>
            <p className="text-xs font-normal text-[#64766C] leading-relaxed">
              O aplicativo salva seus dados localmente no navegador. Você pode conectar seu próprio projeto Supabase inserindo a URL e a Anon Key abaixo.
            </p>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs font-normal flex items-start gap-2.5 animate-in fade-in duration-200 ${
            testResult.success 
              ? 'bg-[#DCEDE4]/60 border border-[#145C46]/25 text-[#145C46]' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {testResult.success ? (
              <CheckCircle2 size={16} className="text-[#145C46] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{testResult.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium leading-snug text-[#64766C]">
              URL do Projeto Supabase
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={16} />
              <input 
                type="url"
                placeholder="https://seu-projeto.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full border border-[#E3EAE6] rounded-xl pl-10 pr-4 py-2.5 text-sm font-normal leading-normal text-[#20332C] focus:border-[#145C46] focus:ring-2 focus:ring-[#145C46]/20 focus:bg-white outline-none bg-[#F6F8F5] placeholder-[#64766C]/70 transition-all"
              />
            </div>
            <p className="text-xs font-normal text-[#64766C]">Exemplo: https://xyzcompany.supabase.co</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium leading-snug text-[#64766C]">
              Chave Pública (Anon Key)
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={16} />
              <input 
                type="text"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full border border-[#E3EAE6] rounded-xl pl-10 pr-4 py-2.5 text-sm font-normal leading-normal text-[#20332C] focus:border-[#145C46] focus:ring-2 focus:ring-[#145C46]/20 focus:bg-white outline-none bg-[#F6F8F5] placeholder-[#64766C]/70 transition-all"
              />
            </div>
            <p className="text-xs font-normal text-[#64766C]">Encontrada em Project Settings &gt; API no painel do Supabase.</p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 bg-[#F6F8F5] hover:bg-[#E5F2EB] text-[#20332C] py-2.5 rounded-xl text-sm font-semibold leading-snug flex items-center justify-center gap-2 border border-[#E3EAE6] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <Loader2 size={16} className="animate-spin text-[#145C46]" />
                  <span>Testando Conexão...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="text-[#145C46]" />
                  <span>Testar Servidor</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={saveSuccess}
              className="flex-1 bg-[#145C46] hover:bg-[#0E4434] text-white py-2.5 rounded-xl text-sm font-semibold leading-snug flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check size={16} />
                  <span>Configuração Salva!</span>
                </>
              ) : (
                <span>Salvar e Aplicar</span>
              )}
            </button>
          </div>

          {currentConfig.hasCustomUrl && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-red-600 hover:text-red-700 underline cursor-pointer"
              >
                Restaurar valores padrão
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
};
