import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import { PhotoUploader } from "./PhotoUploader";

const { uploadMutate, prepareMock, toastMock } = vi.hoisted(() => ({
  uploadMutate: vi.fn(),
  prepareMock: vi.fn(),
  toastMock: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

vi.mock("../hooks/use-survey", () => ({
  useSurveyPhotos: () => ({ data: [], isPending: false }),
  usePhotoMutations: () => ({
    upload: { isPending: false, mutate: uploadMutate },
    remove: { isPending: false, mutate: vi.fn() },
  }),
}));

vi.mock("../api/surveys-adapter", () => ({
  photoUrl: () => "",
}));

vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/shared/utils/image-compression", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prepareImageForUpload: prepareMock,
}));

const compressedWebp = new File([new Uint8Array(300)], "photo.webp", { type: "image/webp" });

function renderUploader() {
  return render(
    <I18nProvider>
      <PhotoUploader surveyId="s-1" sectionKey="docs" label="صور التوثيق" />
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

describe("PhotoUploader — compress-then-upload flow", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // toast/mutation mocks accumulate across tests otherwise
  });

  it("rejects originals over 20MB with the input-cap toast and never uploads", async () => {
    prepareMock.mockResolvedValue({ ok: false, reason: "input-too-large" });

    renderUploader();
    pickFile(new File([new Uint8Array(10)], "photo.jpg", { type: "image/jpeg" }));

    await waitFor(() =>
      expect(toastMock.warning).toHaveBeenCalledWith("حجم الصورة الأصلي يتجاوز ٢٠ ميجابايت")
    );
    expect(uploadMutate).not.toHaveBeenCalled();
  });

  it("uploads the compressed WebP through the existing photo mutation", async () => {
    prepareMock.mockResolvedValue({ ok: true, file: compressedWebp });

    renderUploader();
    pickFile(new File([new Uint8Array(10)], "photo.jpg", { type: "image/jpeg" }));

    await waitFor(() =>
      expect(uploadMutate).toHaveBeenCalledWith(
        { file: compressedWebp, sectionKey: "docs" },
        expect.anything()
      )
    );
    expect(toastMock.warning).not.toHaveBeenCalled();
  });

  it("rejects with the post-compression toast when output still exceeds 2MB", async () => {
    prepareMock.mockResolvedValue({ ok: false, reason: "stored-too-large" });

    renderUploader();
    pickFile(new File([new Uint8Array(10)], "photo.jpg", { type: "image/jpeg" }));

    await waitFor(() =>
      expect(toastMock.warning).toHaveBeenCalledWith("حجم الصورة بعد الضغط يتجاوز ٢ ميجابايت")
    );
    expect(uploadMutate).not.toHaveBeenCalled();
  });

  it("surfaces the retry toast when the image cannot be processed", async () => {
    prepareMock.mockResolvedValue({ ok: false, reason: "decode-failed" });

    renderUploader();
    pickFile(new File([new Uint8Array(10)], "photo.jpg", { type: "image/jpeg" }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("حدث خطأ — إعادة المحاولة"));
    expect(uploadMutate).not.toHaveBeenCalled();
  });
});
