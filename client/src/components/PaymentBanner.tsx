import { trpc } from "@/lib/trpc";
import { DollarSign, Smartphone } from "lucide-react";

export default function PaymentBanner() {
  const { data: settings } = trpc.settings.get.useQuery();

  const cashapp = settings?.cashappHandle ?? "$DarionDAnjou";
  const zelle = settings?.zellePhone ?? "+1 404 803 8247";

  return (
    <div className="payment-banner sticky bottom-0 z-50 w-full py-2 px-4">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs sm:text-sm">
        <span className="font-semibold tracking-wider uppercase font-heading" style={{ color: "var(--gold-primary)" }}>
          Pay Into the Pool
        </span>
        <div className="flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
          <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--gold-primary)" }} />
          <span className="font-medium font-body">CashApp:</span>
          <span className="font-bold" style={{ color: "var(--gold-primary)" }}>{cashapp}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
          <Smartphone className="w-3.5 h-3.5" style={{ color: "var(--gold-primary)" }} />
          <span className="font-medium font-body">Zelle / Apple Pay:</span>
          <span className="font-bold" style={{ color: "var(--gold-primary)" }}>{zelle}</span>
        </div>
        <span className="hidden sm:inline" style={{ color: "var(--text-secondary)" }}>· $10 per ballot · 1st, 2nd &amp; 3rd place prizes</span>
      </div>
    </div>
  );
}
