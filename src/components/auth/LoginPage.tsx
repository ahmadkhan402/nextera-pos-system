import React, { useState } from 'react';
import { Lock, User, Mail, Eye, EyeOff, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { swalConfig } from '../../lib/sweetAlert';

export function LoginPage() {
  const { signIn, signUp, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    name: '',
    username: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isSignUp) {
        if (!credentials.name.trim() || !credentials.username.trim()) {
          // Show validation error toast with our styled config
          swalConfig.warning('Missing Information: Name and username are required');
          return;
        }
        await signUp(credentials.email, credentials.password, credentials.name, credentials.username);
      } else {
        await signIn(credentials.email, credentials.password);
      }
    } catch (error: any) {
      // Errors are now handled by the AuthContext with SweetAlert2 toasts
      console.debug('Login error handled by AuthContext:', error.message);
    }
  };

  const resetForm = () => {
    setCredentials({ email: '', password: '', name: '', username: '' });
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_34%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_48%,_#eff6ff_100%)] flex items-center justify-center p-4">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl mb-4 shadow-xl shadow-blue-500/25">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-950 mb-2">SnapSale</h1>
          <p className="text-sm font-medium text-blue-700 mb-2">Fast checkout. Clear inventory. Beautiful sales.</p>
          <p className="text-gray-600">
            {isSignUp ? 'Create your SnapSale account' : 'Welcome back! Please sign in'}
          </p>
        </div>

        <div className="card p-8 shadow-2xl shadow-blue-950/10 border-white/70 bg-white/85 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={credentials.name}
                      onChange={(e) => setCredentials(prev => ({ ...prev, name: e.target.value }))}
                      className="input pl-10 h-11"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                      className="input pl-10 h-11"
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="input pl-10 h-11"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="input pl-10 pr-12 h-11"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-12 font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isSignUp ? 'Creating Account...' : 'Signing in...'}</span>
                </>
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {['Secure', 'Fast', 'Simple'].map((item) => (
              <div key={item} className="rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs font-semibold text-blue-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}