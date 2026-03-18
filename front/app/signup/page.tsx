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
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

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
        if (cleaned.length > 2) {
          setPaymentDetails(prev => ({ ...prev, [name]: `${cleaned.slice(0, 2)}/${cleaned.slice(2)}` }));
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
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

      <nav className="w-full flex items-center justify-between px-8 py-6 mx-auto text-base bg-white/95 backdrop-blur-sm z-40 border-b border-gray-100">
        <div className="flex items-center gap-3 text-2xl font-bold font-sans cursor-pointer">
          <ChartNetwork size={40} />
          <span>Axia Workflow</span>
        </div>
        <div className="hidden md:flex items-center gap-10 font-medium text-black text-xl">
          <Link href={"/"}>
            <button className="hover:text-indigo-600 transition-all">Home</button>
          </Link>
        </div>
      </nav>

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
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isSuperAdmin ? 'Full Name *' : 'Company Name *'}
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder={isSuperAdmin ? "Your full name" : "Your company name"}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    required
                    disabled={loading}
                  />
                </div>

                {!isSuperAdmin && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div 
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => setShowDebug(!showDebug)}
                      >
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Debug Protocol: Start Date</span>
                          <div className={`w-8 h-4 rounded-full transition-colors relative ${showDebug ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showDebug ? 'right-0.5' : 'left-0.5'}`}></div>
                          </div>
                      </div>
                      {showDebug && (
                          <div className="mt-4">
                              <input 
                                  type="date" 
                                  name="startDate"
                                  value={formData.startDate}
                                  onChange={handleChange}
                                  className="w-full px-4 py-2 border border-indigo-200 rounded-lg text-sm font-bold text-slate-700 bg-white"
                              />
                          </div>
                      )}
                  </div>
                )}

                {!isSuperAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry *
                    </label>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      required
                      disabled={loading}
                    >
                      <option value="Construction & Engineering">Construction & Engineering</option>
                      <option value="Information Technology & Software">Information Technology & Software</option>
                      <option value="Corporate & Business Services">Corporate & Business Services</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    placeholder="admin@company.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    required
                    disabled={loading}
                  />
                </div>

                {!isSuperAdmin && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose your plan *
                    </label>
                    {loadingPlans ? (
                      <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-700"></div>
                        <span className="text-gray-600">Loading plans...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {plans.map((plan) => (
                          <label
                            key={plan._id}
                            onClick={() => handlePlanSelection(plan._id)}
                            className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.planId === plan._id
                                ? 'border-indigo-700 bg-blue-50'
                                : 'border-gray-200 hover:border-indigo-500'
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
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                                <p className="text-sm text-gray-600">
                                  {plan.features?.maxStaff === -1
                                    ? '👥 Unlimited staff'
                                    : `👥 Up to ${plan.features?.maxStaff} staff`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatPrice(plan.price, plan.currency, plan.interval)}
                                </p>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || loadingPlans}
                  className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors ${loading || loadingPlans
                    ? 'bg-indigo-500 cursor-not-allowed'
                    : 'bg-indigo-700 hover:bg-indigo-800'
                    }`}
                >
                  {loading ? "Creating Account..." : isSuperAdmin ? "Create Super Admin" : "Start Free Trial"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link href="/signin" className="text-indigo-700 font-medium hover:text-indigo-800">
                    Log in
                  </Link>
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - PLANS PREVIEW */}
            <div className="bg-indigo-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              
              <div className="relative z-10 mb-8">
                <h1 className="text-3xl font-black mb-4 tracking-tight">
                  {isSuperAdmin ? 'Platform Control' : 'Choose your protocol'}
                </h1>
                <p className="text-blue-100 font-medium">
                  {isSuperAdmin 
                    ? 'Global administration for the entire Axia Workflow ecosystem.' 
                    : 'Dynamic orchestration tiers for your workflow.'}
                </p>
              </div>

              <div className="space-y-4 relative z-10">
                {isSuperAdmin ? (
                  <div className="space-y-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                       <h3 className="font-bold text-lg mb-2">🛡️ Tenant Management</h3>
                       <p className="text-sm text-blue-100">Oversee all companies and manage global subscriptions.</p>
                    </div>
                  </div>
                ) : (
                  !loadingPlans && plans.map((plan) => {
                    const isDemo = (plan.code || '').toLowerCase().includes('demo');
                    return (
                      <div key={plan._id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 group hover:bg-white/15 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-lg tracking-tight">{plan.name}</h3>
                            <p className="text-xs text-blue-100 font-medium">
                                {plan.features?.maxStaff === -1 ? 'Unlimited Staff' : `Up to ${plan.features?.maxStaff} Staff`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black tracking-tighter">
                                {formatPrice(plan.price, plan.currency, plan.interval)}
                            </p>
                            <span className="text-[10px] uppercase font-bold text-blue-200">
                                {plan.trialDays ? `${plan.trialDays}-Day Trial` : (isDemo ? '7-Day Trial' : '30-Day Trial')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {!isSuperAdmin && (
                <div className="mt-8 relative z-10 bg-indigo-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5">
                  <p className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-300 mb-4">Lattice Standards:</p>
                  <ul className="space-y-3 text-xs font-bold text-blue-100">
                    <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        Flexible Free trials (7-30 days)
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        Zero-friction cancellation
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        24/7 Security support
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
