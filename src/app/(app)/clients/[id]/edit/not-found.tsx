import { PrivateLink as Link } from "@/components/private-link";

export default function NotFound() {
  return <div className="grid min-h-screen place-items-center px-5 text-center"><div><p className="eyebrow">Not found</p><h1 className="mt-3 text-3xl font-medium">That client isn’t available</h1><p className="mt-3 text-stone-600">It may have been archived, removed, or belong to another account.</p><Link href="/clients" className="button-primary mt-7 inline-flex">Return to clients</Link></div></div>;
}
