import React, { useState } from 'react';
import { 
  Beef, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  UserPlus, 
  User as UserIcon, 
  ArrowLeft, 
  KeyRound, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  TrendingUp, 
  Cpu, 
  Sparkles,
  BarChart3,
  Check,
  Database,
  WifiOff,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { SupabaseConfigModal } from './SupabaseConfigModal';
import ranchBg from '../src/assets/images/ranch_login_bg_1786582194800.jpg';
import { APP_LOGO_DATA_URI } from '../src/assets/logoData';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isConnectionError, setIsConnectionError] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

  const handleLocalAccess = () => {
    const localUser: User = {
      id: 'produtor-local',
      name: name.trim() || 'Produtor Rural (Modo Local)',
      email: email.trim() || 'produtor@fazenda.local',
      provider: 'guest'
    };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('local_user', JSON.stringify(localUser));
    }
    onLogin(localUser);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsConnectionError(false);
    setForgotSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        if (!email) {
          throw new Error('Informe o seu e-mail para continuar.');
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });

        if (resetError) throw resetError;

        setForgotSuccessMessage('E-mail de recuperação enviado com sucesso! Verifique a sua caixa de entrada e a pasta de spam.');
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });

        if (signUpError) throw signUpError;
        if (data.user) {
          alert('Conta criada com sucesso! Verifique seu e-mail se necessário ou faça login.');
          setMode('login');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        
        if (data.user) {
          const userObj: User = {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuário',
            email: data.user.email || '',
            provider: 'email'
          };
          onLogin(userObj);
        }
      }
    } catch (err: any) {
      const rawMsg = String(err?.message || err || 'Ocorreu um erro na autenticação');
      console.error('Erro de autenticação Supabase:', err);

      const lowerMsg = rawMsg.toLowerCase();
      let userFriendlyMsg = rawMsg;

      const isPathError = 
        lowerMsg.includes('invalid path') || 
        lowerMsg.includes('requested path is invalid') ||
        lowerMsg.includes('pgrst125');

      const isNetworkIssue = 
        isPathError ||
        lowerMsg.includes('supabase') || 
        lowerMsg.includes('indisponível') ||
        lowerMsg.includes('failed to fetch') ||
        lowerMsg.includes('network') ||
        lowerMsg.includes('conexão') ||
        lowerMsg.includes('fetch');

      if (isPathError) {
        userFriendlyMsg = 'A URL do servidor Supabase configurada contém um caminho ou rota inválida (ex: "/auth/v1" ou "/rest/v1" incluído na raiz). Ajuste para apenas "https://seu-projeto.supabase.co" ou utilize o Modo Local.';
        setIsConnectionError(true);
      } else if (lowerMsg.includes('invalid login credentials') || lowerMsg.includes('invalid credentials')) {
        userFriendlyMsg = 'E-mail ou senha incorretos. Verifique suas credenciais ou crie uma conta.';
      } else if (lowerMsg.includes('email not confirmed')) {
        userFriendlyMsg = 'E-mail ainda não confirmado. Verifique sua caixa de entrada no e-mail cadastrado.';
      } else if (lowerMsg.includes('user already registered')) {
        userFriendlyMsg = 'Este e-mail já está cadastrado. Alterne para a aba "Acessar Conta".';
      } else if (isNetworkIssue) {
        setIsConnectionError(true);
      }

      setError(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F5] flex flex-col lg:flex-row text-[#20332C] overflow-hidden font-sans">
      
      {/* Left Panel - Visual Branding & Hero Showcase */}
      <div className="relative lg:w-7/12 flex flex-col justify-between p-8 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#E3EAE6] text-white">
        {/* Background Image with Ambient Overlays */}
        <div className="absolute inset-0 z-0">
          <img 
            src={ranchBg} 
            alt="Fazenda de Pecuária" 
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-10000 hover:scale-100"
            referrerPolicy="no-referrer" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D261E] via-[#0D261E]/80 to-[#0D261E]/45" />
        </div>

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-white p-1 rounded-2xl shadow-lg border border-white/30 overflow-hidden shrink-0 flex items-center justify-center">
              <img 
                src={APP_LOGO_DATA_URI} 
                alt="Gestão Pecuária Logo" 
                className="w-full h-full object-cover rounded-xl" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <span className="text-2xl font-semibold leading-snug text-white block">
                Gestão <span className="text-[#8CE0BE]">Pecuária</span>
              </span>
              <span className="text-xs font-medium leading-snug text-white/80 mt-0.5 block">
                Sistema de Precisão Zootécnica
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white/90 hover:text-white hover:bg-white/20 text-xs font-medium backdrop-blur-md transition-all cursor-pointer"
            title="Configurar servidor ou banco de dados"
          >
            <Settings size={15} className="text-[#8CE0BE]" />
            <span className="hidden sm:inline">Configurar Conexão</span>
          </button>
        </div>

        {/* Center Hero Message & Highlights */}
        <div className="relative z-10 my-10 lg:my-0 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-[#8CE0BE] text-xs font-medium backdrop-blur-md">
            <Sparkles size={14} className="text-[#8CE0BE]" />
            <span>Inteligência Artificial & Controle Total</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-semibold text-white leading-tight">
            Transforme a gestão do seu <span className="text-[#8CE0BE]">rebanho com dados reais</span>.
          </h1>

          <p className="text-white/85 text-sm lg:text-base font-normal leading-relaxed">
            Controle de ganho de peso, lotes de pastejo, custos diários e análises zootécnicas preditivas em uma plataforma simples e moderna.
          </p>

          {/* Feature Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3.5 bg-white/10 border border-white/15 rounded-xl backdrop-blur-md">
              <div className="p-2 bg-white/15 text-[#8CE0BE] rounded-lg shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-snug">GMD & Peso Preditivo</p>
                <p className="text-xs font-normal text-white/75 leading-snug mt-0.5">Evolução em tempo real</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-white/10 border border-white/15 rounded-xl backdrop-blur-md">
              <div className="p-2 bg-white/15 text-[#8CE0BE] rounded-lg shrink-0">
                <BarChart3 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-snug">Financeiro por Cabeça</p>
                <p className="text-xs font-normal text-white/75 leading-snug mt-0.5">Calculadora de diária</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-white/10 border border-white/15 rounded-xl backdrop-blur-md">
              <div className="p-2 bg-white/15 text-[#8CE0BE] rounded-lg shrink-0">
                <Cpu size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-snug">Consultor IA Zootécnico</p>
                <p className="text-xs font-normal text-white/75 leading-snug mt-0.5">Nutrição & Recomendações</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-white/10 border border-white/15 rounded-xl backdrop-blur-md">
              <div className="p-2 bg-white/15 text-[#8CE0BE] rounded-lg shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-snug">Multiusuário & Lotes</p>
                <p className="text-xs font-normal text-white/75 leading-snug mt-0.5">Múltiplas fazendas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Proof / Footer Note */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs font-normal text-white/75">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8CE0BE]" />
            <span className="text-white/90 font-medium">Plataforma Ativa com Armazenamento Local Seguro</span>
          </div>
          <span className="text-white/60 text-xs">v2.5 • Pecuária 4.0</span>
        </div>
      </div>

      {/* Right Panel - Authentication Form Container */}
      <div className="lg:w-5/12 flex items-center justify-center p-6 lg:p-12 bg-[#F6F8F5] relative">
        <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl border border-[#E3EAE6] shadow-xs space-y-6">
          
          {/* Header Switcher Tabs */}
          <div className="bg-[#F6F8F5] p-1 rounded-xl border border-[#E3EAE6] flex items-center">
            <button
              onClick={() => { setMode('login'); setError(''); setIsConnectionError(false); setForgotSuccessMessage(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold leading-snug rounded-lg transition-all cursor-pointer ${
                mode === 'login' 
                  ? 'bg-[#145C46] text-white shadow-2xs' 
                  : 'text-[#64766C] hover:text-[#20332C]'
              }`}
            >
              Acessar Conta
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setIsConnectionError(false); setForgotSuccessMessage(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold leading-snug rounded-lg transition-all cursor-pointer ${
                mode === 'register' 
                  ? 'bg-[#145C46] text-white shadow-2xs' 
                  : 'text-[#64766C] hover:text-[#20332C]'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form Card Title */}
          <div>
            <h2 className="text-2xl font-semibold leading-snug text-[#20332C]">
              {mode === 'login' && 'Bem-vindo de volta!'}
              {mode === 'register' && 'Cadastre sua Fazenda'}
              {mode === 'forgot' && 'Recuperação de Senha'}
            </h2>
            <p className="text-[#64766C] text-[13px] font-normal leading-normal mt-1">
              {mode === 'login' && 'Insira suas credenciais ou use o Acesso Local sem servidor.'}
              {mode === 'register' && 'Crie sua conta para começar a gerenciar seu rebanho.'}
              {mode === 'forgot' && 'Digite seu e-mail e enviaremos um link de redefinição.'}
            </p>
          </div>

          {/* Connection Error Banner with Immediate Local Mode CTA */}
          {error && (
            <div className={`p-4 border rounded-xl text-xs font-normal space-y-3 animate-in fade-in duration-200 ${
              isConnectionError 
                ? 'bg-amber-50 border-amber-200 text-amber-900' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-start gap-2.5">
                {isConnectionError ? (
                  <WifiOff size={18} className="text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-sm leading-snug">
                    {isConnectionError ? 'Servidor de Nuvem Supabase Indisponível' : 'Erro de Autenticação'}
                  </p>
                  <p className="mt-1 leading-relaxed text-xs">
                    {isConnectionError 
                      ? 'Não foi possível alcançar o servidor Supabase configurado. Você pode continuar no Modo Local imediatamente com todos os dados salvos no seu navegador!'
                      : error}
                  </p>
                </div>
              </div>

              {isConnectionError && (
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleLocalAccess}
                    className="flex-1 bg-[#145C46] hover:bg-[#0E4434] text-white py-2.5 px-3 rounded-xl text-sm font-semibold leading-snug flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Database size={15} />
                    <span>Entrar no Modo Local</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(true)}
                    className="bg-white hover:bg-[#F6F8F5] text-[#20332C] py-2.5 px-3 rounded-xl text-sm font-semibold leading-snug flex items-center justify-center gap-1.5 border border-[#E3EAE6] transition-all cursor-pointer"
                  >
                    <Settings size={15} />
                    <span>Configurar URL</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {forgotSuccessMessage && (
            <div className="p-4 bg-[#DCEDE4]/60 border border-[#145C46]/25 text-[#20332C] text-xs rounded-xl font-normal flex gap-3 items-start animate-in fade-in duration-200">
              <CheckCircle2 className="text-[#145C46] shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-sm text-[#145C46] leading-snug">E-mail Enviado!</p>
                <p className="text-[#64766C] mt-1 leading-relaxed">{forgotSuccessMessage}</p>
              </div>
            </div>
          )}

          {/* Quick Local Access Card (Recommended when offline or for fast evaluation) */}
          <div className="p-4 bg-[#F6F8F5] border border-[#E3EAE6] rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[#145C46]" />
                <span className="text-sm font-semibold text-[#20332C] leading-snug">Acesso Local & Demonstração</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#DCEDE4] text-[#145C46]">
                100% Funcional
              </span>
            </div>
            <p className="text-xs font-normal text-[#64766C] leading-relaxed">
              Use o sistema de forma instantânea sem necessidade de servidor externo. Seus dados ficam salvos com segurança no navegador.
            </p>
            <button
              type="button"
              onClick={handleLocalAccess}
              className="w-full bg-white hover:bg-[#E5F2EB] text-[#145C46] py-2.5 px-4 rounded-xl text-sm font-semibold leading-snug border border-[#145C46]/30 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
            >
              <Database size={16} className="text-[#145C46]" />
              <span>Entrar no Modo Local (Sem Servidor)</span>
              <ArrowRight size={16} className="ml-1 opacity-75" />
            </button>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[#E3EAE6] w-full" />
            <span className="bg-white px-3 text-xs font-medium text-[#64766C] whitespace-nowrap">
              Ou acesse com conta na nuvem
            </span>
            <div className="border-t border-[#E3EAE6] w-full" />
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium leading-snug text-[#64766C]">
                  Nome Completo / Produtor
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={18} />
                  <input 
                    type="text" 
                    required
                    className="w-full border border-[#E3EAE6] rounded-xl pl-10 pr-4 py-2.5 text-sm font-normal leading-normal text-[#20332C] focus:border-[#145C46] focus:ring-2 focus:ring-[#145C46]/20 focus:bg-white outline-none bg-[#F6F8F5] placeholder-[#64766C]/70 transition-all"
                    placeholder="Ex: João da Silva ou Fazenda Santa Maria"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium leading-snug text-[#64766C]">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full border border-[#E3EAE6] rounded-xl pl-10 pr-4 py-2.5 text-sm font-normal leading-normal text-[#20332C] focus:border-[#145C46] focus:ring-2 focus:ring-[#145C46]/20 focus:bg-white outline-none bg-[#F6F8F5] placeholder-[#64766C]/70 transition-all"
                  placeholder="exemplo@fazenda.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">
                      Senha
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(''); setIsConnectionError(false); setForgotSuccessMessage(''); }}
                        className="text-xs font-medium text-[#145C46] hover:underline cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      className="w-full border border-[#E3EAE6] rounded-xl pl-10 pr-10 py-2.5 text-sm font-normal leading-normal text-[#20332C] focus:border-[#145C46] focus:ring-2 focus:ring-[#145C46]/20 focus:bg-white outline-none bg-[#F6F8F5] placeholder-[#64766C]/70 transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64766C] hover:text-[#20332C] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium leading-snug text-[#64766C]">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={18} />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        required
                        className="w-full border border-[#E3EAE6] rounded-xl pl-10 pr-10 py-2.5 text-sm font-normal leading-normal text-[#20332C] focus:border-[#145C46] focus:ring-2 focus:ring-[#145C46]/20 focus:bg-white outline-none bg-[#F6F8F5] placeholder-[#64766C]/70 transition-all"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64766C] hover:text-[#20332C] transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#145C46] hover:bg-[#0E4434] text-white py-3 rounded-xl text-sm font-semibold leading-snug shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'login' ? (
                    <>Entrar com Supabase <ArrowRight size={17} /></>
                  ) : mode === 'register' ? (
                    <>Criar Minha Conta na Nuvem <ArrowRight size={17} /></>
                  ) : (
                    <>Enviar E-mail de Recuperação <KeyRound size={17} /></>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Bottom Mode Switcher Link */}
          <div className="text-center pt-1">
            {mode === 'forgot' ? (
              <button 
                onClick={() => { setMode('login'); setError(''); setIsConnectionError(false); setForgotSuccessMessage(''); }}
                className="text-xs font-semibold text-[#145C46] hover:text-[#0E4434] transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <ArrowLeft size={15} /> Voltar ao Login
              </button>
            ) : (
              <button 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setIsConnectionError(false); setForgotSuccessMessage(''); }}
                className="text-xs font-normal text-[#64766C] hover:text-[#20332C] transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                {mode === 'login' ? (
                  <>Ainda não possui uma conta? <span className="text-[#145C46] font-semibold hover:underline">Cadastre-se grátis</span></>
                ) : (
                  <><ArrowLeft size={15} /> Já possui conta? <span className="text-[#145C46] font-semibold hover:underline">Fazer Login</span></>
                )}
              </button>
            )}
          </div>

          {/* Security & Settings Footer */}
          <div className="pt-5 border-t border-[#E3EAE6] text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs font-normal text-[#64766C]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#145C46]" />
                <span>Dados Seguros</span>
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="text-[#145C46] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings size={13} />
                <span>Configurações do Banco</span>
              </button>
            </div>
            <p className="text-xs font-normal text-[#64766C]">
              © {new Date().getFullYear()} Gestão Pecuária Systems. Todos os direitos reservados.
            </p>
          </div>

        </div>
      </div>

      <SupabaseConfigModal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
      />

    </div>
  );
};

export default Login;
