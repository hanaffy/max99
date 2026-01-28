import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';

const Auth: React.FC = () => {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return alert("Please fill all fields");

    if (isLogin) {
      login(username, password);
    } else {
      register(username, password);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-indigo-600 tracking-tighter mb-2">max99</h1>
          <p className="text-gray-500 text-sm">The new generation of classic chat.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Username / Email</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              placeholder="Enter username or email"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" fullWidth>
            {isLogin ? 'Sign In' : 'Create ID'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            {isLogin ? "Need a permanent ID? Register" : "Already have an ID? Login"}
          </button>
        </div>
        
        {!isLogin && (
          <p className="mt-4 text-xs text-center text-gray-400">
            No email confirmation required. Instant access.
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
