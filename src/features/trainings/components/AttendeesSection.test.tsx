import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { TrainingAttendee } from "../types";

const { fetchCandidatesMock, addAttendeeMock, updateAttendeeMock, removeAttendeeMock } =
  vi.hoisted(() => ({
    fetchCandidatesMock: vi.fn(),
    addAttendeeMock: vi.fn(),
    updateAttendeeMock: vi.fn(),
    removeAttendeeMock: vi.fn(),
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

import { AttendeesSection } from "./AttendeesSection";

const attendee: TrainingAttendee = {
  id: "a-1",
  technicianId: "t-1",
  technicianName: "أحمد سمير",
  preScore: 60,
  postScore: 85,
  createdAtUtc: "2026-10-01T10:00:00Z",
};

const candidate = {
  id: "t-2",
  fullName: "محمد علي",
  mobile: "01098765432",
  workshopCode: "MAC-CAR-000125",
  workshopName: "ورشة النصر",
  governorate: "Cairo",
};

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <AttendeesSection trainingId="tr-1" attendees={[attendee]} canEdit />
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

async function openAddDialog() {
  fireEvent.click(screen.getByRole("button", { name: "إضافة مشارك" }));
  await flush();
  return screen.getByLabelText("البحث عن فني");
}

beforeEach(() => {
  fetchCandidatesMock.mockResolvedValue([candidate]);
  addAttendeeMock.mockResolvedValue(attendee);
  updateAttendeeMock.mockResolvedValue(undefined);
  removeAttendeeMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("AttendeesSection participant management", () => {
  it("keeps the candidates query idle while the search is shorter than 2 chars", async () => {
    vi.useFakeTimers();
    renderSection();
    const search = await openAddDialog();

    fireEvent.change(search, { target: { value: "ا" } });
    await advance(1000);

    expect(fetchCandidatesMock).not.toHaveBeenCalled();
  });

  it("debounces the search and fires once with the final 2+ char term", async () => {
    vi.useFakeTimers();
    renderSection();
    const search = await openAddDialog();

    fireEvent.change(search, { target: { value: "مح" } });
    fireEvent.change(search, { target: { value: "محمد" } });
    await advance(200);
    expect(fetchCandidatesMock).not.toHaveBeenCalled();

    await advance(300);
    expect(fetchCandidatesMock).toHaveBeenCalledTimes(1);
    expect(fetchCandidatesMock).toHaveBeenCalledWith("محمد");
  });

  it("submits the selected candidate with its optional scores", async () => {
    renderSection();
    const search = await openAddDialog();

    fireEvent.change(search, { target: { value: "محمد" } });

    // Debounce (400 ms) + query resolve on the real clock here.
    const select = (await waitFor(() => {
      const element = screen.getByLabelText("الفني") as HTMLSelectElement;
      expect(element.querySelector('option[value="t-2"]')).not.toBeNull();
      return element;
    })) as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "t-2" } });
    fireEvent.change(screen.getByLabelText("درجة ما قبل التدريب"), {
      target: { value: "70" },
    });
    fireEvent.change(screen.getByLabelText("درجة ما بعد التدريب"), {
      target: { value: "90" },
    });
    fireEvent.click(screen.getByRole("button", { name: "إضافة" }));
    await flush();

    expect(addAttendeeMock).toHaveBeenCalledWith("tr-1", {
      technicianId: "t-2",
      preScore: 70,
      postScore: 90,
    });
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
