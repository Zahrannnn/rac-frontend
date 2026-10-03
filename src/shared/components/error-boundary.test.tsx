import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WidgetErrorBoundary } from "./error-boundary";

function Bomb(): never {
  throw new Error("boom");
}

describe("WidgetErrorBoundary", () => {
  it("renders children while healthy", () => {
    render(
      <WidgetErrorBoundary fallback={<p>fallback</p>}>
        <p>content</p>
      </WidgetErrorBoundary>
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("degrades to the fallback when the subtree throws", () => {
    render(
      <WidgetErrorBoundary fallback={<p>fallback</p>}>
        <Bomb />
      </WidgetErrorBoundary>
    );
    expect(screen.getByText("fallback")).toBeInTheDocument();
  });
});
