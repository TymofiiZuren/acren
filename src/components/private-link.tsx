import NextLink from "next/link";
import type { ComponentProps } from "react";

type PrivateLinkProps = ComponentProps<typeof NextLink>;

export function PrivateLink(props: PrivateLinkProps) {
  return <NextLink {...props} prefetch={false} />;
}
