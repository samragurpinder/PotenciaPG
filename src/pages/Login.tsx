import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Shield, User, ChefHat, UserCog } from 'lucide-react';
import { motion } from 'motion/react';
import clsx from 'clsx';

type LoginRole = 'admin' | 'warden' | 'cook' | 'student';

export default function Login() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(null);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(id, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const roles: { id: LoginRole; name: string; icon: React.ElementType; color: string }[] = [
    { id: 'admin', name: 'Admin', icon: Shield, color: 'bg-indigo-500' },
    { id: 'warden', name: 'Warden', icon: UserCog, color: 'bg-emerald-500' },
    { id: 'cook', name: 'Cook', icon: ChefHat, color: 'bg-orange-500' },
    { id: 'student', name: 'Student', icon: User, color: 'bg-blue-500' },
  ];

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      {/* Left Side: Visual/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-600 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-900 opacity-90" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-12"
        >
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 mb-8 shadow-2xl">
            <Shield className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-white mb-6 font-display tracking-tight">Nestify</h1>
          <p className="text-xl text-brand-100 max-w-md mx-auto font-light leading-relaxed">
            The modern standard for PG management. Seamless, secure, and built for the future.
          </p>
          <div className="mt-12 pt-12 border-t border-white/10">
            <p className="text-brand-200 text-sm font-medium uppercase tracking-[0.2em]">by Gurpinder Labs</p>
          </div>
        </motion.div>
        
        {/* Floating elements */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl"
        />
        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-20 w-48 h-48 bg-brand-400/10 rounded-full blur-3xl"
        />
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-slate-50/30">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-12 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-brand-600 rounded-2xl shadow-lg mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 font-display">Nestify</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">by Gurpinder Labs</p>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 font-display tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2">Please enter your details to sign in.</p>
          </div>

          {!selectedRole ? (
            <div className="space-y-6">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Select your role</p>
              <div className="grid grid-cols-2 gap-4">
                {roles.map((role, index) => {
                  const Icon = role.icon;
                  return (
                    <motion.button
                      key={role.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedRole(role.id)}
                      className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300"
                    >
                      <div className={clsx("p-3 rounded-xl text-white mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300", role.color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-slate-700 group-hover:text-brand-600 transition-colors">{role.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6" 
              onSubmit={handleLogin}
            >
              <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className={clsx("p-2 rounded-lg text-white", roles.find(r => r.id === selectedRole)?.color)}>
                    {React.createElement(roles.find(r => r.id === selectedRole)?.icon || User, { className: "w-5 h-5" })}
                  </div>
                  <span className="font-bold text-slate-700 capitalize">{selectedRole} Mode</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setSelectedRole(null); setError(''); setId(''); setPassword(''); }}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider"
                >
                  Change
                </button>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 mr-3" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="modern-input"
                    placeholder={selectedRole === 'admin' ? "pgadmin@gmail.com" : "yourname@example.com"}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <label className="block text-sm font-semibold text-slate-700">Password</label>
                    <button type="button" className="text-xs font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider">Forgot?</button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="modern-input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="modern-button-primary w-full py-4 text-base"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : 'Sign in to Nestify'}
              </button>
            </motion.form>
          )}
          
          <div className="mt-12 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account? <button className="text-brand-600 font-bold hover:underline">Contact Admin</button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

