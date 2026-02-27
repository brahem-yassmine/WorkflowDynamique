'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import axios, { AxiosError } from 'axios';

interface LoginFormData {
  email: string;
  password: string;
}

import {
  ChartNetwork
} from "lucide-react";

interface ApiErrorResponse {
  message?: string;
  success?: boolean;
}

interface UserData {
  _id: string;
  email: string;
  role: 'admin' | 'user' | 'super_admin';
  firstName?: string;
  lastName?: string;
  tenantId?: string;  // 👈 Added
  domain?: string;
  isActive: boolean;
  hasSelectedPlan?: boolean;
  companyName?: string;
  tenant?: {
    _id: string;
    name: string;
    plan?: string;
    status?: string;
  };
}

interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    user: UserData;
    requiresPlanSelection?: boolean;
    tenant?: any;
    tenantId?: string;  // 👈 Added for certainty
  };
}

export default function SigninPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();

  // ✅ Improved redirect function
  const getRedirectPath = (userData: UserData, requiresPlanSelection?: boolean): string => {
    const { role, hasSelectedPlan } = userData;

    console.log('🔍 Debug redirect:', {
      role,
      hasSelectedPlan,
      requiresPlanSelection
    });

    // ✅ If the user has not selected a plan, redirect to the selection page
    if (requiresPlanSelection || hasSelectedPlan === false) {
      console.log('⚠️ User without plan, redirecting to /select-plan');
      return '/select-plan';
    }

    // Redirect by role
    switch (role) {
      case 'super_admin':
        return '/super_admin';
      case 'admin':
        return '/admin';
      case 'user':
        return '/User/create_workflows';
      default:
        return '/User';
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      console.log(' Login attempt for:', formData.email);

      // Call backend API
      const response = await axios.post<LoginResponse>('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(' Server response:', response.data);

      if (response.data.success && response.data.data) {
        const { token, user, requiresPlanSelection } = response.data.data;

        console.log(' Login successful:', {
          user: {
            role: user.role,
            email: user.email,
            hasSelectedPlan: user.hasSelectedPlan,
            tenantId: user.tenantId
          },
          requiresPlanSelection
        });

        // 1️⃣ RETRIEVE TENANT ID
        const tenantId = user.tenantId || response.data.data.tenantId || response.data.data.tenant?._id;

        console.log(' Tenant ID retrieved:', tenantId);

        // 2️⃣ SAVE ALL DATA
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_pass_sync', formData.password); // 👈 Added for Profile Sync

        // 3️⃣ SAVE TENANT ID SEPARATELY (PRO SOLUTION)
        if (tenantId) {
          localStorage.setItem('tenantId', tenantId);
          console.log('✅ Tenant ID saved in localStorage');
        } else {
          console.warn('⚠️ No Tenant ID found in the response');
        }

        if (response.data.data.tenant) {
          localStorage.setItem('tenant', JSON.stringify(response.data.data.tenant));
        }

        // 4️⃣ DETERMINE REDIRECT ROUTE
        const redirectPath = getRedirectPath(user, requiresPlanSelection);

        console.log(' Redirection vers:', redirectPath);

        // Small pause for the state to update
        setTimeout(() => {
          router.push(redirectPath);
        }, 100);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;

      console.error(' Login error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      if (error.response) {
        switch (error.response.status) {
          case 400:
            setError('Invalid data');
            break;
          case 401:
            setError('Invalid email or password');
            break;
          case 403:
            setError('Account not authorized or deactivated');
            break;
          case 404:
            setError('User not found');
            break;
          case 500:
            setError('Server error. Please try again later');
            break;
          default:
            setError(error.response.data?.message || 'Login error');
        }
      } else if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please check if backend is running on port 5000');
      } else if (error.request) {
        setError('Unable to reach server. Check your connection');
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // To be implemented later
    console.log('Google login - To be implemented');
    setError('Google login will be available soon');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to pre-fill with test accounts
  const fillTestAccount = (type: 'admin' | 'super_admin') => {
    if (type === 'admin') {
      setFormData({
        email: 'contact@startup.com',
        password: 'startup123'
      });
    } else {
      setFormData({
        email: 'axia@gmail.com',
        password: 'AxiaSolutions'
      });
    }
  };

  return (
    <div >
      <nav className="w-full flex items-center justify-between px-8 py-6 mx-auto text-base  bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div
          className="flex items-center gap-3 text-2xl font-bold font-sans cursor-pointer"
        >
          <ChartNetwork size={40} />
          <span>Axia Workflow</span>
        </div>
        <div className="hidden md:flex items-center gap-10 font-medium text-black text-xl">
          <Link href={"/"}>
            <button className="hover:text-indigo-600 hover:scale-105 transition-all duration-200 hover:font-bold cursor-pointer">Home</button>
          </Link>

        </div>
      </nav>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LOGIN FORM */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Welcome Back
                </h1>
                <p className="text-gray-600">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Social Login */}
              <div className="space-y-4 mb-8">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-medium text-gray-700">
                    Continue with Google
                  </span>
                </button>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@startup.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-800"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">

                  </div>
                  <Link
                    href="/forget"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors ${loading
                    ? 'bg-indigo-500 cursor-not-allowed'
                    : 'bg-indigo-700 hover:bg-blue-700'
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    href="/signup"
                    className="text-indigo-700 font-medium hover:text-blue-800"
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              {/* 👇 TEST BUTTONS ADDITION (optional) */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-2">Test accounts (click to fill)</p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => fillTestAccount('admin')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                  >
                    👤 Admin Test
                  </button>
                  <button
                    type="button"
                    onClick={() => fillTestAccount('super_admin')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                  >
                    👑 Super Admin Test
                  </button>
                </div>
              </div>
            </div>
            {/* RIGHT SIDE - Features */}
            <div className="bg-indigo-700 rounded-2xl shadow-xl p-8 text-white">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Manage Your Workflow</h2>
                <p className="text-blue-100">Optimize your processes with our intelligent platform</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-3xl font-bold">10k+</p>
                  <p className="text-sm text-blue-100">Active Users</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-3xl font-bold">98%</p>
                  <p className="text-sm text-blue-100">Satisfaction</p>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl mb-2">🤖</div>
                  <h4 className="font-semibold mb-1">Integrated AI</h4>
                  <p className="text-sm text-blue-100">Automate complex tasks</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl mb-2">🔒</div>
                  <h4 className="font-semibold mb-1">Security</h4>
                  <p className="text-sm text-blue-100">End-to-end encryption</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl mb-2">⚡</div>
                  <h4 className="font-semibold mb-1">Dynamic Workflow</h4>
                  <p className="text-sm text-blue-100">Real-time adaptation</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl mb-2">💫</div>
                  <h4 className="font-semibold mb-1">Smooth Process</h4>
                  <p className="text-sm text-blue-100">Intuitive interface</p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <Link
                  href="/signup"
                  className="block w-full bg-white text-indigo-600 font-semibold py-3 px-4 rounded-xl text-center hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}