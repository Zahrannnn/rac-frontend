// Client-side instrumentation: runs before the app becomes interactive.

performance.mark("rac:app-init");

export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
) {
  performance.mark(`rac:nav-start:${navigationType}`, { detail: { url } });

  if (process.env.NODE_ENV === "development") {
    console.debug(`[rac-frontend] ${navigationType} → ${url}`);
  }
}
