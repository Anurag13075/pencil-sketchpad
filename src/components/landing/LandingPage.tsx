import { Navbar } from "./sections/Navbar";
import { Hero } from "./sections/Hero";
import { LogoBar } from "./sections/LogoBar";
import { DiagramTypes } from "./sections/DiagramTypes";
import { AIPromptShowcase } from "./sections/AIPromptShowcase";
import { ToolShowcase } from "./sections/ToolShowcase";
import { FeatureDeepDives } from "./sections/FeatureDeepDives";
import { UniqueFeatures } from "./sections/UniqueFeatures";
import { AIFeature } from "./sections/AIFeature";
import { Features } from "./sections/Features";
import { KeyboardShortcuts } from "./sections/KeyboardShortcuts";
import { HowItWorks } from "./sections/HowItWorks";
import { Stats } from "./sections/Stats";
import { Comparison } from "./sections/Comparison";
import { Testimonials } from "./sections/Testimonials";
import { FAQ } from "./sections/FAQ";
import { CTASection } from "./sections/CTASection";
import { Footer } from "./sections/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <LogoBar />
      <DiagramTypes />
      <UniqueFeatures />
      <AIPromptShowcase />
      <ToolShowcase />
      <FeatureDeepDives />
      <AIFeature />
      <Features />
      <KeyboardShortcuts />
      <HowItWorks />
      <Stats />
      <Comparison />
      <Testimonials />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}
