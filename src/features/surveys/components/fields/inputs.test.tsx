import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { I18nProvider } from "@/shared/i18n";
import {
  RadioCards,
  ChecklistTable,
  LikertTable,
  RefrigerantMatrix,
  SeasonalMatrix,
  SignatureImage,
  WorkforceMatrix,
} from "./inputs";
import { ComplexFieldRenderer, FieldRenderer } from "./FieldRenderer";
import { SECTIONS } from "../../schema";

// Radix Select (governorate dropdown) relies on pointer-capture APIs jsdom
// does not implement — same stubs as the workshops DistrictSelect tests.
beforeAll(() => {
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.scrollIntoView = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

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

describe("FieldRenderer — enum with ui:\"select\" (pilot governorate dropdown)", () => {
  const basicInfo = SECTIONS.find((candidate) => candidate.key === "basicInfo")!;
  const governorate = basicInfo.fields.find((field) => field.key === "governorate")!;

  it("renders a dropdown with exactly the three pilot governorates and a placeholder when unanswered", async () => {
    renderWithI18n(
      <FieldRenderer section={basicInfo} field={governorate} answers={{}} onChange={vi.fn()} />
    );

    // closed state: combobox showing the placeholder, no radio grid
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("اختر من القائمة");

    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("option", { name: "القاهرة" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "الجيزة" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "القليوبية" })).toBeInTheDocument();
    // the retired 27-governorate list is gone from the survey enum
    expect(screen.queryByRole("option", { name: "كفر الشيخ" })).not.toBeInTheDocument();
  });

  it("shows a prefilled workshop governorate as the selected option", () => {
    renderWithI18n(
      <FieldRenderer
        section={basicInfo}
        field={governorate}
        answers={{ governorate: "giza" }}
        onChange={vi.fn()}
      />
    );

    // slugged key prefilled by withWorkshopContext → Arabic survey.opt.* label
    expect(screen.getByRole("combobox")).toHaveTextContent("الجيزة");
  });

  it("reports the chosen slugged key through onChange", async () => {
    const onChange = vi.fn();
    renderWithI18n(
      <FieldRenderer section={basicInfo} field={governorate} answers={{}} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole("combobox"));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "القاهرة" }));
    expect(onChange).toHaveBeenCalledWith("governorate", "cairo");
  });

  it("keeps plain enum fields on radio cards", () => {
    const workshopType = basicInfo.fields.find((field) => field.key === "workshopType")!;

    renderWithI18n(
      <FieldRenderer section={basicInfo} field={workshopType} answers={{}} onChange={vi.fn()} />
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
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
    expect(screen.getByText("جهاز كشف تسرب")).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("radio", { name: "متوافر" }));
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

    const male = screen.getByLabelText(/عدد المهندسين — ذكور/);
    const female = screen.getByLabelText(/عدد المهندسين — اناث/);
    fireEvent.change(male, { target: { value: "2" } });
    fireEvent.change(female, { target: { value: "3" } });

    expect(screen.getByLabelText(/عدد المهندسين — إجمالي/)).toHaveValue("5");
  });

  it("accepts a direct total edit without touching the split", () => {
    renderWithI18n(<Harness />);

    fireEvent.change(screen.getByLabelText(/عدد المهندسين — اناث/), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/عدد المهندسين — إجمالي/), { target: { value: "9" } });

    expect(screen.getByLabelText(/عدد المهندسين — إجمالي/)).toHaveValue("9");
    expect(screen.getByLabelText(/عدد المهندسين — اناث/)).toHaveValue("4");
    expect(screen.getByLabelText(/عدد المهندسين — ذكور/)).toHaveValue("");
  });
});

describe("SeasonalMatrix (questionnaire Ver3 — 5 volume bands)", () => {
  it("renders exactly the five Ver3 bands and none of the retired ones", () => {
    renderWithI18n(
      <SeasonalMatrix
        label="متوسط عدد السيارات التي تخدمها الورشة شهريًا"
        rows={["peakSeason_may_sep"]}
        value={{}}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("أقل من 20")).toBeInTheDocument();
    expect(screen.getByText("20-49")).toBeInTheDocument();
    expect(screen.getByText("50-99")).toBeInTheDocument();
    expect(screen.getByText("100-200")).toBeInTheDocument();
    expect(screen.getByText("أكثر من 200")).toBeInTheDocument();
    expect(screen.queryByText("أقل من ٣٠")).not.toBeInTheDocument();
    // 1 row × 5 bands
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("labels the seasonal rows verbatim from the questionnaire", () => {
    renderWithI18n(
      <SeasonalMatrix
        label="متوسط عدد السيارات التي تخدمها الورشة شهريًا"
        rows={["peakSeason_may_sep", "offSeason_oct_apr"]}
        value={{}}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("خلال موسم الذروة (مايو - سبتمبر)")).toBeInTheDocument();
    expect(screen.getByText("خارج موسم الذروة (اكتوبر - ابريل)")).toBeInTheDocument();
  });
});

describe("RefrigerantMatrix (supply difficulty = single لا/نعم mark)", () => {
  it("renders the two-option supply difficulty per refrigerant row", () => {
    renderWithI18n(
      <RefrigerantMatrix
        label="غازات التبريد المستخدمة"
        rows={["R-134a"]}
        value={{}}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("صعوبة توفير الغاز")).toBeInTheDocument();
    expect(screen.getByText("يستخدم")).toBeInTheDocument();
    expect(screen.getByText("عدد السيارات شهريًا تقريبًا")).toBeInTheDocument();
    // used (نعم/لا) + supply difficulty (لا/نعم) = 4 radios, no third state
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.queryByRole("radio", { name: "صعب" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "غير متوافر" })).not.toBeInTheDocument();
  });

  it("records a yes/no supply difficulty value", () => {
    const onChange = vi.fn();
    renderWithI18n(
      <RefrigerantMatrix
        label="غازات التبريد المستخدمة"
        rows={["R-134a"]}
        value={{}}
        onChange={onChange}
      />
    );

    // second radiogroup on the card is the supply difficulty (لا then نعم)
    fireEvent.click(screen.getAllByRole("radio", { name: "نعم" })[1]);
    expect(onChange).toHaveBeenCalledWith({ "R-134a": { supplyDifficulty: "yes" } });
  });
});

describe("SignatureImage (closing signatures captured as images)", () => {
  it("offers a camera capture input and hint when empty", () => {
    renderWithI18n(
      <SignatureImage label="توقيع الباحث" value={null} onChange={vi.fn()} />
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    expect(input).toHaveAttribute("accept", "image/*");
    expect(input).toHaveAttribute("capture", "environment");
    expect(screen.getByRole("button", { name: "التقاط صورة التوقيع" })).toBeInTheDocument();
    expect(screen.getByText("التقط صورة للتوقيع الورقي على الورق")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("previews the stored signature image with retake and remove actions", () => {
    const onChange = vi.fn();
    renderWithI18n(
      <SignatureImage
        label="توقيع الباحث"
        value="data:image/jpeg;base64,AAAA"
        onChange={onChange}
      />
    );

    expect(screen.getByRole("img", { name: "توقيع الباحث" })).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,AAAA"
    );
    expect(screen.getByRole("button", { name: "إعادة الالتقاط" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إزالة التوقيع" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
