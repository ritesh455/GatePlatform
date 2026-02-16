// src/pages/HomePage.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Target, TrendingUp, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react';

const HomePage = () => {
  const objectives = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Adaptive Learning Paths",
      description: "Personalized lessons that adapt to each learner's pace and style."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Real-Time Feedback",
      description: "Instant progress tracking and performance insights to guide your journey."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Personalized Learning Platform",
      description: "Tailored resources and study plans designed specifically for you."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Overcoming System Limitations",
      description: "Dynamic, student-centric learning experience that breaks boundaries."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up & Set Goals",
      description: "Create your account and define your GATE preparation goals."
    },
    {
      number: "02",
      title: "Diagnostic Test",
      description: "Take an initial assessment to determine your starting point."
    },
    {
      number: "03",
      title: "Adaptive Learning",
      description: "Follow your personalized path and track your progress in real-time."
    }
  ];

  const { user, logoutUser } = useAuth();

  const navigate = (path: string) => {
    // We use window.location.pathname to update the URL for the simple router
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span onClick={() => navigate('/')} className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">
                Path2Gate
              </span>
            </div>
            <div className="flex gap-3">
              {user ? (
                // When logged in, show Logout and Go to Dashboard button
                <>
                  <button
                    onClick={() => logoutUser()}
                    className="px-6 py-2 text-slate-700 font-medium hover:text-red-600 transition-colors"
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Go to Dashboard
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2 text-slate-700 font-medium hover:text-blue-600 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Path2Gate
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-slate-700 font-semibold mb-4">
            Your Personalized Path to GATE Success
          </p>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            A personalized GATE exam preparation platform that adapts to your learning style and performance,
            helping you achieve your goals efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-300 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-200 transform hover:scale-105"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Objectives Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Our Objectives
              </span>
            </h2>
            <p className="text-slate-600 text-lg">
              Four pillars that make Path2Gate your ideal GATE preparation partner
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {objectives.map((objective, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 text-white">
                  {objective.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {objective.title}
                </h3>
                <p className="text-slate-600">
                  {objective.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-slate-600 text-lg">
              Start your personalized GATE preparation journey in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-600">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-blue-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-500 to-purple-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Master GATE Your Way?
          </h2>
          <p className="text-xl text-blue-50 mb-8">
            Join Path2Gate today and start your personalized learning journey!
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 inline-flex items-center gap-2"
          >
            Register Now
            <CheckCircle className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Path2Gate</span>
              </div>
              <p className="text-sm text-slate-400">
                Your personalized path to GATE success through adaptive learning and real-time feedback.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a onClick={() => navigate('/about')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    About
                  </a>
                </li>
                <li>
                  <a onClick={() => navigate('/contact')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Contact
                  </a>
                </li>
                <li>
                  <a onClick={() => navigate('/privacy')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a onClick={() => navigate('/terms')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Get Started</h3>
              <p className="text-sm text-slate-400 mb-4">
                Begin your GATE preparation journey today with personalized learning paths.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Join Now
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-sm text-slate-400">
              Copyright © 2025 Path2Gate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;