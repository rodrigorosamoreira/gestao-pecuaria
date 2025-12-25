
import React, { useState } from 'react';
import { Beef, Mail, Lock, ArrowRight, Loader2, UserPlus, User as UserIcon, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const simulateAuth = (provider: 'google' | 'email') => {
    if (mode === 'register' && password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setError('');
    setIsLoggingIn(true);
    
    // Simula delay de rede
    setTimeout(() => {
      const mockUser: User = {
        id: provider === 'google' ? 'google_123' : `user_${email.replace(/[^a-zA-Z0-0]/g, '')}`,
        name: provider === 'google' ? 'Usuário Google' : (name || email.split('@')[0]),
        email: provider === 'google' ? 'google@example.com' : email,
        provider: provider,
        photo: provider === 'google' ? 'https://ui-avatars.com/api/?name=G&background=random' : undefined
      };
      onLogin(mockUser);
      setIsLoggingIn(false);
    }, 1500);
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
            {mode === 'login' ? (
              <>
                <button 
                  onClick={() => simulateAuth('google')}
                  disabled={isLoggingIn}
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

                <form onSubmit={(e) => { e.preventDefault(); simulateAuth('email'); }} className="space-y-4">
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

                  <button 
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        Acessar Painel <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-6">
                  <button 
                    onClick={() => { setMode('register'); setError(''); }}
                    className="text-sm text-green-700 font-semibold hover:text-green-800 transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <UserPlus size={16} />
                    Não tem uma conta? Cadastre-se
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); simulateAuth('email'); }} className="space-y-4">
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      required
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition-all"
                      placeholder="contato@agrogestao.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-4"
                >
                  {isLoggingIn ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Criar Minha Conta <ArrowRight size={20} />
                    </>
                  )}
                </button>

                <div className="text-center mt-6">
                  <button 
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="text-sm text-gray-500 font-medium hover:text-green-700 transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft size={16} />
                    Já possui conta? Voltar ao Login
                  </button>
                </div>
              </form>
            )}
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
