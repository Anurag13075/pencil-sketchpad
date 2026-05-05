import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Pencil as PencilIcon, ArrowLeft, Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After auth: persist any pending onboarding answers, then route appropriately
  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      let pending: Record<string, string> | null = null;
      try {
        const raw = localStorage.getItem("pencil:onboarding");
        if (raw) pending = JSON.parse(raw);
      } catch {}

      if (pending && Object.keys(pending).length > 0) {
        await supabase
          .from("profiles")
          .update({ ...pending, onboarded_at: new Date().toISOString() })
          .eq("user_id", user.id);
        try { localStorage.removeItem("pencil:onboarding"); } catch {}
        navigate("/canvas", { replace: true });
        return;
      }

      // No pending answers — check if profile is already onboarded
      const { data } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.onboarded_at) {
        navigate("/canvas", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    })();
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      setError(result.error.message || "Sign in failed");
      setSigningIn(false);
      return;
    }
    if (result.redirected) return;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative w-full max-w-sm rounded-2xl border bg-card p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <PencilIcon size={22} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Welcome to Pencil</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to save canvases and use AI</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="w-full h-11 rounded-lg border bg-background hover:bg-muted flex items-center justify-center gap-3 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {signingIn ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        {error && <p className="text-xs text-destructive mt-3 text-center">{error}</p>}

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </motion.div>
    </div>
  );
}
