"use client";

import { CalendarClock, CalendarX2, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { governorateLabel } from "@/shared/constants/egypt";
import { useI18n, useT, type TranslationKey } from "@/shared/i18n";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { cn } from "@/shared/utils/cn";
import type {
  TrainerDashboardSummary,
  TrainerSessionBrief,
} from "../types";
import { KpiCard } from "./KpiCard";
import { formatTrainerGain, formatTrainerScore } from "../utils/trainer-format";

/** Navy shell shared by every header cell of the recent-sessions table. */
const TABLE_HEAD_CLASS = "h-10 bg-[var(--navy-shell)] text-xs text-white";

const RECENT_SESSIONS_LIMIT = 5;

/** Session status badge — text label always (never color alone). Unknown
 * statuses fall back to the raw backend string, still labeled. */
export function SessionStatusBadge({ status }: { status: string }) {
  const t = useT();

  const labelKeys: Record<string, TranslationKey> = {
    Completed: "trainings.statusCompleted",
    Upcoming: "trainings.statusUpcoming",
  };
  const label = labelKeys[status] ? t(labelKeys[status]) : status;
  const tone =
    status === "Completed"
      ? "border-transparent bg-[var(--success)]/15 text-[var(--success)]"
      : status === "Upcoming"
        ? "border-transparent bg-[var(--accent)] text-[var(--accent-foreground)]"
        : "border-transparent bg-muted text-muted-foreground";

  return (
    <Badge variant="secondary" className={cn(tone)}>
      {label}
    </Badge>
  );
}

function StatChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p
        className={cn(
          "text-xl font-bold leading-tight tabular-nums",
          highlight ? "text-[var(--success)]" : "text-[var(--navy)]"
        )}
        dir="ltr"
      >
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

/** TrainerViewer — his sessions, his participants, his score gains.
 * The trainer shape ignores the national dashboard filters by design. */
export function TrainerDashboard({ summary }: { summary: TrainerDashboardSummary }) {
  const t = useT();
  const { locale } = useI18n();

  const prePost =
    summary.avgPreScore === null && summary.avgPostScore === null
      ? "—"
      : `${formatTrainerScore(summary.avgPreScore)} → ${formatTrainerScore(summary.avgPostScore)}`;

  const recent = summary.recentSessions.slice(0, RECENT_SESSIONS_LIMIT);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <KpiCard labelKey="dashboard.trainingsTotal" value={summary.totalSessions} />
        <KpiCard labelKey="dashboard.trainingsCompleted" value={summary.completedSessions} />
        <KpiCard labelKey="dashboard.trainingsUpcoming" value={summary.upcomingSessions} />
        <KpiCard labelKey="dashboard.trainingsAttendees" value={summary.attendeesTrained} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xl font-bold leading-tight tabular-nums text-[var(--navy)]">
            {summary.governoratesCovered.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {t("dashboard.governoratesCovered")}
          </p>
        </div>
        <StatChip label={t("dashboard.avgPrePostScore")} value={prePost} />
        <StatChip
          label={t("dashboard.avgGain")}
          value={formatTrainerGain(summary.avgGain)}
          highlight={summary.avgGain !== null && summary.avgGain > 0}
        />
      </div>

      <section className="rounded-lg border bg-card p-4" aria-labelledby="next-session-heading">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="next-session-heading" className="text-sm font-semibold text-[var(--navy)]">
            {t("dashboard.trainerNextSession")}
          </h2>
        </div>
        {summary.nextSession ? (
          <div className="mt-3">
            <p className="text-base font-semibold text-[var(--navy)]">
              {summary.nextSession.title || summary.nextSession.venue}
            </p>
            <p className="mt-1 text-sm tabular-nums text-muted-foreground">
              {formatDateTimeUtc(summary.nextSession.startAtUtc)} UTC
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {governorateLabel(summary.nextSession.governorate, locale)} ·{" "}
              {summary.nextSession.venue}
            </p>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-md bg-muted/40 px-3 py-4">
            <CalendarX2 className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium">{t("dashboard.trainerNoUpcoming")}</p>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.trainerNoUpcomingHint")}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="recent-sessions-heading">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="recent-sessions-heading" className="text-sm font-semibold text-[var(--navy)]">
            {t("dashboard.trainerRecent")}
          </h2>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-lg border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            {t("dashboard.trainerRecentEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={TABLE_HEAD_CLASS}>
                    {t("trainings.sessionTitle")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>
                    {t("trainings.governorate")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("trainings.venue")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("trainings.startAt")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("trainings.status")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("trainings.attendees")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((row: TrainerSessionBrief) => (
                  <TableRow key={row.id} className="h-12">
                    <TableCell>
                      <span className="block truncate font-medium text-[var(--navy)]">
                        {row.title || row.venue}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {governorateLabel(row.governorate, locale)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.venue}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {formatDateTimeUtc(row.startAtUtc)}
                    </TableCell>
                    <TableCell>
                      <SessionStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">{row.attendeeCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
