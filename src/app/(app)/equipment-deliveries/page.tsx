import type { Metadata } from "next";
import { EquipmentDeliveriesPage } from "@/features/equipment-deliveries";

export const metadata: Metadata = {
  title: "Equipment deliveries | MAC-Egypt",
};

export default function Page() {
  return <EquipmentDeliveriesPage />;
}
