"use client";

import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/shared/i18n";
import { AUDIT_ACTIONS, type AuditAction, type AuditFilters } from "../types";
import { useAuditTextFilters } from "../hooks/use-audit-text-filters";

export function AuditFiltersPanel({
  filters,
  onFiltersChange,
}: {
  filters: AuditFilters;
  onFiltersChange: (next: AuditFilters) => void;
}) {
  const t = useT();
  const { entityDraft, setEntityDraft, userDraft, setUserDraft } = useAuditTextFilters(
    filters,
    onFiltersChange
  );

  const clearFilters = useCallback(
    () => onFiltersChange({ page: 1 }),
    [onFiltersChange]
  );

  const hasFilters = Boolean(filters.entityName || filters.action || filters.username || filters.page > 1);

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex w-full flex-col gap-1.5 sm:w-44">
        <Label htmlFor="audit-entity">{t("admin.audit.entity")}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="audit-entity"
            value={entityDraft}
            placeholder={t("admin.audit.entityPlaceholder")}
            className="ps-8"
            onChange={(event) => setEntityDraft(event.target.value)}
          />
        </div>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-40">
        <Label>{t("admin.audit.action")}</Label>
        <Select
          value={filters.action ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              page: 1,
              action: value === "all" ? undefined : (value as AuditAction),
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.audit.allActions")}</SelectItem>
            {AUDIT_ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {t(`audit.${action}` as const)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-44">
        <Label htmlFor="audit-user">{t("admin.audit.user")}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="audit-user"
            value={userDraft}
            placeholder={t("admin.audit.userPlaceholder")}
            className="ps-8"
            onChange={(event) => setUserDraft(event.target.value)}
          />
        </div>
      </div>
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          className="text-[var(--secondary)] hover:text-[var(--secondary)]"
          onClick={clearFilters}
        >
          <X data-icon="inline-start" />
          {t("workshops.clearFilters")}
        </Button>
      ) : null}
    </section>
  );
}
