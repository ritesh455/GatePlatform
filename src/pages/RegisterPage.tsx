// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { User, Mail, Lock, BookOpen, Phone, Upload, Loader2, MapPin, Map } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // Import from the new context file

// Define types for component safety
type Role = "student" | "admin";
interface FormDataState {
  username: string;
  email: string;
  password: string;
  role: Role;
  branch: string;
  gender: string;
  city: string;
  state: string;
  phone: string;
}

const branches = ["CSE", "DS", "Civil", "EE", "ENTC"];

const RegisterPage = () => {
  const { registerUser } = useAuth();

  const [formData, setFormData] = useState<FormDataState>({
    username: "",
    email: "",
    password: "",
    role: "student",
    branch: "CSE",
    gender: "male",
    city: "",
    state: "",
    phone: "",
  });

  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const fd = new FormData();
      // Append common fields
      fd.append("username", formData.username);
      fd.append("email", formData.email);
      fd.append("password", formData.password);
      fd.append("role", formData.role);

      if (formData.role === "student") {
        // Append student-specific fields
        fd.append("branch", formData.branch);
        fd.append("gender", formData.gender);
        fd.append("city", formData.city);
        fd.append("state", formData.state);
      } else {
        // Append admin-specific fields
        fd.append("phone", formData.phone);
        fd.append("branch", formData.branch);

        // CRITICAL: Backend (authRoutes.js) expects 'degree_file'
        if (degreeFile) {
          fd.append("degree_file", degreeFile);
        } else {
          // If admin, file is required (validation should catch this, but good practice)
          setLoading(false);
          return setError("M.Tech degree file is required for admins.");
        }
      }

      const result = await registerUser(fd);

      if (result.success) {
        // Check if this was an admin registration (request_status will be 'pending')
        if (formData.role === "admin") {
          setSuccess("Registration successful! Your request is pending admin approval. Please wait for confirmation.");
          // Redirect to login after a delay
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          // Student registration - redirect to dashboard
          setSuccess("Registration successful! Redirecting to dashboard...");
          setTimeout(() => {
            navigate("/login");
          }, 1200);
        }
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDegreeFile(file);
    }
  };

  const getInputField = (name: keyof FormDataState, type: string, placeholder: string, Icon: React.ElementType, required: boolean = true) => (
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
          required={required}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 font-inter">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              GATE Prep Pro
            </h1>
            <p className="text-slate-600 mt-2">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Register As</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: "student" }))}
                  className={`flex-1 py-3 rounded-xl shadow-md transition-all font-semibold ${
                    formData.role === "student"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent scale-[1.02]"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:shadow-lg"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: "admin" }))}
                  className={`flex-1 py-3 rounded-xl shadow-md transition-all font-semibold ${
                    formData.role === "admin"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent scale-[1.02]"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:shadow-lg"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Core Fields */}
            {getInputField("username", "text", "Enter your username", User)}
            {getInputField("email", "email", "Enter your email", Mail)}
            {getInputField("password", "password", "Enter your password", Lock)}

            {/* Student Fields */}
            {formData.role === "student" && (
              <>
                {/* Branch */}
                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full py-3 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none"
                    required
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full py-3 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* City and State */}
                <div className="grid grid-cols-2 gap-4">
                  {getInputField("city", "text", "City", MapPin, true)}
                  {getInputField("state", "text", "State", Map, true)}
                </div>
              </>
            )}

            {/* Admin Fields */}
            {formData.role === "admin" && (
              <>
                {/* Branch for Admin */}
                <div>
                  <label htmlFor="admin-branch" className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                  <select
                    id="admin-branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full py-3 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none"
                    required
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                {getInputField("phone", "tel", "Enter phone number", Phone)}

                {/* Degree Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload M.Tech Degree
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="degree-upload"
                      required
                    />
                    <label
                      htmlFor="degree-upload"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-600">
                        {degreeFile ? degreeFile.name : "Choose file (Required for Admin)"}
                      </span>
                    </label>
                  </div>
                  {degreeFile && (
                    <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      File selected: {degreeFile.name}
                    </p>
                  )}
                </div>
              </>
            )}

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
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              Already have an account?{" "}
              <a
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors cursor-pointer"
              >
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;