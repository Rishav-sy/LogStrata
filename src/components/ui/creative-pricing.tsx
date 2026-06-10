import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
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
        <div className="relative z-10 mx-auto w-full max-w-[1280px]">
            <div className="mb-12 grid gap-4 border-t border-hairline pt-5 md:grid-cols-[0.32fr_0.68fr]">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-mute">
                    {tag}
                </div>
                <div>
                    <h2 className="text-3xl font-semibold tracking-[-0.045em] text-zinc-900 dark:text-white md:text-4xl">
                        {title}
                    </h2>
                    <p className="mt-4 max-w-xl text-xs leading-6 text-zinc-600 dark:text-zinc-400">
                        {description}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border border-hairline bg-hairline md:grid-cols-3">
                {tiers.map((tier) => (
                    <div
                        key={tier.name}
                        className="group relative bg-canvas transition-colors duration-200 hover:bg-canvas-soft"
                    >
                        <div className="relative flex min-h-[390px] h-full flex-col justify-between p-7">
                            {tier.popular && (
                                <div
                                    className="absolute right-5 top-5 border-l border-link pl-2 font-mono text-[8px] uppercase tracking-[0.14em] text-link"
                                >
                                    Recommended
                                </div>
                            )}

                            <div>
                                <div className="mb-6">
                                    <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-[5px] border border-hairline bg-canvas-soft">
                                        {tier.icon}
                                    </div>
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        {tier.name}
                                    </h3>
                                    <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                        {tier.description}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="mb-7 font-mono">
                                    <span className="text-3xl font-semibold tracking-[-0.05em] text-zinc-900 dark:text-white">
                                        {typeof tier.price === 'number' ? `$${tier.price}` : tier.price}
                                    </span>
                                    {typeof tier.price === 'number' && (
                                        <span className="ml-1 text-[9px] text-zinc-500 dark:text-zinc-400">
                                            /month
                                        </span>
                                    )}
                                </div>

                                <div className="mb-8 space-y-3 border-t border-hairline pt-5">
                                    {tier.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-center gap-3"
                                        >
                                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                            <span className="text-[11px] text-zinc-700 dark:text-zinc-300">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                className={cn(
                                    "h-9 w-full rounded-[5px] text-[11px] font-semibold transition-all duration-200",
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
