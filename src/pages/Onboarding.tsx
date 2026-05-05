import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil as PencilIcon, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type Question = {
  key: "account_type" | "role" | "team_size" | "use_case" | "referral_source";
  title: string;
  subtitle: string;
  options: { label: string; value: string; emoji?: string }[];
};

const QUESTIONS: Question[] = [
  {
    key: "account_type",
    title: "Are you using Pencil for yourself or your team?",
    subtitle: "We'll tailor the experience to fit how you work.",
    options: [
      { label: "Just me", value: "individual", emoji: "👤" },
      { label: "My team / company", value: "business", emoji: "🏢" },
      { label: "School / education", value: "education", emoji: "🎓" },
    ],
  },
  {
    key: "role",
    title: "What best describes your role?",
    subtitle: "So we can suggest the right templates and tools.",
    options: [
      { label: "Engineer / Developer", value: "engineer", emoji: "🛠️" },
      { label: "Designer", value: "designer", emoji: "🎨" },
      { label: "Product / PM", value: "product", emoji: "📐" },
      { label: "Founder / Other", value: "other", emoji: "💼" },
    ],
  },
  {
    key: "team_size",
    title: "How large is your team?",
    subtitle: "Pencil works great solo and scales with you.",
    options: [
      { label: "Just me", value: "1" },
      { label: "2 – 10", value: "2-10" },
      { label: "11 – 50", value: "11-50" },
      { label: "50+", value: "50+" },
    ],
  },
  {
    key: "use_case",
    title: "Why are you using Pencil?",
    subtitle: "Pick the one that matters most to you.",
    options: [
      { label: "System architecture diagrams", value: "architecture", emoji: "🧩" },
      { label: "Flow charts & whiteboarding", value: "flowcharts", emoji: "📊" },
      { label: "UI wireframes & sketches", value: "wireframes", emoji: "✏️" },
      { label: "Notes & visual thinking", value: "notes", emoji: "🧠" },
    ],
  },
  {
    key: "referral_source",
    title: "How did you hear about Pencil?",
    subtitle: "Last one — promise.",
    options: [
      { label: "Friend / colleague", value: "friend" },
      { label: "Twitter / X", value: "twitter" },
      { label: "Google search", value: "google" },
      { label: "Somewhere else", value: "other" },
    ],
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // If already signed in & onboarded, skip straight to canvas
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data?.onboarded_at) {
        navigate("/canvas", { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [user, navigate]);

  const q = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const isLast = step === QUESTIONS.length - 1;

  const handleSelect = async (value: string) => {
    const next = { ...answers, [q.key]: value };
    setAnswers(next);

    if (!isLast) {
      setTimeout(() => setStep((s) => s + 1), 180);
      return;
    }

    // Persist answers locally so AuthPage can write them after sign-in
    try {
      localStorage.setItem("pencil:onboarding", JSON.stringify(next));
    } catch {}

    // If already signed in, save now and go to canvas
    if (user) {
      await supabase
        .from("profiles")
        .update({ ...next, onboarded_at: new Date().toISOString() })
        .eq("user_id", user.id);
      try { localStorage.removeItem("pencil:onboarding"); } catch {}
      navigate("/canvas", { replace: true });
      return;
    }

    // Otherwise route to sign-in — answers will be saved post-login
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PencilIcon size={18} strokeWidth={1.5} className="text-primary" />
          <span className="font-semibold tracking-tight text-[15px]">Pencil</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {String(step + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}
        </span>
      </header>

      {/* Progress bar */}
      <div className="relative h-[2px] bg-border/50">
        <motion.div
          className="absolute left-0 top-0 h-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
        />
      </div>

      {/* Body */}
      <div className="relative flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-3 leading-tight">
                {q.title}
              </h1>
              <p className="text-muted-foreground mb-8 text-[15px]">{q.subtitle}</p>

              <div className="grid gap-3">
                {q.options.map((opt) => {
                  const selected = answers[q.key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      disabled={submitting}
                      className={`group flex items-center gap-3 w-full text-left px-5 h-14 rounded-xl border transition-all ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
                      }`}
                    >
                      {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
                      <span className="text-[15px] font-medium flex-1">{opt.label}</span>
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        }`}
                      >
                        {selected && <Check size={12} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => navigate("/canvas", { replace: true })}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now <ArrowRight size={14} className="inline ml-1" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
