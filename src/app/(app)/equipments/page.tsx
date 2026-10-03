import { redirect } from "next/navigation";
import { routes } from "@/shared/constants/routes";

// /equipments is a legacy alias — the Equipment page lives at /equipment-deliveries.
export default function Page() {
  redirect(routes.equipmentDeliveries);
}
