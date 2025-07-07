import React from "react";

const Badge = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}) => {
  const baseClasses = "inline-flex items-center gap-1 rounded-full font-medium";

  const variants = {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-[#6B46C1] text-white",
    secondary: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
    outline: "border border-[#6B46C1] text-[#6B46C1] bg-transparent",
    success: "bg-green-50 text-green-600",
    warning: "bg-yellow-50 text-yellow-600",
    danger: "bg-red-50 text-red-600",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge;
