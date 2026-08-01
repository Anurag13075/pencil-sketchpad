import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Pencil as PencilIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

export function Navbar() {


  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ background: "hsla(var(--background) / 0.85)", backdropFilter: "blur(20px)" }}
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={spring}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PencilIcon size={20} strokeWidth={1.5} className="text-primary" />
          <span className="font-semibold tracking-tight text-[15px]">Pencil</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#ai" className="hover:text-foreground transition-colors">AI</a>
          <a href="#shortcuts" className="hover:text-foreground transition-colors">Shortcuts</a>
          <a href="#compare" className="hover:text-foreground transition-colors">Why Pencil</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                to="/canvas"
                className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-all active:scale-[0.97]"
              >
                Open Canvas <ArrowRight size={14} />
              </Link>
              <button
                onClick={signOut}
                title="Sign out"
                className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-all active:scale-[0.97]"
            >
              Sign in <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
