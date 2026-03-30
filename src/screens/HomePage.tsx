// src/pages/HomePage.tsx
"use client";

export const dynamic = "force-dynamic";
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  BookOpen,
  Target,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const HomePage = () => {
  const { user, logoutUser } = useAuth();

  const objectives = [
    {
      icon: <Target className="w-7 h-7" />,
      title: "Adaptive Learning Paths",
      description:
        "Personalized lessons that adapt to each learner's pace and style.",
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      title: "Real-Time Feedback",
      description:
        "Instant progress tracking and performance insights to guide your journey.",
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: "Personalized Learning Platform",
      description:
        "Tailored resources and study plans designed specifically for you.",
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: "Overcoming System Limitations",
      description:
        "Dynamic, student-centric learning experience that breaks boundaries.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up & Set Goals",
      description:
        "Create your account and define your GATE preparation goals.",
    },
    {
      number: "02",
      title: "Diagnostic Test",
      description:
        "Take an initial assessment to determine your starting point.",
    },
    {
      number: "03",
      title: "Adaptive Learning",
      description:
        "Follow your personalized path and track your progress in real-time.",
    },
  ];

  const navigate = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-6">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <BookOpen className="text-white w-6 h-6" />
            </div>

            <span
              onClick={() => navigate("/")}
              className="text-xl font-bold cursor-pointer"
            >
              Path<span className="text-green-600">2Gate</span>
            </span>
          </div>

          <div className="flex gap-4 items-center">

            {user ? (
              <>
                <button
                  onClick={() => logoutUser()}
                  className="text-slate-600 hover:text-red-500 font-medium"
                >
                  Logout
                </button>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                >
                  Go to Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="text-slate-600 hover:text-green-600"
                >
                  Login
                </button>

                <button
                  onClick={() => navigate("/register")}
                  className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                >
                  Register
                </button>
              </>
            )}

          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-24 px-6 text-center bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-4xl mx-auto">

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            Preparation Platform with
            <span className="text-green-600"> Confidence</span>
          </h1>

          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Personalized learning platform designed to help students prepare
            smarter for the exam using adaptive tests, analytics,
            and structured learning.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">

            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 rounded-xl border border-slate-300 hover:border-green-500 hover:text-green-600 transition"
            >
              Login
            </button>

          </div>

        </div>
      </section>

      {/* OBJECTIVES */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-3">
              Platform Features
            </h2>

            <p className="text-slate-600">
              Everything you need to prepare efficiently for GATE
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {objectives.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-green-100 text-green-600 mb-4">
                  {item.icon}
                </div>

                <h3 className="font-semibold text-lg mb-2">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white px-6">

        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-4xl font-bold mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-xl p-6 border"
              >
                <div className="text-4xl font-bold text-green-600 mb-4">
                  {step.number}
                </div>

                <h3 className="font-semibold text-lg mb-2">
                  {step.title}
                </h3>

                <p className="text-slate-600 text-sm">
                  {step.description}
                </p>
              </div>
            ))}

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="py-20 bg-green-600 text-white text-center px-6">

        <div className="max-w-3xl mx-auto">

          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Your GATE Journey?
          </h2>

          <p className="text-green-100 mb-8">
            Join thousands of students preparing smarter with Path2Gate.
          </p>

          <button
            onClick={() => navigate("/register")}
            className="px-10 py-4 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition flex items-center gap-2 mx-auto"
          >
            Register Now
            <CheckCircle className="w-5 h-5" />
          </button>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6 text-center">
        <p>© 2025 Path2Gate — GATE Preparation Platform</p>
      </footer>

    </div>
  );
};

export default HomePage;