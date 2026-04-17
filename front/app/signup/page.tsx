"use client";

const API_URL = 'http://localhost:5000/api';

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import {
  ChartNetwork,
  CreditCard,
  X,
  Lock,
  Calendar,
  User,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

interface SignupFormData {
  companyName: string;
  adminEmail: string;
  industry: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  planId: string;
  startDate?: string;
}

interface PaymentDetails {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

interface Plan {
  _id: string;
  name: string;
  code: string;
  price: number;
  currency: string;
  interval: string;
  trialDays?: number;
  features: {
    maxStaff: number;
    maxLocations: number;
    analysis: string;
    reports: boolean;
    aiSupport: boolean;
    customSupport: boolean;
  };
}

interface ApiErrorResponse {
  message?: string;
  success?: boolean;
  errors?: string[];
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    companyName: "",
    adminEmail: "",
    industry: "Other",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    planId: "",
    startDate: new Date().toISOString().split('T')[0], // Default to today
  });


  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: ""
  });

  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'admin';
  const isSuperAdmin = role === 'super_admin';

  // ✅ LOAD PLANS AT STARTUP
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        console.log("📦 Loading plans...");
        const response = await axios.get("http://localhost:5000/api/plans");
        console.log("✅ Plans received:", response.data);

        if (response.data.success && response.data.data) {
          setPlans(response.data.data);
          // Select the first plan by default
          if (response.data.data.length > 0) {
            const demoPlan = response.data.data.find((p: Plan) => p.code === 'DEMO' || p.price === 0);
            setFormData(prev => ({
              ...prev,
              planId: demoPlan ? demoPlan._id : response.data.data[0]._id
            }));
          }
        }
      } catch (error) {
        console.error("❌ Error loading plans:", error);
        setError("Unable to load plans. Please refresh the page.");
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const handleGoogleLoginSuccess = async (response: any) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/auth/google-login`, {
        idToken: response.credential
      });

      if (res.data.success) {
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success(`Access Granted: ${user.firstName || 'User'}`, { icon: '🔓' });
        router.push(user.role === 'super_admin' ? '/super_admin' : '/admin');
      }
    } catch (err: any) {
      console.error('❌ Google Registration Search failed:', err);
      const msg = err.response?.data?.message || 'Google verification failed';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    toast.error("Google authentication failed.");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePaymentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Format card number with spaces
    if (name === "cardNumber") {
      const cleaned = value.replace(/\s/g, "");
      if (cleaned.length <= 16) {
        const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
        setPaymentDetails(prev => ({ ...prev, [name]: formatted }));
      }
      return;
    }

    // Format expiry date (MM/YY)
    if (name === "expiryDate") {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length <= 4) {
        const isDeleting = value.length < paymentDetails.expiryDate.length;
        if (cleaned.length >= 2) {
          const monthStr = cleaned.slice(0, 2);
          const month = parseInt(monthStr);
          const validMonthStr = month > 12 ? '12' : monthStr;

          if (cleaned.length > 2) {
            setPaymentDetails(prev => ({ ...prev, [name]: `${validMonthStr}/${cleaned.slice(2)}` }));
          } else if (cleaned.length === 2) {
            if (isDeleting) {
              setPaymentDetails(prev => ({ ...prev, [name]: validMonthStr }));
            } else {
              setPaymentDetails(prev => ({ ...prev, [name]: `${validMonthStr}/` }));
            }
          }
        } else {
          setPaymentDetails(prev => ({ ...prev, [name]: cleaned }));
        }
      }
      return;
    }

    // Limit CVV to 3-4 digits
    if (name === "cvv") {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length <= 4) {
        setPaymentDetails(prev => ({ ...prev, [name]: cleaned }));
      }
      return;
    }

    setPaymentDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePlanSelection = (planId: string) => {
    setFormData(prev => ({ ...prev, planId }));
    const plan = plans.find(p => p._id === planId);
    setSelectedPlan(plan || null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!formData.companyName.trim()) {
      setError(isSuperAdmin ? "Full name is required" : "Company name is required");
      return;
    }

    if (!formData.adminEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!isSuperAdmin && !formData.planId) {
      setError("Please select a plan");
      return;
    }

    const selectedPlan = plans.find(p => p._id === formData.planId);

    // If super admin or free plan, proceed directly
    if (isSuperAdmin || (selectedPlan && selectedPlan.price === 0)) {
      await registerUser();
    } else if (selectedPlan && selectedPlan.price > 0) {
      setSelectedPlan(selectedPlan);
      setShowPaymentModal(true);
    } else {
      // Default fallback
      await registerUser();
    }
  };

  const handlePaymentSubmit = async () => {
    setError("");
    // Validate payment details
    const cardNumberClean = paymentDetails.cardNumber.replace(/\s/g, "");
    if (cardNumberClean.length !== 16) {
      setError("Please enter a valid 16-digit card number");
      return;
    }

    if (!paymentDetails.cardHolder.trim()) {
      setError("Please enter the card holder name");
      return;
    }

    const expiryClean = paymentDetails.expiryDate.replace("/", "");
    if (expiryClean.length !== 4) {
      setError("Please enter a valid expiry date (MM/YY)");
      return;
    }

    const m = parseInt(expiryClean.slice(0, 2));
    const y = parseInt(expiryClean.slice(2)) + 2000;
    const now = new Date();
    const expiry = new Date(y, m - 1, 1);
    
    if (m < 1 || m > 12) {
      setError("Invalid month (01-12)");
      return;
    }

    if (expiry < new Date(now.getFullYear(), now.getMonth(), 1)) {
      setError("This card has expired");
      return;
    }

    if (paymentDetails.cvv.length < 3) {
      setError("Please enter a valid CVV");
      return;
    }

    // For demo purposes, log payment details
    console.log("💰 Payment details:", {
      ...paymentDetails,
      cardNumber: `**** **** **** ${cardNumberClean.slice(-4)}`,
      plan: selectedPlan?.name
    });

    // Close modal and proceed with registration
    setShowPaymentModal(false);
    await registerUser();
  };

  const registerUser = async () => {
    console.log('🔄 Registration triggered at:', new Date().toISOString());
    setLoading(true);
    try {
      const endpoint = isSuperAdmin ? '/api/auth/register-super-admin' : '/api/auth/register';
      const payload = isSuperAdmin ? {
        email: formData.adminEmail,
        password: formData.password,
        firstName: formData.companyName || 'Super',
        lastName: 'Admin'
      } : {
        companyName: formData.companyName,
        adminEmail: formData.adminEmail,
        industry: formData.industry,
        password: formData.password,
        planId: formData.planId,
        startDate: formData.startDate
      };

      console.log(`📤 Sending ${role} registration to:`, endpoint);

      const response = await axios.post(
        `http://localhost:5000${endpoint}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("✅ Registration response:", response.data);

      if (response.data.success) {
        setSuccess(isSuperAdmin ? "Super Admin account created!" : "Company created successfully");

        // Save plan info locally for immediate fallback on billing page
        if (!isSuperAdmin && formData.planId) {
          localStorage.setItem('planStartDate', formData.startDate || new Date().toISOString());
          const planCode = plans.find(p => p._id === formData.planId)?.code.toLowerCase();
          if (planCode) localStorage.setItem('selectedPlan', planCode);
        }

        setTimeout(() => {
          router.push("/signin");
        }, 3000);
      }
    } catch (err: any) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error("❌ Registration error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        url: error.config?.url
      });

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        setError(error.response.data.errors.join(", "));
      } else if (error.code === 'ECONNREFUSED') {
        setError("Cannot connect to server. Please check if backend is running.");
      } else {
        setError("An error occurred during registration");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'D', interval: string = 'month') => {
    if (price === 0) return 'Free';
    return `${price}${currency}/${interval}`;
  };

  return (
    <div className="min-h-screen">
      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Selected Plan:</p>
                    <p className="font-semibold text-gray-900">{selectedPlan.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Price:</p>
                    <p className="font-bold text-indigo-700">
                      {formatPrice(selectedPlan.price, selectedPlan.currency, selectedPlan.interval)}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handlePaymentSubmit(); }}>
                <div className="space-y-4">
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentDetails.cardNumber}
                        onChange={handlePaymentChange}
                        placeholder="1234 5678 9012 3456"
                        className="w-full pr-4 pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        maxLength={19}
                        required
                      />
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Holder Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="cardHolder"
                        value={paymentDetails.cardHolder}
                        onChange={handlePaymentChange}
                        placeholder="John Doe"
                        className="w-full pr-4 pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        required
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="expiryDate"
                          value={paymentDetails.expiryDate}
                          onChange={handlePaymentChange}
                          placeholder="MM/YY"
                          className="w-full pr-4 pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          maxLength={5}
                          required
                        />
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="cvv"
                          value={paymentDetails.cvv}
                          onChange={handlePaymentChange}
                          placeholder="123"
                          className="w-full pr-4 pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          maxLength={4}
                          required
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lock size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600">
                        This is a demo. No actual payment will be processed. Your card information is securely handled.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-800 transition-colors"
                    >
                      Confirm & Create Account
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm z-50">
        <ArrowLeft size={16} /> Home
      </Link>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SIGNUP FORM */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {isSuperAdmin ? 'Create Super Admin Account' : 'Create Account'}
                </h1>
                <p className="text-gray-600">
                  {isSuperAdmin ? 'Access the global control center' : 'Start your free trial'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-xs font-bold">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-600 text-xs font-bold">{success}</p>
                </div>
              )}

              {/* Social Signup */}
              <div className="space-y-4 mb-8 flex justify-center w-full">
                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes("PASTE_YOUR_ID_HERE") ? (
                  <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginError}
                    shape="pill"
                    width="350"
                    theme="outline"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => toast.error("Configuration Requise", {
                      description: "Veuillez remplacer 'PASTE_YOUR_ID_HERE' par votre Client ID réel dans le fichier .env.local",
                      duration: 5000
                    })}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md group active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="font-bold text-gray-700 tracking-tight">
                      Continue with Google
                    </span>
                  </button>
                )}
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-slate-400 font-bold uppercase tracking-widest">or register manually</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={isSuperAdmin ? "col-span-2" : ""}>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                      {isSuperAdmin ? 'Full Name *' : 'Company Name *'}
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder={isSuperAdmin ? "Your name" : "Axia Corp"}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 text-sm text-gray-900 transition-all"
                      required
                    />
                  </div>

                  {!isSuperAdmin && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                        Industry *
                      </label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 text-sm text-gray-900 transition-all appearance-none"
                        required
                      >
                        <option value="Construction">Construction</option>
                        <option value="Tech/IT">Tech/IT</option>
                        <option value="Business">Business</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      placeholder="admin@axia.io"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 text-sm text-gray-900 transition-all"
                      required
                    />
                  </div>

                  {/* {!isSuperAdmin && (
                    <div className="col-span-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                        Lock Start Date?
                      </label>
                      <div 
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => setShowDebug(!showDebug)}
                      >
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Protocol Lock</span>
                        <div className={`w-8 h-4 rounded-full transition-colors relative ${showDebug ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showDebug ? 'right-0.5' : 'left-0.5'}`}></div>
                        </div>
                      </div>
                    </div>
                  )} */}
                </div>

                {showDebug && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input 
                      type="date" 
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/30"
                    />
                  </div>
                )}

                {/* Plan Selection Tier */}
                {!isSuperAdmin && (
                  <div className="space-y-2 mt-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Choose Your Protocol *
                    </label>
                    {loadingPlans ? (
                      <div className="flex gap-2">
                        {[1,2,3].map(i => <div key={i} className="h-16 flex-1 bg-slate-100 animate-pulse rounded-xl" />)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {plans.map((plan) => (
                          <label
                            key={plan._id}
                            onClick={() => handlePlanSelection(plan._id)}
                            className={`block p-3 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center group relative overflow-hidden ${formData.planId === plan._id
                                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                              }`}
                          >
                            <input
                              type="radio"
                              name="planId"
                              value={plan._id}
                              checked={formData.planId === plan._id}
                              readOnly
                              className="sr-only"
                            />
                            <p className={`text-[10px] font-black uppercase truncate duration-200 ${formData.planId === plan._id ? 'text-indigo-700' : 'text-slate-500'}`}>
                              {plan.name}
                            </p>
                            <p className={`text-[13px] font-black mt-1 ${formData.planId === plan._id ? 'text-indigo-900' : 'text-slate-900'}`}>
                              {plan.price === 0 ? 'FREE' : `${plan.price}${plan.currency || 'D'}`}
                            </p>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Password Grid */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Access Key</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 8 chars"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 text-sm text-gray-900 transition-all"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Confirm Key</label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat key"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 text-sm text-gray-900 transition-all"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || loadingPlans}
                  className={`w-full text-white font-black uppercase tracking-widest py-4 px-6 rounded-full transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-indigo-200 mt-4 ${loading || loadingPlans
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5'
                    }`}
                >
                  {loading ? "Initializing..." : isSuperAdmin ? "Create Super Admin" : "Deploy Network"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Existing protocol?{" "}
                  <Link href="/signin" className="text-indigo-700 font-bold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - Image & Vision */}
            <div className="hidden lg:flex flex-col justify-center bg-slate-900 rounded-2xl overflow-hidden shadow-2xl min-h-[600px] p-4">
              <div className="relative w-full h-full min-h-[400px]">
                <Image 
                  src="/loadingPageImg.jpg" 
                  alt="Axia Workflow Intelligence" 
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="p-8 w-full mt-4">
                <div className="backdrop-blur-md bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-xl">
                  <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                    Architect Your Future
                  </h2>
                  <p className="text-indigo-200 text-xs font-medium leading-relaxed">
                    Start your journey with the world's most advanced no-code workflow environment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
