import { useEffect, useState } from "react";
import { initials, avatarHue } from "../lib/format";
import { userApi } from "../api/endpoints";

const sizeMap = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-24 w-24 text-2xl",
};

export default function Avatar({ name, id, src, size = "md", className = "" }) {
  const hue = avatarHue(id ?? name);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    if (!src) {
      setImageSrc(null);
      return undefined;
    }
    if (src.startsWith("data:")) {
      setImageSrc(src);
      return undefined;
    }

    let objectUrl;
    let active = true;
    userApi.avatar(src).then((image) => {
      if (active) {
        objectUrl = URL.createObjectURL(image);
        setImageSrc(objectUrl);
      }
    }).catch(() => {
      if (active) setImageSrc(null);
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

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
      {imageSrc ? <img src={imageSrc} alt={name} className="h-full w-full rounded-full object-cover" /> : initials(name)}
    </div>
  );
}