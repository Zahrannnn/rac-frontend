import Link from "next/link";
import { ArrowRight, Compass, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/shared/constants/routes";

/**
 * Global 404 — brand-styled, bilingual-neutral (icon + number carry the
 * message; the actions are the two destinations users actually need).
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#004e77] p-6 text-white">
      {/* Cool-air motif echoing the login panel */}
      <Compass
        aria-hidden
        className="pointer-events-none absolute -top-24 end-[-6rem] size-[26rem] text-white/[0.06]"
        strokeWidth={0.75}
      />
      <Compass
        aria-hidden
        className="pointer-events-none absolute -bottom-32 start-[-8rem] size-[32rem] text-white/[0.05]"
        strokeWidth={0.75}
      />

      <div className="relative flex max-w-md flex-col items-center text-center">
        <p
          aria-hidden
          className="text-[6rem] font-bold leading-none tracking-tight text-white/90 sm:text-[8rem]"
          dir="ltr"
        >
          4<span className="text-[#f58220]">0</span>4
        </p>
        <h1 className="mt-2 text-xl font-bold sm:text-2xl">الصفحة غير موجودة</h1>
        <p className="mt-1 text-xl font-bold sm:text-2xl">Page not found</p>
        <p className="mt-4 max-w-[42ch] text-sm leading-6 text-white/75">
          الرابط الذي فتحته غير صحيح أو تم نقل الصفحة. تحقق من الرابط أو عد إلى لوحة المؤشرات
          للمتابعة.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            asChild
            className="border border-white bg-white text-[#004e77] hover:bg-white/90"
          >
            <Link href={routes.dashboard}>
              لوحة المؤشرات
              <ArrowRight data-icon="inline-end" className="rtl:rotate-180" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={routes.workshops}>
              <Factory data-icon="inline-start" />
              استعراض الورش
            </Link>
          </Button>
        </div>

        <p className="mt-10 text-xs text-white/50" dir="ltr">
          RAC-DAMP · 404
        </p>
      </div>
    </main>
  );
}
