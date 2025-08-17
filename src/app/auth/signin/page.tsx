'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Signed in successfully');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 relative overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 rounded-full animate-bounce"></div>
      <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400/40 rounded-full animate-bounce animation-delay-1000"></div>
      <div className="absolute bottom-32 left-40 w-2 h-2 bg-pink-400/40 rounded-full animate-bounce animation-delay-2000"></div>
      <div className="absolute bottom-20 right-20 w-4 h-4 bg-blue-400/30 rounded-full animate-bounce animation-delay-3000"></div>

      <div className="relative z-10 max-w-md w-full mx-4">
        {/* Main sign-in card */}
        <div className="backdrop-blur-md bg-white/10 p-8 rounded-3xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-500 transform hover:scale-105">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
              Welcome Back
            </h2>
            <p className="text-white/70 text-lg">
              GenZ Collection POS System
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mt-2"></div>
          </div>

          {/* Demo credentials */}
          {/* <div className="mb-6 p-4 backdrop-blur-sm bg-blue-500/20 rounded-xl border border-blue-400/30">
            <p className="text-blue-200 text-sm text-center mb-2 font-medium">Demo Credentials:</p>
            <p className="text-blue-100 text-xs text-center">Email: admin</p>
            <p className="text-blue-100 text-xs text-center">Password: admin</p>
          </div> */}

          <div className="space-y-6">
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-white/90 text-sm font-medium block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 backdrop-blur-sm bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-white/90 text-sm font-medium block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 backdrop-blur-sm bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:from-purple-600 hover:to-pink-600 hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          {/* Additional links */}
          <div className="mt-6 text-center">
            <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
              Forgot your password?
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/50 text-sm">
            Secure • Modern • Reliable
          </p>
        </div>
      </div>
    </div>
  );
} 