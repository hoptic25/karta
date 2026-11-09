import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding font-semibold uppercase text-xs tracking-wider whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-xs",
        outline:
          "border-primary text-primary bg-transparent hover:bg-primary/5 active:bg-primary/10",
        secondary:
          "border-primary text-primary bg-transparent hover:bg-primary/10 active:bg-primary/15",
        success:
          "bg-sage-green text-white hover:bg-sage-green/90 active:bg-sage-green/95 shadow-xs",
        ghost:
          "hover:bg-muted hover:text-foreground active:bg-muted/80",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary lowercase tracking-normal font-normal underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 gap-2 text-xs",
        sm: "h-8 px-3 gap-1.5 text-[11px]",
        lg: "h-11 px-6 gap-2.5 text-sm",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
