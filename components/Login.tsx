
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
  Check
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import ranchBg from '../src/assets/images/ranch_login_bg_1786582194800.jpg';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      setError(err.message || 'Ocorreu um erro na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100 overflow-hidden font-sans">
      
      {/* Left Panel - Visual Branding & Hero Showcase */}
      <div className="relative lg:w-7/12 flex flex-col justify-between p-8 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-emerald-900/30">
        {/* Background Image with Ambient Overlays */}
        <div className="absolute inset-0 z-0">
          <img 
            src={ranchBg} 
            alt="Fazenda de Pecuária" 
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-10000 hover:scale-100"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40" />
          <div className="absolute inset-0 bg-emerald-950/30 mix-blend-multiply" />
        </div>

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-14 h-14 bg-white p-1 rounded-2xl shadow-xl shadow-emerald-950/60 border border-emerald-400/40 overflow-hidden shrink-0 flex items-center justify-center">
            <img src="/logo.png" alt="Gestão Pecuária Logo" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white uppercase block leading-none">
              Gestão <span className="text-emerald-400">Pecuária</span>
            </span>
            <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-300/90 mt-1 block">
              Sistema de Precisão Zootécnica
            </span>
          </div>
        </div>

        {/* Center Hero Message & Highlights */}
        <div className="relative z-10 my-10 lg:my-0 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-emerald-400 animate-pulse" />
            <span>Inteligência Artificial & Controle Total</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Transforme a gestão do seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">rebanho com dados reais</span>.
          </h1>

          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
            Controle de ganho de peso, lotes de pastejo, custos diários e análises zootécnicas preditivas em uma plataforma simples e moderna.
          </p>

          {/* Feature Grid Pills */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3 bg-slate-900/75 border border-slate-800/80 rounded-2xl backdrop-blur-md">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">GMD & Peso Preditivo</p>
                <p className="text-[11px] text-slate-400">Evolução em tempo real</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-900/75 border border-slate-800/80 rounded-2xl backdrop-blur-md">
              <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
                <BarChart3 size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Financeiro por Cabeça</p>
                <p className="text-[11px] text-slate-400">Calculadora de diária</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-900/75 border border-slate-800/80 rounded-2xl backdrop-blur-md">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Cpu size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Consultor IA Zootécnico</p>
                <p className="text-[11px] text-slate-400">Nutrição & Recomendações</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-900/75 border border-slate-800/80 rounded-2xl backdrop-blur-md">
              <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Multiusuário & Núcleos</p>
                <p className="text-[11px] text-slate-400">Múltiplas fazendas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Proof / Footer Note */}
        <div className="relative z-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">Plataforma Ativa & Sincronizada</span>
          </div>
          <span className="text-slate-500 text-[11px]">v2.5 • Pecuária 4.0</span>
        </div>
      </div>

      {/* Right Panel - Authentication Form Container */}
      <div className="lg:w-5/12 flex items-center justify-center p-6 lg:p-12 bg-slate-900/90 relative">
        <div className="w-full max-w-md space-y-6">
          
          {/* Header Switcher Tabs */}
          <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 flex items-center shadow-inner">
            <button
              onClick={() => { setMode('login'); setError(''); setForgotSuccessMessage(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'login' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Acessar Conta
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setForgotSuccessMessage(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'register' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form Card Title */}
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {mode === 'login' && 'Bem-vindo de volta!'}
              {mode === 'register' && 'Cadastre sua Fazenda'}
              {mode === 'forgot' && 'Recuperação de Senha'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {mode === 'login' && 'Insira suas credenciais para entrar no painel zootécnico.'}
              {mode === 'register' && 'Crie sua conta para começar a gerenciar seu rebanho.'}
              {mode === 'forgot' && 'Digite seu e-mail e enviaremos um link de redefinição.'}
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-2xl font-medium animate-in fade-in duration-200 flex items-start gap-2">
              <span className="font-bold text-rose-400">Erro:</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {forgotSuccessMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs rounded-2xl font-medium flex gap-3 items-start animate-in fade-in duration-200">
              <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-emerald-300">E-mail Enviado!</p>
                <p className="text-slate-300 mt-1 leading-relaxed">{forgotSuccessMessage}</p>
              </div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider ml-1">
                  Nome Completo / Produtor
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    required
                    className="w-full border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-950/80 placeholder-slate-600 transition-all"
                    placeholder="Ex: João da Silva ou Fazenda Santa Maria"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider ml-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-950/80 placeholder-slate-600 transition-all"
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
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider ml-1">
                      Senha
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(''); setForgotSuccessMessage(''); }}
                        className="text-xs text-emerald-400 font-semibold hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      className="w-full border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-950/80 placeholder-slate-600 transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider ml-1">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        required
                        className="w-full border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-950/80 placeholder-slate-600 transition-all"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 text-sm mt-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'login' ? (
                    <>Acessar Painel <ArrowRight size={18} /></>
                  ) : mode === 'register' ? (
                    <>Criar Minha Conta <ArrowRight size={18} /></>
                  ) : (
                    <>Enviar E-mail de Recuperação <KeyRound size={18} /></>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Bottom Mode Switcher Link */}
          <div className="text-center pt-2">
            {mode === 'forgot' ? (
              <button 
                onClick={() => { setMode('login'); setError(''); setForgotSuccessMessage(''); }}
                className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft size={16} /> Voltar ao Login
              </button>
            ) : (
              <button 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setForgotSuccessMessage(''); }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                {mode === 'login' ? (
                  <>Ainda não possui uma conta? <span className="text-emerald-400 font-bold hover:underline">Cadastre-se grátis</span></>
                ) : (
                  <><ArrowLeft size={15} /> Já possui conta? <span className="text-emerald-400 font-bold hover:underline">Fazer Login</span></>
                )}
              </button>
            )}
          </div>

          {/* Security & Copyright Footer */}
          <div className="pt-6 border-t border-slate-800/80 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Conexão Segura & Criptografada (Supabase Auth)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              © {new Date().getFullYear()} Gestão Pecuária Systems. Todos os direitos reservados.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;

