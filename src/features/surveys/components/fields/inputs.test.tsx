import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@/shared/i18n";
import {
  EquipmentChecklist,
  RadioCards,
  ChecklistTable,
  LikertTable,
  SeasonalMatrix,
  WorkforceMatrix,
  type EquipmentItemValue,
} from "./inputs";
import { ComplexFieldRenderer } from "./FieldRenderer";
import { SECTIONS } from "../../schema";

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe("RadioCards (singleChoice renderer)", () => {
  it("renders one radio per option and fires selection", () => {
    const onChange = vi.fn();
    renderWithI18n(
      <RadioCards label="النوع" value={null} options={["yes", "no"]} onChange={onChange} />
    );

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);

    fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
    expect(onChange).toHaveBeenCalledWith("yes");
  });

  it("marks the active option", () => {
    renderWithI18n(
      <RadioCards label="النوع" value="no" options={["yes", "no"]} onChange={vi.fn()} />
    );
    expect(screen.getByRole("radio", { name: "لا" })).toHaveAttribute("aria-checked", "true");
  });
});

describe("ChecklistTable (observation checklist renderer)", () => {
  it("renders a row per checklist item with three states", () => {
    renderWithI18n(
      <ChecklistTable
        label="قائمة الملاحظة"
        items={["vacuumPump", "leakDetector"]}
        value={{}}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("مضخة تفريغ")).toBeInTheDocument();
    expect(screen.getByText("كاشف تسريب")).toBeInTheDocument();
    const groups = screen.getAllByRole("radiogroup");
    groups.forEach((group) => {
      expect(group.querySelectorAll("[role='radio']")).toHaveLength(3);
    });
  });

  it("records the chosen state per item", () => {
    const onChange = vi.fn();
    renderWithI18n(
      <ChecklistTable
        label="قائمة الملاحظة"
        items={["vacuumPump"]}
        value={{}}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("radio", { name: "متاح" }));
    expect(onChange).toHaveBeenCalledWith({ vacuumPump: "available" });
  });
});

describe("LikertTable (axis statements renderer)", () => {
  it("renders one radio per row×scale and records the mark under the row key", () => {
    const onChange = vi.fn();
    renderWithI18n(
      <LikertTable
        label="المحور الأول"
        firstColLabel="العبارة"
        rows={["s1", "s2"]}
        rowLabelFor={(row) => (row === "s1" ? "العبارة الأولى" : "العبارة الثانية")}
        scale={["no", "somewhat", "yes"]}
        value={{}}
        onChange={onChange}
      />
    );

    // 2 rows × 3 scale options
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    fireEvent.click(screen.getByRole("radio", { name: "العبارة الأولى — نعم" }));
    expect(onChange).toHaveBeenCalledWith({ s1: "yes" });
  });

  it("marks the active cell from the stored value", () => {
    renderWithI18n(
      <LikertTable
        label="التحديات"
        firstColLabel="التحدي"
        rows={["toolsShortage"]}
        rowLabelFor={() => "نقص الأدوات والأجهزة"}
        scale={["notAChallenge", "somewhat", "isChallenge"]}
        value={{ toolsShortage: "isChallenge" }}
        onChange={vi.fn()}
      />
    );
    expect(
      screen.getByRole("radio", { name: "نقص الأدوات والأجهزة — يمثل تحديًا" })
    ).toHaveAttribute("aria-checked", "true");
  });
});

describe("ComplexFieldRenderer — axis sections (schema v2)", () => {
  it("renders the digitized statement bank instead of a placeholder", () => {
    const section = SECTIONS.find((candidate) => candidate.key === "orgManagement")!;
    renderWithI18n(
      <ComplexFieldRenderer
        section={section}
        field={section.fields[0]}
        answers={{}}
        onChange={vi.fn()}
      />
    );

    expect(
      screen.getByText("تحتفظ إدارة الورشة بسجلات منتظمة لعمليات الصيانة والإصلاح.")
    ).toBeInTheDocument();
    expect(screen.getByText("العبارة")).toBeInTheDocument();
    // 6 statements × لا/إلى حد ما/نعم
    expect(screen.getAllByRole("radio")).toHaveLength(18);
  });

  it("renders the axis-8 ranking and challenge blocks with item labels", () => {
    const section = SECTIONS.find((candidate) => candidate.key === "inclusionGenderInformal")!;
    const ranking = section.fields.find((field) => field.key === "priorityRanking")!;
    renderWithI18n(
      <ComplexFieldRenderer section={section} field={ranking} answers={{}} onChange={vi.fn()} />
    );
    // 12 items × 5 priorities
    expect(screen.getAllByRole("radio")).toHaveLength(60);
    expect(screen.getByText("جهاز استرجاع غاز الفريون")).toBeInTheDocument();
  });
});

describe("WorkforceMatrix (3×3 with derived/editable total)", () => {
  // stateful harness — mirrors the wizard, which feeds each change back as props
  function Harness() {
    const [value, setValue] = useState<Record<string, { male: number | null; female: number | null; total: number | null }>>({});
    return (
      <WorkforceMatrix
        label="القوى العاملة"
        rows={["engineers"]}
        value={value}
        onChange={setValue}
      />
    );
  }

  it("computes total = male + female automatically", () => {
    renderWithI18n(<Harness />);

    const male = screen.getByLabelText(/مهندسون — ذكور/);
    const female = screen.getByLabelText(/مهندسون — إناث/);
    fireEvent.change(male, { target: { value: "2" } });
    fireEvent.change(female, { target: { value: "3" } });

    expect(screen.getByLabelText(/مهندسون — الإجمالي/)).toHaveValue("5");
  });

  it("accepts a direct total edit without touching the split", () => {
    renderWithI18n(<Harness />);

    fireEvent.change(screen.getByLabelText(/مهندسون — إناث/), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/مهندسون — الإجمالي/), { target: { value: "9" } });

    expect(screen.getByLabelText(/مهندسون — الإجمالي/)).toHaveValue("9");
    expect(screen.getByLabelText(/مهندسون — إناث/)).toHaveValue("4");
    expect(screen.getByLabelText(/مهندسون — ذكور/)).toHaveValue("");
  });
});

describe("SeasonalMatrix (backend-pinned 4 volume bands)", () => {
  it("renders exactly the four new bands and none of the retired ones", () => {
    renderWithI18n(
      <SeasonalMatrix
        label="متوسط السيارات المخدومة شهريًا"
        rows={["peakSeason_may_sep"]}
        value={{}}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("أقل من ٣٠")).toBeInTheDocument();
    expect(screen.getByText("٣٠–٥٠")).toBeInTheDocument();
    expect(screen.getByText("٥١–١٠٠")).toBeInTheDocument();
    expect(screen.getByText("أكثر من ١٠٠")).toBeInTheDocument();
    expect(screen.queryByText("أقل من ٢٠")).not.toBeInTheDocument();
    // 1 row × 4 bands
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });
});

describe("EquipmentChecklist (toolsEquipment block)", () => {
  function Harness() {
    const [value, setValue] = useState<Record<string, EquipmentItemValue>>({});
    return <EquipmentChecklist label="معدات الخدمة الأساسية" value={value} onChange={setValue} />;
  }

  it("renders six item cards with availability + condition toggles", () => {
    renderWithI18n(<Harness />);

    expect(screen.getByText("ماكينة استرجاع وإعادة تدوير وسيط التبريد")).toBeInTheDocument();
    expect(screen.getByText("عدادات ضغط (Manifold Set)")).toBeInTheDocument();
    // 6 items × (available yes/no + condition working/inadequate)
    expect(screen.getAllByRole("radio")).toHaveLength(24);
    expect(screen.getAllByText("متوفرة لكن غير فعالة")).toHaveLength(6);
  });

  it("hides spec inputs until the item is available, then shows only that item's specs", () => {
    renderWithI18n(<Harness />);

    // vacuum pump spec hidden while availability is unanswered
    expect(
      screen.queryByLabelText("مضخة تفريغ (Vacuum Pump) — القدرة (حصان)")
    ).not.toBeInTheDocument();

    const vacuumAvailability = screen.getByRole("radiogroup", {
      name: "مضخة تفريغ (Vacuum Pump) — متوفرة؟",
    });
    fireEvent.click(within(vacuumAvailability).getByRole("radio", { name: "نعم" }));
    expect(
      screen.getByLabelText("مضخة تفريغ (Vacuum Pump) — القدرة (حصان)")
    ).toBeInTheDocument();

    // recovery machine has no specs — stays spec-free even when available
    const machineAvailability = screen.getByRole("radiogroup", {
      name: "ماكينة استرجاع وإعادة تدوير وسيط التبريد — متوفرة؟",
    });
    fireEvent.click(within(machineAvailability).getByRole("radio", { name: "نعم" }));
    expect(screen.getAllByText("القدرة (حصان)")).toHaveLength(1);
    expect(screen.queryByText("السعة (كجم)")).not.toBeInTheDocument();
  });

  it("records the dual-gas flag for the leak detector", () => {
    renderWithI18n(<Harness />);

    const availability = screen.getByRole("radiogroup", {
      name: "جهاز كشف تسرب إلكتروني — متوفرة؟",
    });
    fireEvent.click(within(availability).getByRole("radio", { name: "نعم" }));
    expect(
      screen.getByLabelText("جهاز كشف تسرب إلكتروني — تدعم R134a و R1234yf")
    ).toBeInTheDocument();
    const dualGas = screen.getByRole("radiogroup", {
      name: "جهاز كشف تسرب إلكتروني — تدعم R134a و R1234yf",
    });
    fireEvent.click(within(dualGas).getByRole("radio", { name: "نعم" }));
  });

  it("feeds availability, condition, and spec values back through onChange", () => {
    const recorded: Array<Record<string, EquipmentItemValue>> = [];
    function RecordingHarness() {
      const [value, setValue] = useState<Record<string, EquipmentItemValue>>({});
      return (
        <EquipmentChecklist
          label="معدات الخدمة الأساسية"
          value={value}
          onChange={(next) => {
            recorded.push(next);
            setValue(next);
          }}
        />
      );
    }
    renderWithI18n(<RecordingHarness />);

    const availability = screen.getByRole("radiogroup", {
      name: "مضخة تفريغ (Vacuum Pump) — متوفرة؟",
    });
    fireEvent.click(within(availability).getByRole("radio", { name: "نعم" }));
    const condition = screen.getByRole("radiogroup", {
      name: "مضخة تفريغ (Vacuum Pump) — الحالة",
    });
    fireEvent.click(within(condition).getByRole("radio", { name: "تعمل بكفاءة" }));
    fireEvent.change(screen.getByLabelText("مضخة تفريغ (Vacuum Pump) — القدرة (حصان)"), {
      target: { value: "2" },
    });

    // the last onChange carries the full item value
    const last = recorded[recorded.length - 1];
    expect(last.vacuumPump).toEqual({ available: "yes", condition: "working", powerHp: 2 });
  });
});
