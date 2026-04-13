import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "alumni",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.first_name,
            last_name: form.last_name,
            role: form.role,
          },
        },
      });

      if (signUpError) throw signUpError;

      // If email confirmation is disabled in Supabase, session is returned immediately
      if (data.session) {
        navigate("/dashboard");
      } else {
        // Email confirmation is enabled — inform the user
        setError("Check your email for a confirmation link, then sign in.");
      }
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-gray-500 mt-1 text-sm">Join the AlumniHub network</p>
        </div>

        {/* Card */}
        <div className="card">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  className="input-field"
                  placeholder="Juan"
                  value={form.first_name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label" htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  className="input-field"
                  placeholder="Dela Cruz"
                  value={form.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label" htmlFor="role">I am a…</label>
              <select
                id="role"
                name="role"
                className="input-field bg-white"
                value={form.role}
                onChange={handleChange}
              >
                <option value="alumni">Alumni</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="input-field pr-10"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="confirm_password">Confirm password</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="input-field"
                placeholder="Re-enter password"
                value={form.confirm_password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
