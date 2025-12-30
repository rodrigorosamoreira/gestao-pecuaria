
import React, { useState } from 'react';
import { Beef, Mail, Lock, ArrowRight, Loader2, UserPlus, User as UserIcon, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
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
            {mode === 'login' ? 'Gestão Pecuária' : 'Criar Conta'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {mode === 'login' ? 'O futuro da sua fazenda começa aqui' : 'Junte-se à revolução da gestão pecuária'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {mode === 'login' && (
              <>
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Entrar com Google
                </button>

                <div className="flex items-center gap-4 my-6">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-xs text-gray-400 font-bold uppercase">Ou com e-mail</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
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

              <div className={mode === 'register' ? 'grid grid-cols-2 gap-3' : 'space-y-1'}>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
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

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {mode === 'login' ? 'Acessar Painel' : 'Criar Minha Conta'} <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <button 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-sm text-green-700 font-semibold hover:text-green-800 transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                {mode === 'login' ? (
                  <><UserPlus size={16} /> Não tem uma conta? Cadastre-se</>
                ) : (
                  <><ArrowLeft size={16} /> Já possui conta? Voltar ao Login</>
                )}
              </button>
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