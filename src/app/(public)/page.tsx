import { redirect } from "next/navigation";
import { routes } from "@/shared/constants/routes";

// Redirect-only page: there is no renderable shell to validate, so instant
// navigation validation would only report the redirect itself.
export const instant = false;

export default function HomePage() {
  redirect(routes.login);
}
