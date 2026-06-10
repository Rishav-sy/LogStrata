import { Button } from "@/components/ui/button";
import { Check, Star, Sparkles, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingTier {
    name: string;
    icon: React.ReactNode;
    price: number | string;
    description: string;
    features: string[];
    popular?: boolean;
    color: string;
}

function CreativePricing({
    tag = "Simple Pricing",
    title = "Sized for clusters of any scale",
    description = "Deploy on local minikube or scale to global production clusters",
    tiers,
}: {
    tag?: string;
    title?: string;
    description?: string;
    tiers: PricingTier[];
}) {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center space-y-4 mb-16">
                <div className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
                    {tag}
                </div>
                <div className="relative">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        {title}
                    </h2>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto font-light">
                    {description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier, index) => (
                    <div
                        key={tier.name}
                        className={cn(
                            "relative group",
                            "transition-all duration-300"
                        )}
                    >
                        <div
                            className={cn(
                                "absolute inset-0 bg-white dark:bg-zinc-900/95",
                                "border border-zinc-200 dark:border-zinc-800",
                                "rounded-xl shadow-lg transition-all duration-300",
                                "group-hover:border-zinc-400 dark:group-hover:border-zinc-600"
                            )}
                        />

                        <div className="relative p-8 flex flex-col h-full min-h-[420px] justify-between">
                            {tier.popular && (
                                <div
                                    className="absolute -top-3 right-6 bg-primary text-on-primary
                                    font-mono text-[9px] uppercase tracking-wider px-3 py-1 rounded-full border border-hairline"
                                >
                                    Most Popular
                                </div>
                            )}

                            <div>
                                <div className="mb-6">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-lg mb-4",
                                            "flex items-center justify-center",
                                            "border border-zinc-200 dark:border-zinc-800",
                                            `text-${tier.color}-500 bg-${tier.color}-500/5`
                                        )}
                                    >
                                        {tier.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                                        {tier.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-light">
                                        {tier.description}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="mb-6 font-mono">
                                    <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                                        {typeof tier.price === 'number' ? `$${tier.price}` : tier.price}
                                    </span>
                                    {typeof tier.price === 'number' && (
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                                            /month
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3 mb-8">
                                    {tier.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-center gap-3"
                                        >
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-light">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                className={cn(
                                    "w-full h-11 text-xs font-semibold rounded-lg transition-all duration-300",
                                    tier.popular
                                        ? [
                                              "bg-[#0070f3] text-white hover:bg-blue-600",
                                          ]
                                        : [
                                              "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700",
                                          ]
                                )}
                            >
                                Get Started
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export { CreativePricing }
export type { PricingTier }