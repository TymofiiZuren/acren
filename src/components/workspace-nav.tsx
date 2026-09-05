"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArchiveIcon, RateIcon, InvoiceIcon, ShieldIcon, UsersIcon, WorkIcon } from "@/components/icons";

export function WorkspaceNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const archive = params.get("status") === "archived";
  const items = [
    { href: "/jobs", label: "Work queue", active: pathname === "/jobs", icon: <WorkIcon /> },
    { href: "/rates", label: "Rate card", active: pathname.startsWith("/rates"), icon: <RateIcon /> },
    { href: "/invoices", label: "Invoices", active: pathname.startsWith("/invoices") || pathname === "/billing", icon: <InvoiceIcon /> },
    { href: "/clients", label: "Client book", active: pathname.startsWith("/clients") && !archive, icon: <UsersIcon /> },
    { href: "/clients?status=archived", label: "Archived", active: pathname === "/clients" && archive, icon: <ArchiveIcon /> },
    { href: "/privacy-centre", label: "Privacy centre", active: pathname === "/privacy-centre", icon: <ShieldIcon /> },
  ];
  return <nav aria-label="Main navigation" className="flex flex-wrap gap-1 lg:flex-col">{items.map((item) => <Link key={item.href} href={item.href} className="nav-link" aria-current={item.active ? "page" : undefined}>{item.icon}{item.label}</Link>)}</nav>;
}
