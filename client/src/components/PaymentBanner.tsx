import { trpc } from "@/lib/trpc";
import { DollarSign, Smartphone, CreditCard } from "lucide-react";

export default function PaymentBanner() {
  const { data: settings } = trpc.settings.get.useQuery();

  const cashapp = settings?.cashappHandle ?? "$DarionDAnjou";
  const zelle = settings?.zellePhone ?? "+1 404 803 8247";

  return (
    <div className="payment-banner sticky bottom-0 z-50 w-full py-2 px-4">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs sm:text-sm">
        <span className="text-[oklch(0.78_0.16_75)] font-semibold tracking-wider uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
          Pay Into the Pool
        </span>
        <div className="flex items-center gap-1.5 text-[oklch(0.85_0.05_80)]">
          <DollarSign className="w-3.5 h-3.5 text-[oklch(0.78_0.16_75)]" />
          <span className="font-medium">CashApp:</span>
          <span className="text-[oklch(0.78_0.16_75)] font-bold">{cashapp}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[oklch(0.85_0.05_80)]">
          <Smartphone className="w-3.5 h-3.5 text-[oklch(0.78_0.16_75)]" />
          <span className="font-medium">Zelle / Apple Pay:</span>
          <span className="text-[oklch(0.78_0.16_75)] font-bold">{zelle}</span>
        </div>
        <span className="text-[oklch(0.55_0.04_75)] hidden sm:inline">· $10 per ballot · 1st, 2nd &amp; 3rd place prizes</span>
      </div>
    </div>
  );
}
