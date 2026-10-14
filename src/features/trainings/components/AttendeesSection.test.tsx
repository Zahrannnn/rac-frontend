import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { TechnicianCandidate, TrainingAttendee } from "../types";

const {
  fetchCandidatesMock,
  addAttendeeMock,
  updateAttendeeMock,
  removeAttendeeMock,
  toastMock,
} = vi.hoisted(() => ({
  fetchCandidatesMock: vi.fn(),
  addAttendeeMock: vi.fn(),
  updateAttendeeMock: vi.fn(),
  removeAttendeeMock: vi.fn(),
  toastMock: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Only the wire calls are stubbed — the React Query hooks and the debounce
// run for real so the tests exercise the actual picker behavior.
vi.mock("../api/trainings-adapter", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  fetchTechnicianCandidates: fetchCandidatesMock,
  addAttendee: addAttendeeMock,
  updateAttendee: updateAttendeeMock,
  removeAttendee: removeAttendeeMock,
}));

vi.mock("sonner", () => ({ toast: toastMock }));

import { AttendeesSection } from "./AttendeesSection";

const attendee: TrainingAttendee = {
  id: "a-1",
  technicianId: "t-1",
  technicianName: "أحمد سمير",
  preScore: 60,
  postScore: 85,
  createdAtUtc: "2026-10-01T10:00:00Z",
};

const candidate: TechnicianCandidate = {
  id: "t-2",
  fullName: "Mohamed Ali",
  fullNameAr: "محمد علي",
  mobile: "01098765432",
  workshopCode: "MAC-CAR-000125",
  workshopName: "ورشة النصر",
  governorate: "Cairo",
};

const enrolledCandidate: TechnicianCandidate = {
  ...candidate,
  id: "t-1",
  fullName: "Ahmed Samir",
  fullNameAr: "أحمد سمير",
};

function renderSection(attendees: TrainingAttendee[] = [attendee]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <AttendeesSection trainingId="tr-1" attendees={attendees} canEdit />
      </I18nProvider>
    </QueryClientProvider>
  );
}

function flush() {
  return act(async () => {});
}

/** Advances fake timers inside act so timer-driven React state (the debounce)
 * actually flushes before assertions. Only used in the fake-timer tests. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
  await flush();
}

function searchBox() {
  return screen.getByRole("combobox", { name: "إضافة مشارك" });
}

async function searchFor(term: string) {
  fireEvent.change(searchBox(), { target: { value: term } });
  return screen.findByRole("listbox");
}

beforeEach(() => {
  // jsdom has no layout; the picker scrolls the highlighted option into view.
  Element.prototype.scrollIntoView = vi.fn();
  fetchCandidatesMock.mockResolvedValue([candidate]);
  addAttendeeMock.mockResolvedValue({ ...attendee, id: "a-2", technicianId: "t-2" });
  updateAttendeeMock.mockResolvedValue(undefined);
  removeAttendeeMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("AttendeePicker search", () => {
  it("keeps the candidates query idle while the search is shorter than 2 chars", async () => {
    vi.useFakeTimers();
    renderSection();

    fireEvent.change(searchBox(), { target: { value: "ا" } });
    await advance(1000);

    expect(fetchCandidatesMock).not.toHaveBeenCalled();
    expect(screen.getByText("اكتب حرفين على الأقل للبحث عن فني.")).toBeInTheDocument();
  });

  it("debounces the search and fires once with the final 2+ char term", async () => {
    vi.useFakeTimers();
    renderSection();

    fireEvent.change(searchBox(), { target: { value: "مح" } });
    fireEvent.change(searchBox(), { target: { value: "محمد" } });
    await advance(200);
    expect(fetchCandidatesMock).not.toHaveBeenCalled();

    await advance(300);
    expect(fetchCandidatesMock).toHaveBeenCalledTimes(1);
    expect(fetchCandidatesMock).toHaveBeenCalledWith("محمد");
  });

  it("sends Arabic-Indic digits as Western digits", async () => {
    vi.useFakeTimers();
    renderSection();

    fireEvent.change(searchBox(), { target: { value: " ٠١٠٩٨ " } });
    await advance(500);

    expect(fetchCandidatesMock).toHaveBeenCalledWith("01098");
  });

  it("shows two-line rows: Arabic name, English name, workshop code and mobile", async () => {
    renderSection();
    const listbox = await searchFor("محمد");

    const option = within(listbox).getByRole("option", { name: /محمد علي/ });
    expect(option).toHaveTextContent("Mohamed Ali");
    expect(option).toHaveTextContent("MAC-CAR-000125");
    expect(option).toHaveTextContent("01098765432");
    expect(searchBox()).toHaveAttribute("aria-expanded", "true");
  });

  it("shows an inline error with retry when the search fails", async () => {
    fetchCandidatesMock.mockRejectedValueOnce(new Error("network"));
    renderSection();
    fireEvent.change(searchBox(), { target: { value: "علي" } });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("تعذّر البحث عن الفنيين");

    fireEvent.click(within(alert).getByRole("button", { name: "إعادة المحاولة" }));
    expect(await screen.findByRole("option", { name: /محمد علي/ })).toBeInTheDocument();
  });

  it("explains an empty result and the 20-row cap", async () => {
    fetchCandidatesMock.mockResolvedValueOnce([]);
    renderSection();
    fireEvent.change(searchBox(), { target: { value: "zz" } });
    // Shown inline and announced through the polite live region.
    expect(await screen.findAllByText("لا يوجد فني بهذا الاسم أو الرقم.")).toHaveLength(2);

    fetchCandidatesMock.mockResolvedValueOnce(
      Array.from({ length: 20 }, (_, i) => ({ ...candidate, id: `c-${i}` }))
    );
    fireEvent.change(searchBox(), { target: { value: "MAC" } });
    expect(await screen.findByText(/تظهر أول 20 نتيجة/)).toBeInTheDocument();
  });

  it("clears the search on Escape", async () => {
    renderSection();
    await searchFor("محمد");

    fireEvent.keyDown(searchBox(), { key: "Escape" });
    expect(searchBox()).toHaveValue("");
  });
});

describe("AttendeePicker adding", () => {
  it("adds the highlighted candidate on Enter with the optional scores, keeping the search", async () => {
    renderSection();
    await searchFor("محمد");
    await screen.findByRole("option", { name: /محمد علي/ });

    fireEvent.change(screen.getByLabelText("قبل"), { target: { value: "٧٠" } });
    fireEvent.change(screen.getByLabelText("بعد"), { target: { value: "90" } });
    fireEvent.keyDown(searchBox(), { key: "Enter" });
    await flush();

    expect(addAttendeeMock).toHaveBeenCalledWith("tr-1", {
      technicianId: "t-2",
      preScore: 70,
      postScore: 90,
    });
    expect(searchBox()).toHaveValue("محمد");
    expect(screen.getByLabelText("قبل")).toHaveValue("");
    expect(
      await screen.findByRole("option", { name: /محمد علي.*مسجّل/ })
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("moves the highlight with the arrow keys", async () => {
    fetchCandidatesMock.mockResolvedValue([
      candidate,
      { ...candidate, id: "t-3", fullName: "Omar", fullNameAr: "عمر حسن" },
    ]);
    renderSection();
    await searchFor("MAC");
    const second = await screen.findByRole("option", { name: /عمر حسن/ });

    fireEvent.keyDown(searchBox(), { key: "ArrowDown" });
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(searchBox()).toHaveAttribute("aria-activedescendant", second.id);

    fireEvent.keyDown(searchBox(), { key: "Home" });
    expect(second).toHaveAttribute("aria-selected", "false");
  });

  it("offers Undo that removes the just-added attendee", async () => {
    renderSection();
    await searchFor("محمد");
    fireEvent.click(await screen.findByRole("option", { name: /محمد علي/ }));
    await flush();

    expect(toastMock.success).toHaveBeenCalledTimes(1);
    const [message, options] = toastMock.success.mock.calls[0];
    expect(message).toBe("تمت إضافة محمد علي");

    await act(async () => options.action.onClick());
    expect(removeAttendeeMock).toHaveBeenCalledWith("tr-1", "a-2");
  });

  it("marks already-enrolled technicians and never re-adds them", async () => {
    fetchCandidatesMock.mockResolvedValue([enrolledCandidate]);
    renderSection();
    await searchFor("أحمد");

    const option = await screen.findByRole("option", { name: /أحمد سمير/ });
    expect(option).toHaveTextContent("مسجّل");
    fireEvent.click(option);
    await flush();

    expect(addAttendeeMock).not.toHaveBeenCalled();
  });

  it("blocks the add when a score is out of range", async () => {
    renderSection();
    await searchFor("محمد");
    await screen.findByRole("option", { name: /محمد علي/ });

    fireEvent.change(screen.getByLabelText("قبل"), { target: { value: "150" } });
    fireEvent.keyDown(searchBox(), { key: "Enter" });
    await flush();

    expect(addAttendeeMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("قبل")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a per-row error when the add fails", async () => {
    addAttendeeMock.mockRejectedValueOnce({ status: 500 });
    renderSection();
    await searchFor("محمد");
    fireEvent.click(await screen.findByRole("option", { name: /محمد علي/ }));

    await waitFor(() =>
      expect(screen.getByRole("option", { name: /محمد علي/ })).toHaveTextContent(
        "تعذّرت إضافة الحضور"
      )
    );
  });
});

describe("AttendeesSection list", () => {
  it("teaches the empty state", () => {
    renderSection([]);
    expect(screen.getByText("لا يوجد حضور بعد")).toBeInTheDocument();
    expect(
      screen.getByText("ابحث بالاسم أو الجوال أو كود الورشة لإضافة أول مشارك.")
    ).toBeInTheDocument();
  });

  it("edits a row's scores through the PUT endpoint", async () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "تعديل الدرجات" }));
    await flush();

    fireEvent.change(screen.getByLabelText("درجة ما قبل التدريب"), {
      target: { value: "80" },
    });
    fireEvent.click(screen.getByRole("button", { name: "حفظ الدرجات" }));
    await flush();

    expect(updateAttendeeMock).toHaveBeenCalledWith("tr-1", "a-1", {
      preScore: 80,
      postScore: 85,
    });
  });

  it("removes an attendee only after the confirmation dialog", async () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "إزالة حضور" }));
    expect(screen.getByText("إزالة أحمد سمير من قائمة الحضور؟")).toBeInTheDocument();
    expect(removeAttendeeMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "إزالة" }));
    await flush();

    expect(removeAttendeeMock).toHaveBeenCalledWith("tr-1", "a-1");
  });
});
