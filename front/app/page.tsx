"use client"
import React from "react";
import {
  CheckCircle2,
  Settings,
  Zap,
  BarChart3,
  ShieldCheck,
  Bell,
  ChevronRight,
  PlayCircle,
  ChartNetwork,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  // Fonction pour le défilement fluide
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <div>
        {/* --- Navigation --- */}
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto text-base sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
          <div className="flex items-center gap-3 text-2xl font-bold font-sans cursor-pointer" onClick={() => scrollToSection('home')}>
            <ChartNetwork size={40} />
            ProWorkflow
          </div>

          <div className="hidden md:flex items-center gap-10 font-medium text-black text-xl">
            <button
              onClick={() => scrollToSection('home')}
              className="hover:text-indigo-600 hover:scale-120 transition-all duration-200 hover:font-bold cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-indigo-600 hover:scale-120 transition-all duration-200 hover:font-bold cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="hover:text-indigo-600 hover:scale-120 transition-all duration-200 hover:font-bold cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-indigo-600 hover:scale-120 transition-all duration-200 hover:font-bold cursor-pointer"
            >
              Documentation
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-indigo-600 hover:scale-120 transition-all duration-200 hover:font-bold cursor-pointer"
            >
              About
            </button>
          </div>

          <div className="flex items-center gap-8">
            <Link href={"/signin"}><button className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:scale-120 transition-all duration-200">
              Login
            </button></Link>
            <Link href={"/signup"}> <button className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:scale-120 transition-all duration-200">
              Get Started
            </button></Link>
           
          </div>
        </nav>

        {/* --- Hero Section (Home) --- */}
        <section id="home" className="relative pt-20 pb-32 overflow-hidden flex gap-10">
          <div>
            <div className="max-w-4xl mx-auto text-center px-4">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-b from-gray-900 to-gray-600 pb-10">
                Dynamic Workflow Management Platform
              </h1>
              <p className="text-xl font-mono text-indigo-500 font-bold mb-10 max-w-2xl mx-auto leading-relaxed">
                Design, Execute, and Monitor Your Business Processes Without
                Code. Boost your marketing and sales productivity with Omeya
                Sale.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link href={"/signup"}><button className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2">
                  Start Free <ChevronRight size={18} />
                </button></Link>
                <button className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                  Sign In
                </button>
              </div>
            </div>
          </div>
          <div>
            <Image
              src="/loadingPageImg.jpg"
              alt="Logo"
              width={500}
              height={350}
            />
          </div>
        </section>
      </div>
      
      {/* --- Features Section --- */}
      <section id="features" className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-white">
                Make quick business growth
              </h2>
              <p className="text-gray-400 mb-8">
                Dashboard platform that was created with the aim of making it
                easier for business people to manage sales data.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                  <Zap className="text-indigo-400 mb-4" />
                  <h3 className="font-bold mb-2 text-white">Publishing</h3>
                  <p className="text-sm text-gray-400">
                    Plan, collaborate, and publish your content.
                  </p>
                </div>
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                  <BarChart3 className="text-indigo-400 mb-4" />
                  <h3 className="font-bold mb-2 text-white">Analytics</h3>
                  <p className="text-sm text-gray-400">
                    Analyze your performance and create reports.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {[
                {
                  title: "Workflow Designer",
                  desc: "No-code visual builder for your processes.",
                  icon: Settings,
                },
                {
                  title: "Dynamic Forms",
                  desc: "Create checklists and smart forms instantly.",
                  icon: CheckCircle2,
                },
                {
                  title: "Smart Notifications",
                  desc: "Real-time alerts for every validation step.",
                  icon: Bell,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 items-start p-4 hover:bg-gray-800 rounded-xl transition border border-transparent hover:border-gray-700"
                >
                  <div className="p-3 bg-indigo-900 rounded-lg text-indigo-400">
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white">
                      {item.title}
                    </h4>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* --- How it works Section (Documentation) --- */}
      <section id="how-it-works" className="py-5 bg-white pb-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-16 text-gray-900 text-center pt-10">
            How It Works
          </h2>
          <div className="grid col-2">
            <div className="grid md:grid-cols-2 gap-25">
              <div>
                <h2 className="font-mono text-indigo-500 font-bold mb-2 max-w-2xl mx-auto leading-relaxed text-xl">Step 1: Create your workflow</h2>
                <p className="text-gray-900 font-sans pb-3 text-base">
                  Design your workflow in minutes using our intuitive builder.
                  Define each step of your process, assign roles, and structure
                  the flow according to your organization’s needs.
                </p>
              </div>

              <div>
                <h2 className="font-mono text-indigo-500 font-bold mb-2 max-w-2xl mx-auto leading-relaxed text-xl">Step 2: Configure forms & rules</h2>
                <p className="text-gray-900 font-sans pb-3 text-base">
                  Customize dynamic forms and automate decisions with smart
                  rules. Collect the exact data you need and define conditions
                  that control how the workflow behaves.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-25">
              <div>
                <h2 className="font-mono text-indigo-500 font-bold mb-2 max-w-2xl mx-auto leading-relaxed text-xl">Step 3: Execute & monitor</h2>
                <p className="text-gray-900 font-sans pb-3 text-base">
                  Launch your workflow and track everything in real time. Users
                  interact with forms, approvals move forward, and every action
                  is logged securely.
                </p>
              </div>
              <div>
                <h2 className="font-mono text-indigo-500 font-bold mb-2 max-w-2xl mx-auto leading-relaxed text-xl">Step 4: Analyze & optimize</h2>
                <p className="text-gray-900 font-sans pb-3 text-base">
                  Use data and insights to continuously improve your processes.
                  Access performance metrics, identify bottlenecks, and refine
                  your workflow for maximum efficiency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* --- Pricing Section --- */}
      <section id="pricing" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold mb-16 text-white">
            Plan & Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <PriceCard
              title="Demo Plan"
              price="0"
              features={[
                "Up to 5 staff",
                "Up to 5 locations",
                "Fixed analysis",
              ]}
            />
            <PriceCard
              title="Starter plan"
              price="79"
              features={[
                "Up to 10 staff",
                "Up to 10 locations",
                "Pro analysis",
                "Professional reports",
              ]}
              active
            />
            <PriceCard
              title="Pro Plan"
              price="299"
              features={[
                "Unlimited staff",
                "Global locations",
                "Advanced AI",
                "Custom support",
              ]}
            />
          </div>
        </div>
      </section>

      {/* --- Footer (About) --- */}
      <footer id="about" className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div>
            <span className="font-bold text-lg mb-6 text-gray-900 flex gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
              <ChartNetwork size={25} /> ProWorkflow
            </span>
            <p className="text-sm text-gray-500">
              The world's first no-code workflow management for scaling
              businesses.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gray-900">Product</h4>
            <ul className="text-sm text-gray-500 space-y-2">
              <li 
                onClick={() => scrollToSection('features')}
                className="hover:text-indigo-600 cursor-pointer transition"
              >
                Features
              </li>
              <li 
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-indigo-600 cursor-pointer transition"
              >
                Integrations
              </li>
              <li 
                onClick={() => scrollToSection('pricing')}
                className="hover:text-indigo-600 cursor-pointer transition"
              >
                Updates
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gray-900">Legal</h4>
            <ul className="text-sm text-gray-500 space-y-2">
              <li className="hover:text-indigo-600 cursor-pointer transition">
                Privacy Policy
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition">
                Terms of Service
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition">
                Cookie Policy
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gray-900">Contact</h4>
            <ul className="text-sm text-gray-500 space-y-2">
              <li className="hover:text-indigo-600 cursor-pointer transition">
                ProWorkflow@gmail.com
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition">
                +216 99-664-020
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-8">
          © 2024 ProWorkflow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// Composant Carte de Prix
function PriceCard({
  title,
  price,
  features,
  active = false,
}: {
  title: string;
  price: string;
  features: string[];
  active?: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-3xl border ${active ? "border-indigo-600 ring-4 ring-indigo-50 shadow-2xl scale-105 bg-white" : "border-gray-200 bg-white"}`}
    >
      <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>
      <div className="mb-6">
        <span className="text-4xl font-extrabold text-gray-900">{price}D</span>
        <span className="text-gray-400">/month</span>
      </div>
      <ul className="space-y-4 mb-8 text-left">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
            <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" /> {f}
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-3 rounded-xl font-bold transition ${active ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
      >
        Choose Plan
      </button>
    </div>
  );
}