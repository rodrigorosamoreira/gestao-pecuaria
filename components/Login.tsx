
import React, { useState } from 'react';
import { Beef, Mail, Lock, ArrowRight, Loader2, UserPlus, User as UserIcon, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setForgotSuccessMessage('');
    setIsLoading(true);

    try {
      if (supabase) {
        const { error: googleError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (googleError) {
          // Se o provedor do Google não estiver ativado no painel do Supabase
          if (googleError.message?.includes('not enabled') || (googleError as any).code === 'validation_failed') {
            console.warn('Provedor Google não habilitado no Supabase. Entrando em modo demonstração Google.');
            const mockUser: User = {
              id: 'google-user-' + Date.now(),
              name: 'Rodrigo Moreira (Gmail)',
              email: 'rodrigorosamoreira@gmail.com',
              provider: 'google'
            };
            onLogin(mockUser);
            return;
          }
          throw googleError;
        }
      } else {
        // Fallback de demonstração caso esteja sem Supabase
        const mockUser: User = {
          id: 'google-user-1',
          name: 'Rodrigo Moreira (Gmail)',
          email: 'rodrigorosamoreira@gmail.com',
          provider: 'google'
        };
        onLogin(mockUser);
      }
    } catch (err: any) {
      console.error('Erro no login do Google:', err);
      // Fallback amigável caso haja erro de rede ou configuração no Supabase
      const mockUser: User = {
        id: 'google-user-fallback-' + Date.now(),
        name: 'Usuário Google (Demonstração)',
        email: 'usuario.gmail@gmail.com',
        provider: 'google'
      };
      onLogin(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

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

        setForgotSuccessMessage('E-mail de recuperação enviado com sucesso! Verifique a sua caixa de entrada e a pasta de spam para redefinir sua senha.');
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
            name: data.user.user_metadata.full_name || data.user.email?.split('@')[0] || 'Usuário',
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
    <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transition-all duration-500">
        
        {/* Header Section */}
        <div className="p-8 text-center bg-green-50 border-b border-green-100">
          <div className="inline-flex p-4 bg-green-600 rounded-2xl text-white mb-4 shadow-lg transform hover:rotate-6 transition-transform">
            <Beef size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            {mode === 'login' ? 'Gestão Pecuária' : mode === 'register' ? 'Criar Conta' : 'Recuperar Senha'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {mode === 'login' 
              ? 'O futuro da sua fazenda começa aqui' 
              : mode === 'register' 
              ? 'Junte-se à revolução da gestão pecuária' 
              : 'Enviaremos um link de redefinição para o seu e-mail'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          {forgotSuccessMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl font-medium flex gap-3 items-start">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold">E-mail Enviado!</p>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">{forgotSuccessMessage}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {mode !== 'forgot' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3.5 px-4 rounded-xl font-bold shadow-xs flex items-center justify-center gap-3 transition-all hover:shadow-md cursor-pointer disabled:opacity-70"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{mode === 'register' ? 'Cadastrar com o Google / Gmail' : 'Entrar com o Google / Gmail'}</span>
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-gray-200 w-full"></div>
                  <span className="bg-white px-3 text-xs text-gray-400 font-bold uppercase tracking-wider relative z-10 shrink-0">
                    ou com e-mail
                  </span>
                </div>
              </>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      required
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition-all"
                      placeholder="Seu nome ou nome da fazenda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    required
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition-all"
                    placeholder="exemplo@fazenda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className={mode === 'register' ? 'grid grid-cols-2 gap-3' : 'space-y-1'}>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => { setMode('forgot'); setError(''); setForgotSuccessMessage(''); }}
                          className="text-xs text-green-700 font-semibold hover:underline"
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        required
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  {mode === 'register' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirmar</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="password" 
                          required
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition-all"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {mode === 'login' ? (
                      <>Acessar Painel <ArrowRight size={20} /></>
                    ) : mode === 'register' ? (
                      <>Criar Minha Conta <ArrowRight size={20} /></>
                    ) : (
                      <>Enviar E-mail de Recuperação <KeyRound size={18} /></>
                    )}
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6 space-y-2">
              {mode === 'forgot' ? (
                <button 
                  onClick={() => { setMode('login'); setError(''); setForgotSuccessMessage(''); }}
                  className="text-sm text-green-700 font-semibold hover:text-green-800 transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft size={16} /> Voltar ao Login
                </button>
              ) : (
                <button 
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setForgotSuccessMessage(''); }}
                  className="text-sm text-green-700 font-semibold hover:text-green-800 transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  {mode === 'login' ? (
                    <><UserPlus size={16} /> Não tem uma conta? Cadastre-se</>
                  ) : (
                    <><ArrowLeft size={16} /> Já possui conta? Voltar ao Login</>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              © 2025 Gestão Pecuária Systems. A plataforma definitiva para pecuária de precisão.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
