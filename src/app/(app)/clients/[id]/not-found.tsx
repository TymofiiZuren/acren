import { PrivateLink as Link } from "@/components/private-link";

export default function MissingClient() {
  return <div className="mx-auto max-w-xl space-y-5 px-5 py-16"><h1 className="text-3xl font-medium">Client not available</h1><p className="leading-7 text-stone-600">This record could not be found in your client book.</p><Link className="button-primary" href="/clients">Back to clients</Link></div>;
}
