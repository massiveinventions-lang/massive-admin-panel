// Minimal sonner wrapper — re-exports the Toaster from the sonner package
// with our default theme. Matches the public site's sonner setup.
import { Toaster as SonnerToaster } from "sonner";

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return <SonnerToaster {...props} />;
}
