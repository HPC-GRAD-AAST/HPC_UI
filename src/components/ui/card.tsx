import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";

import { cn } from "./utils";

const cardVariants = cva(
  "text-card-foreground flex flex-col gap-6 rounded-xl border transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-card border-border/80 shadow-sm ring-1 ring-black/[0.02] transition-shadow hover:shadow-md dark:border-border dark:ring-white/[0.04] dark:shadow-[0_0_36px_-18px_var(--neon-shadow)] dark:hover:shadow-[0_0_44px_-14px_var(--neon-glow)]",
        outline:
          "border-border bg-transparent shadow-none",
        muted:
          "border-transparent bg-muted/40 shadow-none",
        ghost:
          "border-transparent bg-transparent shadow-none gap-4",
        elevated:
          "bg-card border-border shadow-md",
        highlight:
          "bg-card border-primary/30 shadow-sm ring-1 ring-primary/15 dark:border-primary/40 dark:ring-primary/25",
        interactive:
          "bg-card border-border shadow-sm hover:border-primary/25 hover:shadow-md",
        inset:
          "border-border/80 bg-muted/30 shadow-none dark:bg-muted/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 pb-6 first:pt-6 [&:last-child]:pb-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-6 pb-6 pt-0 [.border-t]:border-border [.border-t]:pt-6",
        className,
      )}
      {...props}
    />
  );
}

export { Card, cardVariants, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
