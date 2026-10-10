import { beforeEach, describe, expect, it } from "vitest";
import { SECTIONS } from "../schema";
import { createTelemetryTracker, logTelemetryEvent, readTelemetry } from "./telemetry";

beforeEach(() => {
  window.localStorage.clear();
});

describe("telemetry ring buffer", () => {
  it("appends events to a per-survey buffer capped at the last 200", () => {
    for (let index = 0; index < 230; index++) {
      logTelemetryEvent("sv-1", {
        type: "section_open",
        sectionKey: "basicInfo",
        at: index,
      });
    }

    const events = readTelemetry("sv-1");
    expect(events).toHaveLength(200);
    expect(events[0]).toMatchObject({ type: "section_open", at: 30 });
    expect(events[199]).toMatchObject({ at: 229 });
  });

  it("keys storage per survey id", () => {
    logTelemetryEvent("sv-1", { type: "section_open", sectionKey: "consent", at: 1 });
    logTelemetryEvent("sv-2", { type: "section_open", sectionKey: "closing", at: 2 });

    expect(readTelemetry("sv-1")).toHaveLength(1);
    expect(readTelemetry("sv-2")).toHaveLength(1);
    expect(readTelemetry("sv-1")[0]).toMatchObject({ type: "section_open", sectionKey: "consent" });
  });

  it("tolerates corrupt storage", () => {
    window.localStorage.setItem("rac.telemetry.survey.sv-1", "{not json");
    expect(readTelemetry("sv-1")).toEqual([]);
  });
});

describe("telemetry tracker (wizard wiring)", () => {
  it("logs open, dwell, toc jump, and abandon with unanswered requireds", () => {
    let nowMs = 1000;
    const tracker = createTelemetryTracker(
      "sv-1",
      () => SECTIONS,
      (sectionKey) => (sectionKey === "workforce" ? { workforce: {} } : {}),
      () => nowMs
    );

    tracker.enterSection("workforce");
    nowMs = 45_000;
    tracker.leaveSection("basicInfo", true);

    const events = readTelemetry("sv-1");
    expect(events.map((event) => event.type)).toEqual([
      "section_open",
      "section_dwell_ms",
      "toc_jump",
      "abandon_section",
    ]);
    expect(events[1]).toMatchObject({ sectionKey: "workforce", dwellMs: 44_000 });
    expect(events[2]).toMatchObject({ from: "workforce", to: "basicInfo" });
    // workforce has 6 required fields — all unanswered here
    expect(events[3]).toMatchObject({ sectionKey: "workforce", unansweredRequired: 6 });
  });

  it("does not log abandon when every required field is valid", () => {
    const axis = SECTIONS.find((section) => section.key === "orgManagement")!;
    const statements = Object.fromEntries(
      axis.fields[0].options!.map((row, index) => [row, index % 2 === 0 ? "yes" : "no"])
    );
    let nowMs = 0;
    const tracker = createTelemetryTracker(
      "sv-1",
      () => SECTIONS,
      (sectionKey) => (sectionKey === "orgManagement" ? { statements } : {}),
      () => nowMs
    );

    tracker.enterSection("orgManagement");
    nowMs = 900;
    tracker.leaveSection("closing", false);

    const types = readTelemetry("sv-1").map((event) => event.type);
    expect(types).toEqual(["section_open", "section_dwell_ms"]);
  });

  it("collapses consecutive field_revisited events for the same field", () => {
    const tracker = createTelemetryTracker("sv-1", () => SECTIONS, () => ({}));

    tracker.enterSection("basicInfo");
    tracker.fieldRevisited("district");
    tracker.fieldRevisited("district");
    tracker.fieldRevisited("district");
    tracker.fieldRevisited("phoneWhatsapp");

    const revisits = readTelemetry("sv-1").filter(
      (event) => event.type === "field_revisited"
    );
    expect(revisits).toHaveLength(2);
    expect(revisits.map((event) => (event as { fieldKey: string }).fieldKey)).toEqual([
      "district",
      "phoneWhatsapp",
    ]);
  });
});
