"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ClipboardCheck, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/shared/components/layout/page-header";
import { GOVERNORATES, governorateLabel } from "@/shared/constants/egypt";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { useAuth, can } from "@/features/auth";
import { useRanking } from "../hooks/use-selection";
import { filterByGovernorate, nextSort, sortRanking, tierForRank, DEFAULT_SORT } from "../utils/ranking";
import type { RankedWorkshop } from "../types";
import type { RankingSortKey } from "../utils/ranking";
import { AwaitingScoringCard } from "./AwaitingScoringCard";
import { ScoreSheet } from "./ScoreSheet";
import { SelectionRunsCard } from "./SelectionRunsCard";
import { WeightsDialog } from "./WeightsDialog";

const SORTABLE_COLUMNS: { key: RankingSortKey; labelKey: "selection.rank" | "selection.workshop" | "selection.governorate" | "selection.score" }[] = [
  { key: "rank", labelKey: "selection.rank" },
  { key: "workshopName", labelKey: "selection.workshop" },
  { key: "governorate", labelKey: "selection.governorate" },
  { key: "totalWeighted", labelKey: "selection.score" },
];

function TierBadge({ rank }: { rank: number }) {
  const t = useT();
  const tier = tierForRank(rank);

  if (tier === "none") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        tier === "recommended"
          ? "bg-primary/15 text-primary"
          : "bg-[var(--accent)] text-[var(--accent-foreground)]"
      )}
    >
      {t(tier === "recommended" ? "selection.tier.recommended" : "selection.tier.reserve")}
    </span>
  );
}

function TierSummary({ rows }: { rows: RankedWorkshop[] }) {
  const t = useT();
  const recommended = rows.filter((row) => tierForRank(row.rank) === "recommended").length;
  const reserve = rows.filter((row) => tierForRank(row.rank) === "reserve").length;

  const chips = [
    {
      value: rows.length,
      label: t("selection.scoredCount", { count: rows.length }),
      className: "text-[var(--navy)]",
    },
    {
      value: recommended,
      label: t("selection.recommended"),
      className: "text-primary",
    },
    { value: reserve, label: t("selection.reserve"), className: "text-[var(--secondary)]" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {chips.map((chip) => (
        <div key={chip.label} className="rounded-lg border bg-card p-4">
          <p className={cn("text-2xl font-bold tabular-nums", chip.className)}>
            {chip.value.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{chip.label}</p>
        </div>
      ))}
    </div>
  );
}

export function SelectionPage() {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const canEditWeights = Boolean(user && can(user.permissions, "selection:score"));

  const [governorate, setGovernorate] = useState<string>("all");
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [scoreWorkshopId, setScoreWorkshopId] = useState<string | null>(null);
  const [scoreLabel, setScoreLabel] = useState<string | null>(null);

  const { data, isPending, isError, refetch } = useRanking();

  const visible = useMemo(() => {
    const rows = filterByGovernorate(data ?? [], governorate === "all" ? undefined : governorate);
    return sortRanking(rows, sort);
  }, [data, governorate, sort]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("selection.title")} description={t("selection.subtitle")}>
        {canEditWeights ? (
          <Button variant="outline" onClick={() => setWeightsOpen(true)}>
            <SlidersHorizontal data-icon="inline-start" />
            {t("selection.weights")}
          </Button>
        ) : null}
      </PageHeader>

      <TierSummary rows={data ?? []} />

      <AwaitingScoringCard
        onScore={(workshopId, label) => {
          setScoreLabel(label);
          setScoreWorkshopId(workshopId);
        }}
      />

      <SelectionRunsCard />

      <section
        className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between"
        aria-label={t("selection.governorate")}
      >
        <div className="flex w-full flex-col gap-1.5 sm:w-56">
          <Label>{t("selection.governorate")}</Label>
          <Select value={governorate} onValueChange={setGovernorate}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("selection.allGovernorates")}</SelectItem>
              {GOVERNORATES.map((option) => (
                <SelectItem key={option} value={option}>
                  {governorateLabel(option, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">{t("selection.recommendedHint", { count: 150 })}</p>
      </section>

      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          <p>{t("common.error")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-14 text-center">
          <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
          <p className="text-lg font-semibold text-[var(--navy)]">{t("selection.empty")}</p>
          <p className="max-w-[40ch] text-sm text-muted-foreground">{t("selection.emptyHint")}</p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {visible.map((row) => (
              <li key={row.workshopId}>
                <button
                  type="button"
                  onClick={() => setScoreWorkshopId(row.workshopId)}
                  className="flex w-full flex-col gap-2 rounded-lg border bg-card p-4 text-start transition-colors duration-150 hover:bg-[var(--row-selected)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {row.workshopCode}
                    </span>
                    <span className="text-lg font-bold tabular-nums text-primary">
                      {row.totalWeighted.toFixed(2)}
                    </span>
                  </div>
                  <p className="truncate font-semibold text-[var(--navy)]">{row.workshopName}</p>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>#{row.rank}</span>
                    <span>{governorateLabel(row.governorate, locale)}</span>
                    <TierBadge rank={row.rank} />
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {SORTABLE_COLUMNS.map((column) => (
                    <TableHead
                      key={column.key}
                      className="h-11 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white"
                      aria-sort={
                        sort.key === column.key
                          ? sort.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-white/80"
                        onClick={() => setSort((prev) => nextSort(prev, column.key))}
                      >
                        {t(column.labelKey)}
                        {sort.key === column.key ? (
                          sort.direction === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="h-11 w-28 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                    {t("selection.tier")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow
                    key={row.workshopId}
                    tabIndex={0}
                    className="h-12 cursor-pointer focus-visible:bg-[var(--row-selected)]"
                    onClick={() => setScoreWorkshopId(row.workshopId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setScoreWorkshopId(row.workshopId);
                      }
                    }}
                  >
                    <TableCell className="tabular-nums font-bold text-[var(--navy)]">
                      #{row.rank}
                    </TableCell>
                    <TableCell>
                      <span className="block truncate font-medium text-[var(--navy)]">
                        {row.workshopName}
                      </span>
                      <span className="block font-mono text-xs text-primary">
                        {row.workshopCode}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {governorateLabel(row.governorate, locale)}
                    </TableCell>
                    <TableCell className="tabular-nums text-base font-bold text-primary">
                      {row.totalWeighted.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <TierBadge rank={row.rank} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <WeightsDialog open={weightsOpen} onOpenChange={setWeightsOpen} />
      <ScoreSheet
        workshopId={scoreWorkshopId}
        workshopLabel={scoreLabel}
        onOpenChange={(open) => {
          if (!open) {
            setScoreWorkshopId(null);
            setScoreLabel(null);
          }
        }}
      />
    </div>
  );
}
