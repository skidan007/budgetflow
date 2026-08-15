import { useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import budgetflowLogo from "../assets/budgetflow-logo.png";

import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

function Auth() {
  const { user, loading: authLoading } = useAuth();
  

  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (authLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-sm font-medium text-slate-500">
        Loading BudgetFlow...
      </p>
    </div>
  );
}

  // If already logged in, don't show the auth page
  if (!authLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Welcome back!");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data.user && !data.session) {
          toast.success(
            "Account created! Check your email to confirm your account.",
          );
        } else {
          toast.success("Account created successfully!");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

//   const handleAppleLogin = async () => {
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: "apple",
//       options: {
//         redirectTo: window.location.origin,
//       },
//     });

//     if (error) {
//       toast.error(error.message);
//     }
//   };
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        {/* LOGO */}
        <div className="flex justify-center">
          <div className="flex h-18 w-18 items-center justify-center  shadow-lg">
            <img
              src={budgetflowLogo}
              alt="BudgetFlow Logo"
              className="h-18 w-18 rounded-lg"
            />
            {/* <Wallet size={28} /> */}
          </div>
        </div>

        {/* TITLE */}
        <div className="mt-5 text-center">
          <h1 className="text-3xl font-bold text-slate-900">BudgetFlow</h1>

          <p className="mt-2 text-sm text-slate-500">
            {isLogin
              ? "Welcome back. Sign in to manage your money."
              : "Create an account and start managing your money."}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            Supabase is not configured. Set VITE_SUPABASE_URL and
            VITE_SUPABASE_PUBLISHABLE_KEY in your environment variables and
            redeploy.
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          {/* EMAIL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            
          </div>

          {/* PASSWORD */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {/* SWITCH */}
        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsLogin((prev) => !prev);
              setPassword("");
            }}
            className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {isLogin ? "Create one" : "Sign in"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" />

            <span className="text-xs text-slate-400">OR</span>

            <div className="h-px flex-1 bg-slate-700" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="text-lg font-bold">G</span>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
