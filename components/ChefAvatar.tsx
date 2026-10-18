/* eslint-disable @next/next/no-img-element */

/** Channel avatar from YouTube when the agent found one, otherwise initials. */
export function ChefAvatar({ chef, src, size = 64 }: { chef: { name: string }; src?: string; size?: number }) {
  const initials = chef.name.replace(/\(.*\)/, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size }} aria-hidden="true">
      {src ? <img src={src} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer" /> : initials}
    </span>
  );
}
