"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CanvasRevealEffect } from "@/components/social/aitrium/canvas-reveal-effect";
import SphereImageGrid, {
  ImageData,
} from "@/components/social/aitrium/sphere-image-grid";
import { DevLogin } from "./dev-login";
import { createClient } from "@/lib/supabase/client";

type StepState = "email" | "code" | "success";

const partnerImages: ImageData[] = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600",
    alt: "Aurora",
    title: "Neural Canvas",
    description: "Immersive visual systems",
  },
  {
    id: "2",
    src: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=600",
    alt: "City",
    title: "Aitrium One",
    description: "Urban signal lab",
  },
  {
    id: "3",
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600",
    alt: "Wave",
    title: "Amplitude",
    description: "Realtime data orchestration",
  },
  {
    id: "4",
    src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=600",
    alt: "Designer",
    title: "Core Studio",
    description: "Spatial prototyping",
  },
  {
    id: "5",
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600",
    alt: "Gradient",
    title: "Fluxworks",
    description: "Hyperdimensional art",
  },
  {
    id: "6",
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600",
    alt: "Architecture",
    title: "Field Ops",
    description: "Expedition robotics",
  },
  {
    id: "7",
    src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600",
    alt: "Mountain",
    title: "Waveform",
    description: "Systems intelligence",
  },
  {
    id: "8",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
    alt: "Valley",
    title: "Signal Lab",
    description: "Applied AI research",
  },
  {
    id: "9",
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600",
    alt: "Forest",
    title: "Helio",
    description: "Biocomputing",
  },
  {
    id: "10",
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600",
    alt: "Sunset",
    title: "Synthesis",
    description: "Creative tooling",
  },
  {
    id: "11",
    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600",
    alt: "Lake",
    title: "Aero",
    description: "Spatial computing",
  },
  {
    id: "12",
    src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600",
    alt: "Woods",
    title: "Mono",
    description: "Strategic design",
  },
  {
    id: "13",
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&sat=-50",
    alt: "Aurora 2",
    title: "Neural Canvas Pro",
    description: "Advanced systems",
  },
  {
    id: "14",
    src: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=600&hue=30",
    alt: "City 2",
    title: "Urban Lab",
    description: "Smart infrastructure",
  },
  {
    id: "15",
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&hue=60",
    alt: "Wave 2",
    title: "Flow Systems",
    description: "Dynamic platforms",
  },
  {
    id: "16",
    src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=600&sat=50",
    alt: "Designer 2",
    title: "Studio Collective",
    description: "Design futures",
  },
  {
    id: "17",
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&contrast=20",
    alt: "Gradient 2",
    title: "Spectrum Labs",
    description: "Color science",
  },
  {
    id: "18",
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&bright=10",
    alt: "Architecture 2",
    title: "Build Systems",
    description: "Infrastructure tech",
  },
  {
    id: "19",
    src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&contrast=10",
    alt: "Mountain 2",
    title: "Peak Performance",
    description: "High altitude computing",
  },
  {
    id: "20",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&sat=30",
    alt: "Valley 2",
    title: "Valley Ventures",
    description: "Innovation hub",
  },
  {
    id: "21",
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&hue=90",
    alt: "Forest 2",
    title: "Green Tech",
    description: "Sustainable systems",
  },
  {
    id: "22",
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&sat=-20",
    alt: "Sunset 2",
    title: "Horizon Labs",
    description: "Future forward",
  },
  {
    id: "23",
    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&bright=5",
    alt: "Lake 2",
    title: "Liquid Systems",
    description: "Fluid computing",
  },
  {
    id: "24",
    src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&contrast=-10",
    alt: "Woods 2",
    title: "Forest Labs",
    description: "Natural intelligence",
  },
  {
    id: "25",
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600",
    alt: "Mountains",
    title: "Peak Labs",
    description: "High altitude tech",
  },
  {
    id: "26",
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600",
    alt: "Road",
    title: "Pathway Systems",
    description: "Journey mapping",
  },
  {
    id: "27",
    src: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=600",
    alt: "Coast",
    title: "Coastal Labs",
    description: "Edge computing",
  },
  {
    id: "28",
    src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    alt: "Food",
    title: "Nourish Tech",
    description: "Culinary AI",
  },
  {
    id: "29",
    src: "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=600",
    alt: "Workspace",
    title: "Studio Space",
    description: "Creative environments",
  },
  {
    id: "30",
    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600",
    alt: "Code",
    title: "Dev Systems",
    description: "Engineering platform",
  },
  {
    id: "31",
    src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600",
    alt: "Laptop",
    title: "Mobile Lab",
    description: "Portable computing",
  },
  {
    id: "32",
    src: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600",
    alt: "Office",
    title: "Work Hub",
    description: "Collaboration space",
  },
  {
    id: "33",
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
    alt: "Tech",
    title: "Circuit Labs",
    description: "Hardware innovation",
  },
  {
    id: "34",
    src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600",
    alt: "Globe",
    title: "Global Systems",
    description: "Worldwide network",
  },
  {
    id: "35",
    src: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600",
    alt: "Lights",
    title: "Luminous",
    description: "Light computing",
  },
  {
    id: "36",
    src: "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?w=600",
    alt: "Camera",
    title: "Vision Labs",
    description: "Computer vision",
  },
  {
    id: "37",
    src: "https://images.unsplash.com/photo-1506957341433-8a85c39e7fd3?w=600",
    alt: "Urban Night",
    title: "Night Systems",
    description: "24/7 operations",
  },
  {
    id: "38",
    src: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600",
    alt: "Neon",
    title: "Neon Labs",
    description: "Bright ideas",
  },
  {
    id: "39",
    src: "https://images.unsplash.com/photo-1492551557933-34265f7af79e?w=600",
    alt: "Abstract",
    title: "Abstract Systems",
    description: "Conceptual computing",
  },
  {
    id: "40",
    src: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=600",
    alt: "Adventure",
    title: "Explorer Labs",
    description: "Discovery platform",
  },
  {
    id: "41",
    src: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=600",
    alt: "Bridge",
    title: "Bridge Systems",
    description: "Connection tech",
  },
  {
    id: "42",
    src: "https://images.unsplash.com/photo-1485628390555-1a7bd503f9fe?w=600",
    alt: "Sky",
    title: "Sky Labs",
    description: "Cloud native",
  },
  {
    id: "43",
    src: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600",
    alt: "Peak",
    title: "Summit Tech",
    description: "Achievement systems",
  },
  {
    id: "44",
    src: "https://images.unsplash.com/photo-1468276311594-df7cb65d8df6?w=600",
    alt: "Canyon",
    title: "Canyon Labs",
    description: "Deep tech",
  },
  {
    id: "45",
    src: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600",
    alt: "Horizon",
    title: "Horizon Systems",
    description: "Future tech",
  },
  {
    id: "46",
    src: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600",
    alt: "Beach",
    title: "Wave Labs",
    description: "Coastal computing",
  },
  {
    id: "47",
    src: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600",
    alt: "Cliffs",
    title: "Edge Systems",
    description: "Boundary tech",
  },
  {
    id: "48",
    src: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600",
    alt: "River",
    title: "Flow Labs",
    description: "Stream processing",
  },
];

const AnimatedNavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className="group relative inline-block overflow-hidden h-5 flex items-center text-sm"
    >
      <div className="flex flex-col transition-transform duration-400 ease-out group-hover:-translate-y-1/2">
        <span className="text-slate-600">{children}</span>
        <span className="text-slate-900">{children}</span>
      </div>
    </Link>
  );
};

function MiniNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState("rounded-full");
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }
    if (isOpen) {
      setHeaderShapeClass("rounded-2xl");
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass("rounded-full");
      }, 300);
    }
    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const navLinksData = [
    { label: "Manifesto", href: "#manifesto" },
    { label: "Careers", href: "#careers" },
    { label: "Discover", href: "#discover" },
  ];

  const ghostButtonClasses =
    "px-4 py-2 sm:px-3 text-xs sm:text-sm border border-slate-200/80 bg-white/70 text-slate-900 rounded-full hover:border-primary/40 hover:text-primary transition-colors duration-200 w-full sm:w-auto";

  const gradientButton = (
    <div className="relative group w-full sm:w-auto">
      <div className="absolute inset-0 -m-2 rounded-full hidden sm:block bg-primary/40 opacity-40 blur-lg pointer-events-none transition-all duration-300 ease-out group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3" />
      <Link
        href="/signup"
        className="relative z-10 px-4 py-2 sm:px-3 text-xs sm:text-sm font-semibold text-white bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-full hover:from-primary/90 hover:to-primary transition-all duration-200 w-full sm:w-auto shadow-lg shadow-primary/30"
      >
        Signup
      </Link>
    </div>
  );

  return (
    <header
      className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pl-6 pr-6 py-3 backdrop-blur-xl border border-slate-200/60 bg-white/80 w-[calc(100%-2rem)] sm:w-auto transition-[border-radius] duration-300 ease-in-out shadow-xl shadow-slate-200/70",
        headerShapeClass,
      )}
    >
      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <Link href="/" className="text-sm font-semibold tracking-[0.3em] text-slate-900">
          AITRIUM
        </Link>
        <nav className="hidden sm:flex items-center space-x-6 text-sm">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.href} href={link.href}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/login" className={ghostButtonClasses}>
            Log in
          </Link>
          {gradientButton}
        </div>
        <button
          className="sm:hidden flex items-center justify-center w-8 h-8 text-slate-700 focus:outline-none"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
        >
          {isOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          )}
        </button>
      </div>
      <div
        className={cn(
          "sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden",
          isOpen ? "max-h-[1000px] opacity-100 pt-4" : "max-h-0 opacity-0 pt-0 pointer-events-none",
        )}
      >
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          {navLinksData.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-600 hover:text-slate-900 transition-colors w-full text-center"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-center space-y-4 mt-4 w-full">
          <Link href="/login" className={ghostButtonClasses}>
            Log in
          </Link>
          {gradientButton}
        </div>
      </div>
    </header>
  );
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<StepState>("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsOAuthLoading('google');
    try {
      const supabase = createClient();
      // IMPORTANT: NEXT_PUBLIC_* vars are build-time only in Next.js
      // Hardcode production URL as fallback to avoid localhost issues
      const PRODUCTION_URL = 'https://stmartinsapp-production.up.railway.app';
      const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
      const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';

      // Use production URL if we're not on localhost, otherwise use browser origin for dev
      const siteUrl = envUrl || (browserOrigin.includes('localhost') ? browserOrigin : PRODUCTION_URL);

      console.log('=== OAuth Debug ===');
      console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
      console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
      console.log('browserOrigin:', browserOrigin);
      console.log('Final siteUrl:', siteUrl);
      console.log('==================');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback`
        }
      });
      if (error) {
        console.error('Google sign in error:', error);
        setIsOAuthLoading(null);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setIsOAuthLoading(null);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsOAuthLoading('microsoft');
    try {
      const supabase = createClient();
      // IMPORTANT: NEXT_PUBLIC_* vars are build-time only in Next.js
      // Hardcode production URL as fallback to avoid localhost issues
      const PRODUCTION_URL = 'https://stmartinsapp-production.up.railway.app';
      const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
      const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const siteUrl = envUrl || (browserOrigin.includes('localhost') ? browserOrigin : PRODUCTION_URL);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email offline_access',
          redirectTo: `${siteUrl}/auth/callback`
        }
      });
      if (error) {
        console.error('Microsoft sign in error:', error);
        setIsOAuthLoading(null);
      }
    } catch (error) {
      console.error('Microsoft sign in error:', error);
      setIsOAuthLoading(null);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep("code");
    }
  };

  useEffect(() => {
    if (step === "code") {
      const timeout = setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value.replace(/\D/g, "");
      setCode(newCode);

      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }

      if (index === 5 && value) {
        const isComplete = newCode.every((digit) => digit.length === 1);
        if (isComplete) {
          setReverseCanvasVisible(true);
          setTimeout(() => {
            setInitialCanvasVisible(false);
          }, 80);
          setTimeout(() => {
            setStep("success");
          }, 1600);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleBackClick = () => {
    setStep("email");
    setCode(["", "", "", "", "", ""]);
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  const oauthButtonClasses =
    "w-full flex items-center justify-center gap-2 rounded-full py-3 px-4 border border-slate-200 bg-white/80 text-slate-900 shadow-sm hover:border-primary/40 hover:bg-white transition-colors";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/10 text-slate-900">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 pointer-events-none opacity-70 mix-blend-screen">
          {initialCanvasVisible && (
            <CanvasRevealEffect
              animationSpeed={2.5}
              containerClassName="bg-transparent"
              colors={[
                [173, 255, 235],
                [255, 255, 255],
              ]}
              dotSize={5}
              showGradient={false}
              reverse={false}
            />
          )}
          {reverseCanvasVisible && (
            <CanvasRevealEffect
              animationSpeed={3.5}
              containerClassName="bg-transparent"
              colors={[
                [255, 255, 255],
                [173, 216, 255],
              ]}
              dotSize={5}
              showGradient={false}
              reverse
            />
          )}
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-10 w-[520px] h-[520px] bg-primary/20 blur-[160px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[520px] h-[520px] bg-accent/10 blur-[180px]" />
        </div>
      </div>

      {/* <MiniNavbar /> */}

      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-20 pt-8 flex flex-col items-center gap-12">
        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center gap-12"
            >
                <div className="text-center space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    Oasis St Martins Village
                  </p>
                  <h1 className="text-[2.8rem] font-semibold leading-[1.1] tracking-tight text-slate-900">
                    Aitrium
                  </h1>
                </div>

              <div className="relative flex items-center justify-center w-full py-10">
                <div className="absolute inset-0 max-w-2xl mx-auto blur-[140px] opacity-60 pointer-events-none">
                  <div className="w-full h-full rounded-[999px] bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10" />
                </div>
                <SphereImageGrid
                  images={partnerImages}
                  containerSize={420}
                  sphereRadius={205}
                  autoRotate
                  autoRotateSpeed={0.2}
                  dragSensitivity={0.7}
                  className="pointer-events-auto relative"
                />
              </div>

              <div className="w-full max-w-md space-y-8">
                <div className="space-y-4">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isOAuthLoading !== null}
                    className={cn(oauthButtonClasses, isOAuthLoading === 'google' && "opacity-70 cursor-wait")}
                  >
                    {isOAuthLoading === 'google' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleMicrosoftSignIn}
                    disabled={isOAuthLoading !== null}
                    className={cn(oauthButtonClasses, isOAuthLoading === 'microsoft' && "opacity-70 cursor-wait")}
                  >
                    {isOAuthLoading === 'microsoft' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 23 23"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path fill="#f25022" d="M1 1h10v10H1z" />
                          <path fill="#00a4ef" d="M12 1h10v10H12z" />
                          <path fill="#7fba00" d="M1 12h10v10H1z" />
                          <path fill="#ffb900" d="M12 12h10v10H12z" />
                        </svg>
                        <span>Continue with Microsoft</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    New here? These buttons work for sign-up too.
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="h-px bg-slate-200 flex-1" />
                    <span className="text-slate-400 text-sm">or continue with email</span>
                    <div className="h-px bg-slate-200 flex-1" />
                  </div>

                  <form onSubmit={handleEmailSubmit}>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="your.email@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full backdrop-blur-sm bg-white/90 text-slate-900 border border-slate-200 rounded-full py-3 px-4 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 text-center transition-all"
                        required
                      />
                      <button
                        type="submit"
                        className="absolute right-1.5 top-1.5 text-slate-900 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-primary hover:text-white transition-colors group overflow-hidden"
                      >
                        <span className="relative w-full h-full flex items-center justify-center">
                          →
                        </span>
                      </button>
                    </div>
                  </form>
                </div>

                <p className="text-xs text-slate-400 text-center pt-6">
                  By signing in, you agree to Aitrium&apos;s{" "}
                  <Link href="/terms" className="underline hover:text-slate-600 transition-colors">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-slate-600 transition-colors">
                    Privacy Policy
                  </Link>
                </p>

                <DevLogin />
              </div>
            </motion.div>
          )}

          {step === "code" && (
            <motion.div
              key="code-step"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md space-y-8 text-center pt-20"
            >
              <div className="space-y-2">
                <h1 className="text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-slate-900">
                  We sent you a code
                </h1>
                <p className="text-lg text-slate-600">Check your email and enter it below</p>
              </div>

              <div className="w-full">
                <div className="relative rounded-full py-4 px-5 border border-slate-200 bg-white/90">
                  <div className="flex items-center justify-center gap-2">
                    {code.map((digit, i) => (
                      <div key={i} className="flex items-center">
                        <div className="relative">
                          <input
                            ref={(el) => {
                              codeInputRefs.current[i] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleCodeChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className="w-10 text-center text-2xl bg-transparent text-slate-900 border-none focus:outline-none focus:ring-0 appearance-none font-semibold"
                            style={{ caretColor: "transparent" }}
                          />
                          {!digit && (
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                              <span className="text-2xl text-slate-300 font-semibold">0</span>
                            </div>
                          )}
                        </div>
                        {i < 5 && <span className="text-slate-200 text-2xl mx-1">|</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <motion.button
                  className="text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  Resend code
                </motion.button>
              </div>

              <div className="flex w-full gap-3 pt-4">
                <motion.button
                  onClick={handleBackClick}
                  className="rounded-full bg-slate-100 text-slate-900 font-medium px-8 py-3 hover:bg-slate-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  Back
                </motion.button>
                <motion.button
                  className={`flex-1 rounded-full font-medium py-3 border transition-all duration-300 ${
                    code.every((d) => d !== "")
                      ? "bg-primary text-white border-transparent hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/30"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                  disabled={!code.every((d) => d !== "")}
                  whileHover={code.every((d) => d !== "") ? { scale: 1.02 } : {}}
                  whileTap={code.every((d) => d !== "") ? { scale: 0.98 } : {}}
                >
                  Continue
                </motion.button>
              </div>

              <p className="text-xs text-slate-400 text-center pt-10">
                By signing in, you agree to Aitrium&apos;s{" "}
                <Link href="/terms" className="underline hover:text-slate-600 transition-colors">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-slate-600 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="w-full max-w-md space-y-8 text-center pt-20"
            >
              <div className="space-y-2">
                <h1 className="text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-slate-900">
                  You&apos;re in!
                </h1>
                <p className="text-lg text-slate-600">Welcome to Aitrium</p>
              </div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="py-10"
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-2xl shadow-primary/40">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="w-full rounded-full bg-primary text-white font-semibold py-3 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
              >
                Continue to Dashboard
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
