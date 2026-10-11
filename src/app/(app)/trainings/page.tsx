import type { Metadata } from "next";
import { TrainingsPage } from "@/features/trainings";

export const metadata: Metadata = {
  title: "Trainings | MAC-DAMP",
};

export default function Page() {
  return <TrainingsPage />;
}
