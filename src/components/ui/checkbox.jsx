import React from 'react';
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground flex items-center justify-center",
      className
    )}
    onClick={() => onCheckedChange?.(!checked)}
    data-state={checked ? "checked" : "unchecked"}
    {...props}
  >
    {checked && <Check className="h-3 w-3" />}
  </button>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
