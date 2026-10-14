import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import { PhotosSection } from "./PhotosSection";

const { uploadMutate, prepareMock, toastMock } = vi.hoisted(() => ({
  uploadMutate: vi.fn(),
  prepareMock: vi.fn(),
  toastMock: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

vi.mock("../hooks/use-trainings", () => ({
  useTrainingPhotoMutations: () => ({
    upload: { isPending: false, mutate: uploadMutate },
    remove: { isPending: false, mutate: vi.fn() },
  }),
}));

vi.mock("../api/trainings-adapter", () => ({
  downloadTrainingPhoto: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/shared/utils/image-compression", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prepareImageForUpload: prepareMock,
}));

const compressedWebp = new File([new Uint8Array(300)], "photo.webp", { type: "image/webp" });

function renderSection() {
  return render(
    <I18nProvider>
      <PhotosSection trainingId="t-1" canEdit photos={[]} />
    </I18nProvider>
  );
}

function pickFile(file: File) {
  const input = document.querySelector('input[type="file"]');
  if (!input) {
    throw new Error("file input not rendered");
  }
  fireEvent.change(input, { target: { files: [file] } });
}

describe("PhotosSection (trainings) — compress-then-upload flow", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // toast/mutation mocks accumulate across tests otherwise
  });

  it("rejects originals over 20MB with the input-cap toast and never uploads", async () => {
    prepareMock.mockResolvedValue({ ok: false, reason: "input-too-large" });

    renderSection();
    pickFile(new File([new Uint8Array(10)], "photo.jpg", { type: "image/jpeg" }));

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("حجم الصورة الأصلي يتجاوز ٢٠ ميجابايت")
    );
    expect(uploadMutate).not.toHaveBeenCalled();
  });

  it("uploads the compressed WebP through the training photo mutation", async () => {
    prepareMock.mockResolvedValue({ ok: true, file: compressedWebp });

    renderSection();
    pickFile(new File([new Uint8Array(10)], "photo.jpg", { type: "image/jpeg" }));

    await waitFor(() => expect(uploadMutate).toHaveBeenCalledWith(compressedWebp, expect.anything()));
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it("rejects with the post-compression toast when output still exceeds 2MB", async () => {
    prepareMock.mockResolvedValue({ ok: false, reason: "stored-too-large" });

    renderSection();
    pickFile(new File([new Uint8Array(10)], "photo.jpg", { type: "image/jpeg" }));

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("حجم الصورة بعد الضغط يتجاوز ٢ ميجابايت")
    );
    expect(uploadMutate).not.toHaveBeenCalled();
  });
});
