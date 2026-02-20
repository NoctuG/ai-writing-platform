import * as React from "react";
import { Label as FluentLabel } from "@fluentui/react-components";

export function Label(props: React.ComponentProps<typeof FluentLabel>) {
  return <FluentLabel {...props} />;
}
