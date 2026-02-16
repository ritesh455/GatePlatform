// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Mail, Lock, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // Import from the new context file

const LoginPage = () => {
  // Use the login function from the context
  const { loginUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const navigate = (path: string) => {
    // We use window.location.pathname to update the URL for the simple router
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    setLoading(true);
    try {
      const result = await loginUser(formData);

      if (result.success) {
        // setSuccess(result.data?.message || "Login successful! Redirecting to dashboard...");
        setSuccess("Login successful! Redirecting to dashboard...");
        // Successful redirection to dashboard
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

  const getInputField = (name: keyof typeof formData, type: string, placeholder: string, Icon: React.ElementType) => (
    <div key={name}>
      <label className="block text-sm font-medium text-slate-700 mb-2 capitalize">{name}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder={placeholder}
          required
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 font-inter">
      <div className="max-w-sm w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-slate-600 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            {getInputField("email", "email", "Enter email or username", Mail)}

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
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-200/50 hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors cursor-pointer"
              >
                Register
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;