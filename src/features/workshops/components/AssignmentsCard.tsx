"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { racApi } from "@/shared/api/rac-api";
import { useT } from "@/shared/i18n";
import { useAssignmentMutations, useAssignments } from "../hooks/use-workshops";
import { formatDateUtc } from "../utils/format";
import type { Assignment } from "../types";

type AdminUser = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
};

/** FieldTeams picker — the users endpoint is admin:users-gated; 403 degrades gracefully. */
function useFieldTeamsUsers(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "users", "fieldteams"],
    queryFn: async () => {
      const { data } = await racApi.get<{ items: AdminUser[] }>("/admin/users", {
        params: { page: 1, pageSize: 100 },
      });
      return data.items.filter((user) => user.role === "FieldTeams" && user.isActive);
    },
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}

export function AssignmentsCard({
  workshopId,
  canAssign,
}: {
  workshopId: string;
  canAssign: boolean;
}) {
  const t = useT();
  const [pickerUserId, setPickerUserId] = useState<string>("");
  const [confirmTarget, setConfirmTarget] = useState<Assignment | null>(null);
  const { data: assignments, isPending } = useAssignments(workshopId, canAssign);
  const { assign, unassign } = useAssignmentMutations(workshopId);
  const { data: users, isError: usersForbidden } = useFieldTeamsUsers(canAssign);

  if (!canAssign) {
    return null;
  }

  return (
    <section className="rounded-lg border bg-card p-4 text-start">
      <h2 className="text-sm font-semibold text-[var(--navy)]">{t("assignments.title")}</h2>

      <div className="mt-3 flex flex-wrap items-end justify-start gap-2">
        <div className="flex min-w-52 flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="assignment-user">
            {t("assignments.pickUser")}
          </label>
          <Select value={pickerUserId} onValueChange={setPickerUserId}>
            <SelectTrigger id="assignment-user" disabled={usersForbidden} className="w-full">
              <SelectValue placeholder={t("assignments.pickUserPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {(users ?? []).map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.fullName} ({user.username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!pickerUserId || assign.isPending}
          onClick={() =>
            assign.mutate(pickerUserId, {
              onSuccess: () => {
                setPickerUserId("");
                toast.success(t("assignments.assigned"));
              },
              onError: (error) => {
                if ((error as { status?: number }).status === 409) {
                  toast.warning(t("assignments.alreadyActive"));
                } else if ((error as { status?: number }).status !== 403) {
                  toast.error(`${t("common.error")} — ${t("common.retry")}`);
                }
              },
            })
          }
        >
          {assign.isPending ? t("assignments.assigning") : t("assignments.assignAction")}
        </Button>
      </div>

      {usersForbidden ? (
        <p className="mt-2 text-xs text-muted-foreground">{t("assignments.usersForbidden")}</p>
      ) : null}

      {isPending ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : assignments && assignments.length > 0 ? (
        <ul className="mt-3 flex flex-col divide-y">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <span className="font-medium">{assignment.username}</span>
                <span className="ms-2 text-xs text-muted-foreground">
                  {assignment.endedAtUtc
                    ? t("assignments.endedOn", { date: formatDateUtc(assignment.endedAtUtc) })
                    : t("assignments.assignedOn", { date: formatDateUtc(assignment.assignedAtUtc) })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {assignment.endedAtUtc ? (
                  <Badge variant="secondary" className="border-transparent bg-muted text-muted-foreground">
                    {t("assignments.ended")}
                  </Badge>
                ) : (
                  <>
                    <Badge
                      variant="secondary"
                      className="border-transparent bg-[var(--success)]/15 text-[var(--success)]"
                    >
                      {t("assignments.active")}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={unassign.isPending}
                      onClick={() => setConfirmTarget(assignment)}
                    >
                      {t("assignments.unassign")}
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{t("assignments.empty")}</p>
      )}

      <Dialog open={confirmTarget !== null} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogTitle>
            {t("assignments.unassignConfirm", { user: confirmTarget?.username ?? "" })}
          </DialogTitle>
          <DialogDescription className="sr-only">{t("assignments.unassign")}</DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmTarget(null)}>
              {t("profile.cancel")}
            </Button>
            <Button
              type="button"
              disabled={unassign.isPending}
              onClick={() => {
                if (confirmTarget) {
                  unassign.mutate(confirmTarget.id, {
                    onSuccess: () => {
                      setConfirmTarget(null);
                      toast.success(t("assignments.unassigned"));
                    },
                    onError: (error) => {
                      if ((error as { status?: number }).status !== 403) {
                        toast.error(`${t("common.error")} — ${t("common.retry")}`);
                      }
                    },
                  });
                }
              }}
            >
              {t("assignments.unassign")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
