import { useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

import budgetflowLogo from "../assets/budgetflow-logo.png";

import {
  supabase,
  isSupabaseConfigured,
} from "../lib/supabaseClient";

import { useAuth } from "../context/AuthContext";

function Auth() {
  const { user, loading: authLoading } = useAuth();

  // -------------------------------------
  // FORM MODE
  // -------------------------------------

  const [isLogin, setIsLogin] = useState(true);

  // -------------------------------------
  // FORM STATE
  // -------------------------------------

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // -------------------------------------
  // LOADING
  // -------------------------------------

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // -------------------------------------
  // AUTH LOADING
  // -------------------------------------

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm font-medium text-slate-500">
          Loading BudgetFlow...
        </p>
      </div>
    );
  }

  // -------------------------------------
  // ALREADY AUTHENTICATED
  // -------------------------------------

  if (user) {
    return <Navigate to="/" replace />;
  }

  // -------------------------------------
  // VALIDATION
  // -------------------------------------

  const validateForm = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("Please enter your email.");
      return false;
    }

    if (!trimmedEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      toast.error("Please enter your password.");
      return false;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  // -------------------------------------
  // LOGIN / SIGNUP
  // -------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || googleLoading) return;

    if (!isSupabaseConfigured) {
      toast.error(
        "Supabase is not configured. Please check your environment variables.",
      );
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      const trimmedEmail = email.trim();

      // ---------------------------------
      // LOGIN
      // ---------------------------------

      if (isLogin) {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

        if (error) {
          console.error("Login error:", error);

          if (
            error.message
              .toLowerCase()
              .includes("invalid login credentials")
          ) {
            toast.error(
              "Invalid email or password.",
            );
          } else {
            toast.error(error.message);
          }

          return;
        }

        toast.success("Welcome back!");
        return;
      }

      // ---------------------------------
      // SIGN UP
      // ---------------------------------

      const { data, error } =
        await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

      if (error) {
        console.error("Signup error:", error);

        if (
          error.message
            .toLowerCase()
            .includes("already registered")
        ) {
          toast.error(
            "An account with this email already exists. Please sign in.",
          );
        } else {
          toast.error(error.message);
        }

        return;
      }

      // ---------------------------------
      // EMAIL CONFIRMATION ENABLED
      // ---------------------------------

      if (data.user && !data.session) {
        toast.success(
          "Account created! Check your email to confirm your account.",
        );

        setPassword("");
        return;
      }

      // ---------------------------------
      // EMAIL CONFIRMATION DISABLED
      // ---------------------------------

      toast.success(
        "Account created successfully!",
      );

      setPassword("");
    } catch (error) {
      console.error(
        "Authentication error:",
        error,
      );

      toast.error(
        "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // GOOGLE LOGIN
  // -------------------------------------

  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;

    if (!isSupabaseConfigured) {
      toast.error(
        "Supabase is not configured. Please check your environment variables.",
      );
      return;
    }

    setGoogleLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",

          options: {
            redirectTo:
              `${window.location.origin}/`,
          },
        });

      if (error) {
        console.error(
          "Google login error:",
          error,
        );

        toast.error(error.message);
      }
    } catch (error) {
      console.error(
        "Google authentication error:",
        error,
      );

      toast.error(
        "Unable to continue with Google.",
      );

      setGoogleLoading(false);
    }
  };

  // -------------------------------------
  // SWITCH LOGIN / SIGNUP
  // -------------------------------------

  const handleModeSwitch = () => {
    setIsLogin((previous) => !previous);

    setPassword("");
    setShowPassword(false);
  };

  // -------------------------------------
  // RENDER
  // -------------------------------------

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">

        {/* LOGO */}

        <div className="flex justify-center">
          <img
            src={budgetflowLogo}
            alt="BudgetFlow Logo"
            className="h-20 w-20 rounded-xl object-contain shadow-lg"
          />
        </div>

        {/* TITLE */}

        <div className="mt-5 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            BudgetFlow
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {isLogin
              ? "Welcome back. Sign in to manage your money."
              : "Create an account and start managing your money."}
          </p>
        </div>

        {/* SUPABASE WARNING */}

        {!isSupabaseConfigured && (
          <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">
              Supabase is not configured.
            </p>

            <p className="mt-1">
              Set your Supabase environment variables
              before using authentication.
            </p>
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-5"
        >
          {/* EMAIL */}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading || googleLoading}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          {/* PASSWORD */}

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete={
                  isLogin
                    ? "current-password"
                    : "new-password"
                }
                disabled={loading || googleLoading}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous,
                  )
                }
                disabled={
                  loading || googleLoading
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={
              loading ||
              googleLoading ||
              !isSupabaseConfigured
            }
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
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={handleModeSwitch}
            disabled={
              loading || googleLoading
            }
            className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLogin
              ? "Create one"
              : "Sign in"}
          </button>
        </div>

        {/* DIVIDER */}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />

          <span className="text-xs font-medium text-slate-400">
            OR
          </span>

          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* GOOGLE */}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={
            loading ||
            googleLoading ||
            !isSupabaseConfigured
          }
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            "Connecting..."
          ) : (
            <>
              <span className="text-lg font-bold">
                G
              </span>

              Continue with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Auth;