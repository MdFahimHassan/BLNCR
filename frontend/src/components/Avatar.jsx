import { initials, avatarHue } from "../lib/format";

const sizeMap = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-24 w-24 text-2xl",
};

export default function Avatar({ name, id, src, size = "md", className = "" }) {
  const hue = avatarHue(id ?? name);
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeMap[size]} ${className}`}
      style={{
        background: `hsl(${hue} 45% 16%)`,
        color: `hsl(${hue} 70% 72%)`,
        border: `1px solid hsl(${hue} 45% 26%)`,
      }}
      title={name}
    >
      {src ? <img src={src} alt={name} className="h-full w-full rounded-full object-cover" /> : initials(name)}
    </div>
  );
}