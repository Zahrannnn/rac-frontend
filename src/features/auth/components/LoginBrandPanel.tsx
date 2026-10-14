"use client";

import Image from "next/image";
import { BrandLogo } from "@/shared/components/brand/BrandLogo";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { PARTNER_LOGOS } from "../constants/brand";
import { AuthControls } from "./AuthControls";

function BrandSnowflake() {
  return (
    <div aria-hidden className="relative">
      <div className="absolute inset-2 rounded-full bg-sky-300/25 blur-2xl" />
      <Image
        src="/snowflake.png"
        alt=""
        width={640}
        height={658}
        className="relative size-20 object-contain drop-shadow-[0_6px_18px_rgba(186,230,253,0.35)] sm:size-24 lg:size-28"
        priority
      />
    </div>
  );
}

function BrandCar() {
  return (
    <div aria-hidden className="relative hidden w-full max-w-md sm:block">
      <div className="absolute inset-x-8 bottom-2 h-10 rounded-full bg-black/30 blur-2xl" />
      <Image
        src="/car.png"
        alt=""
        width={546}
        height={379}
        sizes="(min-width: 640px) 28rem, 90vw"
        className="relative h-auto w-full"
        priority
      />
    </div>
  );
}

function PartnerLogos() {
  const t = useT();
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-2xl bg-white px-6 py-4 shadow-lg shadow-black/15 sm:justify-between">
      {PARTNER_LOGOS.map((logo) => (
        <li
          key={logo.src}
          className={cn("flex flex-col items-center", logo.captionKey && "gap-1.5 text-center")}
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className={cn("w-auto object-contain", logo.className)}
            priority
          />
          {logo.captionKey ? (
            <span className="max-w-44 text-[0.6875rem] font-medium leading-tight text-slate-500">
              {t(logo.captionKey as never)}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Navy program panel of the login screen: brand art, program title, partner logos. */
export function LoginBrandPanel({ className }: { className?: string }) {
  const t = useT();
  return (
    <section
      className={cn(
        "relative flex flex-1 flex-col gap-8 overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(125,211,252,0.16),transparent_60%)] p-8 text-white sm:p-12 lg:min-h-screen lg:p-14",
        className
      )}
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandLogo size={15} withWordmark={false} className="text-white" />
          <p className="text-xs font-semibold tracking-[0.14em] text-white/55 uppercase">
            {t("app.partners")}
          </p>
        </div>
        <AuthControls className="flex items-center gap-0.5 lg:hidden" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7 py-4 text-center lg:py-0">
        <BrandSnowflake />

        <div className="flex flex-col items-center gap-3">
          <p className="text-4xl font-bold tracking-tight sm:text-5xl">{t("app.name")}</p>
          <h1 className="max-w-lg text-lg font-medium leading-relaxed text-white/90 sm:text-xl">
            {t("app.programTitle")}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-white/60 sm:text-[0.9375rem]">
            {t("app.programTitleShort")}
          </p>
        </div>

        <BrandCar />
      </div>

      <footer className="relative z-10 mt-auto">
        <PartnerLogos />
      </footer>
    </section>
  );
}
