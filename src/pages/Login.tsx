import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../lib/auth';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn({ email, password });
      } else {
        await signUp({ email, password }, { full_name: email.split('@')[0] });
      }
      // AuthGuard will organically catch the auth state shift 
      // and redirect to either /onboarding or /dashboard depending on their orgs
      navigate('/dashboard'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
      <div className="w-full max-w-md bg-[#181818] border border-[#2e2e2e] rounded p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-[#ededed] text-2xl font-bold tracking-tight relative inline-block pb-4 after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-10 after:h-[2px] after:bg-[#3ecf8e]">
            {isLogin ? 'Bon retour' : 'Créer un compte'}
          </h1>
        </div>

        {error && (
          <div className="bg-[#ff5f56]/10 border border-[#ff5f56]/20 text-[#ff5f56] px-4 py-3 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase text-[#a0a0a0] tracking-widest">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#000000] border border-[#2e2e2e] rounded px-4 py-3 text-[#ededed] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase text-[#a0a0a0] tracking-widest">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#000000] border border-[#2e2e2e] rounded px-4 py-3 text-[#ededed] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 bg-[#3ecf8e] hover:bg-[#32b279] text-[#000] font-bold py-3 px-4 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Traitement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
          </button>
        </form>

        <p className="text-center text-[#a0a0a0] text-sm mt-4">
          {isLogin ? "Vous n'avez pas de compte ? " : "Vous avez déjà un compte ? "}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#3ecf8e] hover:underline"
          >
            {isLogin ? "Inscrivez-vous ici" : "Connectez-vous ici"}
          </button>
        </p>
      </div>
    </div>
  );
}
