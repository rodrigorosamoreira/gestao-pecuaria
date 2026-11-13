import React, { useState } from 'react';
import { Lock, KeyRound, CheckCircle2, AlertCircle, X, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
        if (onSuccess) onSuccess();
        onClose();
      }, 2500);

    } catch (err: any) {
      setError(err?.message || 'Erro ao redefinir senha. O link pode ter expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-[#E3EAE6] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#F6F8F5] border-b border-[#E3EAE6] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#DCEDE4] rounded-xl text-[#145C46]">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold leading-snug text-[#20332C]">Redefinir Senha</h3>
              <p className="text-[13px] font-normal leading-normal text-[#64766C]">Crie uma nova senha de acesso segura</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#64766C] hover:text-[#20332C] hover:bg-white rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 bg-[#DCEDE4] text-[#145C46] rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck size={30} />
              </div>
              <h4 className="text-lg font-semibold leading-snug text-[#20332C]">Senha Alterada!</h4>
              <p className="text-sm font-normal leading-normal text-[#64766C] max-w-xs mx-auto">
                Sua senha foi atualizada com sucesso. Você já está com acesso liberado!
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium leading-snug text-[#64766C]">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={18} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full border border-[#E3EAE6] rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] outline-none bg-[#F6F8F5] focus:bg-white transition-all text-sm font-normal leading-normal text-[#20332C]"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium leading-snug text-[#64766C]">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64766C]" size={18} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full border border-[#E3EAE6] rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[#145C46]/20 focus:border-[#145C46] outline-none bg-[#F6F8F5] focus:bg-white transition-all text-sm font-normal leading-normal text-[#20332C]"
                    placeholder="Digite novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#145C46] hover:bg-[#0E4434] text-white py-3 rounded-xl text-sm font-semibold leading-snug shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Salvar Nova Senha
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default ResetPasswordModal;
