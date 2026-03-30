// src/pages/RegisterPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { User, Mail, Lock, BookOpen, Phone, Upload, Loader2, MapPin, Map, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

const stateData: Record<string, string[]> = {
  "Maharashtra": ["Pune", "Kolhapur", "Mumbai", "Nagpur", "Nashik"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
};

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

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auto-scroll to alert when error or success appears
  useEffect(() => {
    if (error || success) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error, success]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pass: string) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pass);
  const validatePhone = (phone: string) => /^\d{10}$/.test(phone);

  const emailError = touched.email && !validateEmail(formData.email) ? "Invalid email address" : "";
  const passwordError = touched.password && !validatePassword(formData.password) 
    ? "Must be 6+ chars with letters & numbers" 
    : "";
  const phoneError = touched.phone && !validatePhone(formData.phone) ? "Phone number must be exactly 10 digits" : "";

  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showStateList, setShowStateList] = useState(false);
  const [showCityList, setShowCityList] = useState(false);

  const filteredStates = useMemo(() => 
    Object.keys(stateData).filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())),
    [stateSearch]
  );

  const filteredCities = useMemo(() => {
    const cities = stateData[formData.state] || [];
    return cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
  }, [formData.state, citySearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "phone" && value !== "" && !/^\d+$/.test(value)) return;
    
    if (error) setError(""); 
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email) || !validatePassword(formData.password) || (formData.role === "admin" && !validatePhone(formData.phone))) {
      setError("Please fix the validation errors marked in red below.");
      setTouched({ email: true, password: true, phone: true });
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("username", formData.username);
      fd.append("email", formData.email);
      fd.append("password", formData.password);
      fd.append("role", formData.role);

      if (formData.role === "student") {
        fd.append("branch", formData.branch);
        fd.append("gender", formData.gender);
        fd.append("city", formData.city);
        fd.append("state", formData.state);
      } else {
        fd.append("phone", formData.phone);
        fd.append("branch", formData.branch);
        if (degreeFile) {
          fd.append("degree_file", degreeFile);
        } else {
          setLoading(false);
          return setError("M.Tech degree file is required for admin registration.");
        }
      }

      const result = await registerUser(fd);

      if (result.success) {
        setSuccess(formData.role === "admin" ? "Success! Admin request sent for approval." : "Success! Account created. Redirecting...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        // Displays exact server error (e.g., "Username already taken")
        setError(result.error || "Server rejected registration. Please check your data.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Connection failed. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDegreeFile(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 font-inter">
      <div className="max-w-md w-full py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Path<span className="text-green-600">2Gate</span>
            </h1>
            <p className="text-slate-600 mt-2">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector */}
            <div className="flex gap-3">
              {(["student", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, role: r }));
                    setError("");
                  }}
                  className={`flex-1 py-3 rounded-xl shadow-md transition-all font-semibold capitalize ${
                    formData.role === r 
                      ? "bg-green-600 text-white scale-[1.02]" 
                      : "bg-white text-slate-700 border border-slate-200 hover:border-green-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* ERROR ALERT BOX */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-800">Registration Failed</h3>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* SUCCESS ALERT BOX */}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="Enter username" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onBlur={() => handleBlur('email')}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 outline-none transition-colors ${emailError ? 'border-red-500 focus:ring-red-100' : 'border-slate-300 focus:ring-green-500'}`}
                  placeholder="name@example.com"
                  required
                />
              </div>
              {emailError && <p className="text-red-500 text-xs mt-1 font-medium">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onBlur={() => handleBlur('password')}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 outline-none transition-colors ${passwordError ? 'border-red-500 focus:ring-red-100' : 'border-slate-300 focus:ring-green-500'}`}
                  placeholder="Min. 6 chars (A-Z + 0-9)"
                  required
                />
              </div>
              {passwordError && <p className="text-red-500 text-xs mt-1 font-medium">{passwordError}</p>}
            </div>

            {/* Student Specific Section */}
            {formData.role === "student" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                    <select name="branch" value={formData.branch} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500">
                      {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                {/* State & City dropdowns kept exactly as your logic */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <div className="relative">
                    <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search state..."
                      value={stateSearch || formData.state}
                      onChange={(e) => { setStateSearch(e.target.value); setShowStateList(true); }}
                      onFocus={() => setShowStateList(true)}
                      className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  </div>
                  {showStateList && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                      {filteredStates.map(s => (
                        <div key={s} className="px-4 py-2 hover:bg-green-50 cursor-pointer text-slate-700" onClick={() => {
                          setFormData(prev => ({ ...prev, state: s, city: "" }));
                          setStateSearch(s);
                          setShowStateList(false);
                        }}>{s}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={formData.state ? "Search city..." : "Select state first"}
                      disabled={!formData.state}
                      value={citySearch || formData.city}
                      onChange={(e) => { setCitySearch(e.target.value); setShowCityList(true); }}
                      onFocus={() => setShowCityList(true)}
                      className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-50 transition-all"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  </div>
                  {showCityList && formData.state && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                      {filteredCities.map(c => (
                        <div key={c} className="px-4 py-2 hover:bg-green-50 cursor-pointer text-slate-700" onClick={() => {
                          setFormData(prev => ({ ...prev, city: c }));
                          setCitySearch(c);
                          setShowCityList(false);
                        }}>{c}</div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {formData.role === "admin" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      value={formData.phone}
                      onBlur={() => handleBlur('phone')}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 outline-none transition-colors ${phoneError ? 'border-red-500 focus:ring-red-100' : 'border-slate-300 focus:ring-green-500'}`}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                  {phoneError && <p className="text-red-500 text-xs mt-1 font-medium">{phoneError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload M.Tech Degree</label>
                  <label htmlFor="degree-upload" className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600">{degreeFile ? degreeFile.name : "Choose PDF/Image"}</span>
                  </label>
                  <input type="file" id="degree-upload" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} required />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200/50 hover:bg-green-700 transition-all duration-200 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <span onClick={() => navigate('/login')} className="text-green-600 font-semibold cursor-pointer hover:underline">Sign In</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;