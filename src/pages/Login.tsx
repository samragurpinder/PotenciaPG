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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-100 blur-3xl opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-100 blur-3xl opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20"
      >
        <div>
          <h2 className="mt-2 text-center text-4xl font-extrabold text-gray-900 tracking-tight">
            Smart PG
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Select your role to continue
          </p>
        </div>

        {!selectedRole ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-4 mt-8"
          >
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 group"
                >
                  <div className={clsx("p-3 rounded-xl text-white mb-3 shadow-sm group-hover:scale-110 transition-transform", role.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-gray-700">{role.name}</span>
                </button>
              );
            })}
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-8 space-y-6" 
            onSubmit={handleLogin}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                {React.createElement(roles.find(r => r.id === selectedRole)?.icon || User, { className: "w-5 h-5 text-indigo-600" })}
                <span className="font-semibold text-gray-700 capitalize">{selectedRole} Login</span>
              </div>
              <button 
                type="button" 
                onClick={() => { setSelectedRole(null); setError(''); setId(''); setPassword(''); }}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Change Role
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                <input
                  type="email"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder={selectedRole === 'admin' ? "e.g. pgadmin@gmail.com" : "Enter your email"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 shadow-md hover:shadow-lg"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}

