"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqSectionWithCategoriesProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  items: {
    question: string;
    answer: string;
    category?: string;
  }[];
  contactInfo?: {
    title: string;
    description?: string;
    buttonText: string;
    onContact?: () => void;
  };
}

const FaqSectionWithCategories = React.forwardRef<HTMLElement, FaqSectionWithCategoriesProps>(
  ({ className, title, description, items, contactInfo, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn("w-full px-5 py-24 sm:px-6 lg:py-28", className)}
        {...props}
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-12 md:grid-cols-[0.42fr_0.58fr]">
            {/* Header */}
            <div className="border-t border-hairline pt-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mute">Technical FAQ</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl">
                {title}
              </h2>
              {description && (
                <p className="mt-4 max-w-md text-xs leading-6 text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            {/* FAQ Items */}
            <Accordion type="single" collapsible className="border-t border-hairline">
              {items.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className={cn(
                    "border-b border-hairline bg-transparent text-card-foreground"
                  )}
                >
                  <AccordionTrigger 
                    className={cn(
                      "px-0 py-5 text-left hover:no-underline"
                    )}
                  >
                    <div className="flex flex-col gap-2">
                      {item.category && (
                        <Badge
                          variant="secondary"
                          className="w-fit rounded-[4px] text-[9px] font-normal"
                        >
                          {item.category}
                        </Badge>
                      )}
                      <h3 className="text-sm font-medium text-foreground group-hover:text-primary">
                        {item.question}
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-6 pt-0">
                    <p className="max-w-xl text-xs leading-6 text-muted-foreground">
                      {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Contact Section */}
            {contactInfo && (
              <div className="mt-10">
                <p className="text-muted-foreground mb-4">
                  {contactInfo.title}
                </p>
                {contactInfo.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {contactInfo.description}
                  </p>
                )}
                <Button size="sm" onClick={contactInfo.onContact}>
                  {contactInfo.buttonText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }
);
FaqSectionWithCategories.displayName = "FaqSectionWithCategories";

export { FaqSectionWithCategories };
