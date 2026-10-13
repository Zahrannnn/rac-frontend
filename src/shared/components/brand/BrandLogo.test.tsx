import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandLogo } from "./BrandLogo";

describe("BrandLogo", () => {
  it("renders the snowflake, wordmark, and car lockup", () => {
    render(<BrandLogo />);
    expect(screen.getByRole("img", { name: "MAC-Egypt" })).toBeInTheDocument();
    expect(document.querySelector(".lucide-snowflake")).toBeInTheDocument();
    expect(document.querySelector(".lucide-car")).toBeInTheDocument();
    expect(screen.getByText("MAC-Egypt")).toBeInTheDocument();
  });

  it("renders icon-only for tight spaces", () => {
    render(<BrandLogo withWordmark={false} />);
    expect(screen.getByRole("img", { name: "MAC-Egypt" })).toBeInTheDocument();
    expect(screen.queryByText("MAC-Egypt")).not.toBeInTheDocument();
  });
});
