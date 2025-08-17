import * as React from "react";
import { cn } from "@/lib/utils"; // optional class name utility

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, onBlur, name, value, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className
        )}
        ref={ref}
        name={name}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        {...props}
      />
    );
  }
);


Input.displayName = "Input";

export { Input };
