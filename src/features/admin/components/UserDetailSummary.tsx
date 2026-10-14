"use client";

import { DialogSection } from "@/components/ui/dialog";
import { DetailItem, DetailList } from "@/shared/components/detail-list";
import { useT } from "@/shared/i18n";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import type { UserDetail } from "../types";
import { RoleBadge } from "./RoleBadge";

/**
 * The loaded-user readout inside UserDetailDialog: identity block, profile
 * details, and recent activity — kept separate so the dialog owns only
 * loading/error handling and the action footer.
 */
export function UserDetailSummary({ user }: { user: UserDetail }) {
  const t = useT();

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-base font-semibold text-foreground">{user.fullName}</p>
          <p className="font-mono text-sm text-muted-foreground" dir="ltr">
            {user.username}
          </p>
        </div>
        <RoleBadge role={user.role} />
      </div>

      <DetailList className="border-t pt-5">
        <DetailItem label={t("admin.users.email")}>
          <span dir="ltr">{user.email}</span>
        </DetailItem>
        <DetailItem label={t("admin.users.phone")}>
          <span dir="ltr" className="tabular-nums">{user.phone ?? "—"}</span>
        </DetailItem>
        <DetailItem label={t("admin.users.status")}>
          {t(user.isActive ? "admin.users.active" : "admin.users.inactive")}
        </DetailItem>
        <DetailItem label={t("admin.users.lastLogin")}>
          <span dir="ltr" className="tabular-nums">
            {user.lastLoginAtUtc ? formatDateTimeUtc(user.lastLoginAtUtc) : "—"}
          </span>
        </DetailItem>
        <DetailItem label={t("admin.users.createdAt")}>
          <span dir="ltr" className="tabular-nums">
            {formatDateTimeUtc(user.createdAtUtc)}
          </span>
        </DetailItem>
        {user.role === "FieldTeams" ? (
          <DetailItem label={t("admin.users.assignments")}>
            <span className="tabular-nums">{user.assignedWorkshopCount ?? 0}</span>
          </DetailItem>
        ) : null}
      </DetailList>

      <DialogSection title={t("admin.users.recentActivity")} className="border-t pt-5">
        {user.recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.users.noActivity")}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {user.recentActivity.map((item, index) => (
              <li
                key={`${item.occurredAtUtc}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <span>
                  <span className="font-semibold">{item.action}</span>
                  {" · "}
                  <span className="text-muted-foreground">{item.entity}</span>
                </span>
                <span className="text-xs tabular-nums text-muted-foreground" dir="ltr">
                  {formatDateTimeUtc(item.occurredAtUtc)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogSection>
    </>
  );
}
