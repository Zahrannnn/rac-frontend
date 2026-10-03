import type { Metadata } from "next";
import { EquipmentDeliveriesPage } from "@/features/equipment-deliveries";

export const metadata: Metadata = {
  title: "Equipment deliveries | RAC-DAMP",
};

export default function Page() {
  return <EquipmentDeliveriesPage />;
}
