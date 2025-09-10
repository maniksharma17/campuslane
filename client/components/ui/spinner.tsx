import React from "react";

export default function ThreeDotsSpinner({
  size = 10,
  gap = 8,
  color = "slate-700",
  duration = 0.6,
  className = "",
}) {
  const dotStyle = {
    width: `${size}px`,
    height: `${size}px`,
    marginLeft: `${gap / 2}px`,
    marginRight: `${gap / 2}px`,
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
    <div
      className={`z-50 inline-flex items-end justify-center ${className}`}
      aria-hidden="true"
      style={{ lineHeight: 0 }}
    >
      <style>{`
        @keyframes three-dots-jump {
          0% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
          60% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
      `}</style>

      <span
        className={`rounded-full bg-${color} inline-block`}
        style={{
          ...dotStyle,
          animation: `three-dots-jump ${duration}s ease-in-out infinite`,
          animationDelay: `0s`,
        }}
      />

      <span
        className={`rounded-full bg-${color} inline-block`}
        style={{
          ...dotStyle,
          animation: `three-dots-jump ${duration}s ease-in-out infinite`,
          animationDelay: `${duration * 0.15}s`,
        }}
      />

      <span
        className={`rounded-full bg-${color} inline-block`}
        style={{
          ...dotStyle,
          animation: `three-dots-jump ${duration}s ease-in-out infinite`,
          animationDelay: `${duration * 0.3}s`,
        }}
      />
    </div>
  </div>
  );
}
