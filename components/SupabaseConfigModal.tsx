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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Configuração do Supabase</h3>
              <p className="text-xs text-slate-400">Gerencie a conexão do banco de dados na nuvem</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
          <Info size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Armazenamento Híbrido</p>
            <p className="text-slate-400 leading-relaxed">
              O aplicativo salva seus dados localmente no navegador. Você pode conectar seu próprio projeto Supabase inserindo a URL e a Anon Key abaixo.
            </p>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`mt-4 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
            testResult.success 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200' 
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-200'
          }`}>
            {testResult.success ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{testResult.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider ml-1">
              URL do Projeto Supabase
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="url"
                placeholder="https://seu-projeto.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-950/80 placeholder-slate-600 transition-all font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 ml-1">Exemplo: https://xyzcompany.supabase.co</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider ml-1">
              Chave Pública (Anon Key)
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-950/80 placeholder-slate-600 transition-all font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 ml-1">Encontrada em Project Settings &gt; API no painel do Supabase.</p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <Loader2 size={15} className="animate-spin text-emerald-400" />
                  <span>Testando Conexão...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={15} className="text-emerald-400" />
                  <span>Testar Servidor</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={saveSuccess}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check size={15} />
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
                className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
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
