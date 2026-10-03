import { type Instrumentation } from "next";

const PREFIX = "[rac-frontend]";

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  console.log(`${PREFIX} server starting — env=${process.env.NODE_ENV}`);
}

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const message = error instanceof Error ? error.message : String(error);
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  console.error(`${PREFIX} server error`, {
    message,
    digest,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    revalidateReason: context.revalidateReason,
  });
};
