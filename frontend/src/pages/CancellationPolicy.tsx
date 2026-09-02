import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, ShieldCheck } from "lucide-react";

export default function CancellationPolicy() {
  const policies = [
    {
      name: "Flexible",
      color: "text-success",
      bgColor: "bg-success/10",
      icon: Clock,
      rules: [
        { days: "1+ days before check-in", refund: "Full refund" },
        { days: "Less than 1 day", refund: "No refund" },
      ],
    },
    {
      name: "Moderate",
      color: "text-warning",
      bgColor: "bg-warning/10",
      icon: RefreshCw,
      rules: [
        { days: "5+ days before check-in", refund: "Full refund" },
        { days: "1-4 days before check-in", refund: "50% refund" },
        { days: "Less than 1 day", refund: "No refund" },
      ],
    },
    {
      name: "Strict",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      icon: ShieldCheck,
      rules: [
        { days: "7+ days before check-in", refund: "Full refund" },
        { days: "3-6 days before check-in", refund: "50% refund" },
        { days: "Less than 3 days", refund: "No refund" },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-secondary/50 py-16 md:py-20 border-b border-border">
        <div className="container text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3">
            Cancellation & Refund Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            Understanding your options before you book
          </p>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="container max-w-4xl">
          <p className="text-muted-foreground leading-relaxed mb-10">
            Each listing on Gau Basti has a cancellation policy set by the host. The refund amount
            you receive depends on how far in advance you cancel and the policy type. Here are the
            three policy levels:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {policies.map((policy) => (
              <div key={policy.name} className="bg-white border border-border rounded-2xl overflow-hidden">
                <div className={`${policy.bgColor} p-5 flex items-center gap-3`}>
                  <policy.icon className={`h-6 w-6 ${policy.color}`} />
                  <h3 className="font-display text-lg font-semibold">{policy.name}</h3>
                </div>
                <div className="p-5 space-y-3">
                  {policy.rules.map((rule, i) => (
                    <div key={i} className="flex items-start justify-between text-sm">
                      <span className="text-muted-foreground">{rule.days}</span>
                      <span className="font-medium text-right">{rule.refund}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="text-xl font-display font-semibold">Important notes</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="font-medium text-foreground shrink-0">•</span>
                Refunds are calculated based on the number of days before your check-in date.
              </li>
              <li className="flex items-start gap-3">
                <span className="font-medium text-foreground shrink-0">•</span>
                The cleaning fee and service fee are non-refundable once a booking is confirmed.
              </li>
              <li className="flex items-start gap-3">
                <span className="font-medium text-foreground shrink-0">•</span>
                If a host cancels your booking, you will receive a full refund regardless of the policy.
              </li>
              <li className="flex items-start gap-3">
                <span className="font-medium text-foreground shrink-0">•</span>
                Refunds are processed back to the original payment method within 5-10 business days.
              </li>
              <li className="flex items-start gap-3">
                <span className="font-medium text-foreground shrink-0">•</span>
                You can see the cancellation policy for each listing on its detail page before booking.
              </li>
            </ul>
          </div>

          <div className="text-center mt-10">
            <Link to="/listings">
              <Button size="lg">Browse Homestays</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
