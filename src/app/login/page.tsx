import { redirect } from "next/navigation"

import { CanvasRevealEffect } from "@/components/social/aitrium/canvas-reveal-effect"
import SphereImageGrid, { type ImageData } from "@/components/social/aitrium/sphere-image-grid"
import { LoginForm } from "@/components/auth/login-form"
import { createClient } from "@/lib/supabase/server"

import { DevLogin } from "./dev-login"

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
]

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/10 text-slate-900">
      <div className="absolute inset-0 pointer-events-none opacity-70 mix-blend-screen">
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
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-10 w-[520px] h-[520px] bg-primary/20 blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[520px] h-[520px] bg-accent/10 blur-[180px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <div className="relative hidden flex-1 items-center justify-center lg:flex">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 max-w-2xl mx-auto blur-[160px] opacity-60 pointer-events-none">
              <div className="w-full h-full rounded-[999px] bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10" />
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <SphereImageGrid
              images={partnerImages}
              containerSize={420}
              sphereRadius={205}
              autoRotate
              autoRotateSpeed={0.2}
              dragSensitivity={0.7}
            />
          </div>
        </div>

        <div className="flex w-full flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-md space-y-10">
            <div className="space-y-4 text-center lg:text-left">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Oasis St Martins Village</p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-[2.75rem]">
                Welcome to The Village Hub
              </h1>
              <p className="text-sm text-slate-500">
                Sign in with your organisation account to access announcements, events, resources, and more.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur">
        <LoginForm />
            </div>

        <DevLogin />
          </div>
        </div>
      </div>
    </div>
  )
}
