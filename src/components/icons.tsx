import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export function UsersIcon(props: IconProps) { return <svg {...base} {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
export function PlusIcon(props: IconProps) { return <svg {...base} {...props}><path d="M12 5v14M5 12h14"/></svg>; }
export function SearchIcon(props: IconProps) { return <svg {...base} {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>; }
export function ArchiveIcon(props: IconProps) { return <svg {...base} {...props}><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>; }
export function ArrowIcon(props: IconProps) { return <svg {...base} {...props}><path d="m9 18 6-6-6-6"/></svg>; }
export function LogOutIcon(props: IconProps) { return <svg {...base} {...props}><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>; }
export function AcrenMark(props: IconProps) { return <svg {...base} {...props}><path d="M3 20 12 3l9 17M7 13h10M5 17h14M3 21h18" strokeWidth="1.5"/></svg>; }
export function WorkIcon(props: IconProps) { return <svg {...base} {...props}><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6V3h8v3M3 12h18M10 12v3h4v-3"/></svg>; }
export function ShieldIcon(props: IconProps) { return <svg {...base} {...props}><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-5"/></svg>; }
