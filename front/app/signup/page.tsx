"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import {
  ChartNetwork
} from "lucide-react";

interface SignupFormData {
  companyName: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  planId: string;
}

interface Plan {
  _id: string;
  name: string;
  code: string;
  price: number;
  currency: string;
  interval: string;
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
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    planId: "",
  });
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const router = useRouter();

  // ✅ CHARGER LES PLANS AU DÉMARRAGE
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        console.log("📦 Chargement des plans...");
        const response = await axios.get("http://localhost:5000/api/plans");
        console.log("✅ Plans reçus:", response.data);
        
        if (response.data.success && response.data.data) {
          setPlans(response.data.data);
          // Sélectionner le premier plan par défaut (souvent le plan gratuit)
          if (response.data.data.length > 0) {
            // Chercher le plan DEMO (gratuit) en priorité
            const demoPlan = response.data.data.find((p: Plan) => p.code === 'DEMO' || p.price === 0);
            setFormData(prev => ({ 
              ...prev, 
              planId: demoPlan ? demoPlan._id : response.data.data[0]._id 
            }));
          }
        }
      } catch (error) {
        console.error("❌ Erreur chargement plans:", error);
        setError("Impossible de charger les plans. Veuillez rafraîchir la page.");
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.agreeTerms) {
      setError("You must agree to the Terms & Privacy");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!formData.companyName.trim()) {
      setError("Company name is required");
      return;
    }

    if (!formData.adminEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.planId) {
      setError("Please select a plan");
      return;
    }

    setLoading(true);

    try {
      console.log("📤 Envoi inscription avec plan:", formData.planId);
      
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          companyName: formData.companyName,
          adminEmail: formData.adminEmail,
          password: formData.password,
          planId: formData.planId,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("✅ Réponse inscription:", response.data);

      if (response.data.success) {
        setSuccess("Company created successfully! Redirecting to dashboard...");

        // ✅ SAUVEGARDER LES INFORMATIONS UTILISATEUR
        if (response.data.data.token) {
          localStorage.setItem("auth_token", response.data.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.data.user));
          
          // Optionnel: sauvegarder aussi le tenant
          if (response.data.data.tenant) {
            localStorage.setItem("tenant", JSON.stringify(response.data.data.tenant));
          }
        }

        // Redirection
       
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error(" Erreur inscription:", error.response?.data || error.message);
      
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

  // Fonction pour formater le prix
  const formatPrice = (price: number, currency: string = 'D', interval: string = 'month') => {
    if (price === 0) return 'Free';
    return `${price}${currency}/${interval}`;
  };

  return (
    <div>
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
          {/* SIGNUP FORM */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Create Account
              </h1>
              <p className="text-gray-600">
                Start your 15-day free trial
              </p>
            </div>

            {/* Error and Success Messages */}
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your company name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                  disabled={loading}
                />
              </div>

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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                  disabled={loading}
                />
              </div>

              {/* SÉLECTION DE PLAN - STYLISÉ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose your plan *
                </label>
                {loadingPlans ? (
                  <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Loading plans...</span>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-600 text-sm">No plans available. Please contact support.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <label
                        key={plan._id}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.planId === plan._id
                            ? 'border-indigo-700 bg-blue-50'
                            : 'border-gray-200 hover:border-indigo-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="planId"
                          value={plan._id}
                          checked={formData.planId === plan._id}
                          onChange={handleChange}
                          className="sr-only"
                          required
                        />
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                            <p className="text-sm text-gray-600">
                              {plan.features?.maxStaff === -1 
                                ? '👥 Unlimited staff' 
                                : `👥 Up to ${plan.features?.maxStaff} staff`}
                              {' • '}
                              {plan.features?.analysis}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {formatPrice(plan.price, plan.currency, plan.interval)}
                            </p>
                            {plan.price > 0 && (
                              <p className="text-xs text-green-600">15-day free trial</p>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-gray-500">
                  15-day free trial on all paid plans • No credit card required
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-900"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                   
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-900"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {/* {showConfirmPassword ? "👁️" : "👁️‍🗨️"} */}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || loadingPlans}
                className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors ${
                  loading || loadingPlans
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
                    Creating Account...
                  </span>
                ) : (
                  "Start Free Trial"
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-indigo-700 font-medium hover:text-blue-800"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - PLANS PREVIEW */}
          <div className="bg-indigo-700  rounded-2xl shadow-xl p-8 text-white">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">
                Choose the perfect plan for you
              </h1>
              <p className="text-blue-100">
                15-day free trial on all plans • No credit card required
              </p>
            </div>

            {/* Plans Preview */}
            <div className="space-y-4">
              {!loadingPlans && plans.map((plan) => (
                <div key={plan._id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-sm text-blue-100">
                        {plan.features?.maxStaff === -1 
                          ? 'Unlimited staff' 
                          : `Up to ${plan.features?.maxStaff} staff`}
                        {' • '}
                        {plan.features?.maxLocations === -1 
                          ? 'Unlimited locations' 
                          : `Up to ${plan.features?.maxLocations} locations`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {formatPrice(plan.price, plan.currency, plan.interval)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-green-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-400/30">
              <p className="font-semibold">✨ All plans include:</p>
              <ul className="mt-2 text-sm text-blue-100 space-y-1">
                <li>✓ 15-day free trial</li>
                <li>✓ Cancel anytime</li>
                <li>✓ Email support</li>
                <li>✓ Regular updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    
  );
}