// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Mail, Lock, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const { loginUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
const router = useRouter();
  // --- Real-time Validation State ---
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const emailError = touched.email && formData.email && !validateEmail(formData.email) 
    ? "Please enter a valid email address" 
    : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const navigate = (path: string) => {
  if (typeof window !== "undefined") {
    router.push(path);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      setError("Please provide a valid email.");
      setTouched({ email: true });
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await loginUser(formData);
      if (result.success) {
        setSuccess("Login successful! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1200);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const getInputField = (name: keyof typeof formData, type: string, placeholder: string, Icon: React.ElementType) => {
    const isEmail = name === "email";
    const hasError = isEmail && emailError;

    return (
      <div key={name}>
        <label className="block text-sm font-medium text-slate-700 mb-2 capitalize">{name}</label>
        <div className="relative">
          <Icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${hasError ? 'text-red-400' : 'text-slate-400'}`} />
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            onBlur={() => handleBlur(name)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 transition-all outline-none ${
              hasError 
                ? 'border-red-500 focus:ring-red-100' 
                : 'border-slate-300 focus:ring-green-500 focus:border-green-500'
            }`}
            placeholder={placeholder}
            required
          />
        </div>
        {hasError && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {emailError}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 font-inter">
      <div className="max-w-sm w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Welcome <span className="text-green-600">Back</span>
            </h1>
            <p className="text-slate-600 mt-2">Sign in to Path2Gate</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            {getInputField("email", "email", "Enter your email", Mail)}

            {/* Password */}
            {getInputField("password", "password", "Enter your password", Lock)}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm font-medium">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200/50 hover:bg-green-700 transition-all duration-200 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              Don't have an account?{" "}
              <a
                onClick={() => navigate("/register")}
                className="text-green-600 hover:text-green-700 font-semibold transition-colors cursor-pointer"
              >
                Register
              </a>
              <p
               onClick={() => navigate("/system-admin/admin-login")}
              >
                System-admin-login
              </p>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;