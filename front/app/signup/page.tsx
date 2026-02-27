"use client";

const API_URL = 'http://localhost:5000/api';

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import {
  ChartNetwork,
  CreditCard,
  X,
  Lock,
  Calendar,
  User
} from "lucide-react";

interface SignupFormData {
  companyName: string;
  adminEmail: string;
  industry: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  planId: string;
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
  const router = useRouter();

  // ✅ LOAD PLANS AT STARTUP
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        console.log("📦 Loading plans...");
        const response = await axios.get('http://localhost:5000/api/plans');
        console.log("✅ Plans received:", response.data);

        if (response.data.success && response.data.data) {
          setPlans(response.data.data);
          // Select the first plan by default (often the free plan)
          if (response.data.data.length > 0) {
            // Look for the DEMO (free) plan as priority
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

    const selectedPlan = plans.find(p => p._id === formData.planId);

    // If paid plan selected, show payment modal
    if (selectedPlan && selectedPlan.price > 0) {
      setSelectedPlan(selectedPlan);
      setShowPaymentModal(true);
    } else {
      // For free plan, proceed directly
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
    setLoading(true);
    try {
      console.log("📤 Sending registration with plan:", formData.planId);

      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        {
          companyName: formData.companyName,
          adminEmail: formData.adminEmail,
          industry: formData.industry,
          password: formData.password,
          planId: formData.planId,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("✅ Registration response:", response.data);

      if (response.data.success) {
        setSuccess("Company created successfully");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/signin");
        }, 3000);
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error("❌ Registration error:", error.response?.data || error.message);

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

  // Function to format the price
  const formatPrice = (price: number, currency: string = 'D', interval: string = 'month') => {
    if (price === 0) return 'Free';
    return `${price}${currency}/${interval}`;
  };

  return (
    <div>
      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        maxLength={19}
                        required
                      />
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>

                  {/* Card Holder */}
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
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        required
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>

                  {/* Expiry Date and CVV */}
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
                          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
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
                          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          maxLength={4}
                          required
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lock size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600">
                        This is a demo. No actual payment will be processed. Your card information is securely handled.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    required
                    disabled={loading}
                  >
                    <option value="Construction & Engineering ">Construction & Engineering </option>
                    <option value="Information Technology & Software">Information Technology & Software</option>
                    <option value="Corporate & Business Services">Corporate & Business Services</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                  </select>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    required
                    disabled={loading}
                  />
                </div>

                {/* PLAN SELECTION - STYLED */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose your plan *
                  </label>
                  {loadingPlans ? (
                    <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-700"></div>
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
                            onChange={() => { }}
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
                          {plan.price > 0 && formData.planId === plan._id && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-indigo-700">
                              <CreditCard size={14} />
                              <span>Payment required</span>
                            </div>
                          )}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12 text-gray-900"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {/* Add eye icon here if needed */}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12 text-gray-900"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {/* Add eye icon here if needed */}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || loadingPlans}
                  className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors ${loading || loadingPlans
                      ? 'bg-indigo-500 cursor-not-allowed'
                      : 'bg-indigo-700 hover:bg-indigo-800'
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
                    className="text-indigo-700 font-medium hover:text-indigo-800"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - PLANS PREVIEW */}
            <div className="bg-indigo-700 rounded-2xl shadow-xl p-8 text-white">
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
                    {plan.price > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-blue-200">
                        <CreditCard size={12} />
                        <span>Secure payment required</span>
                      </div>
                    )}
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