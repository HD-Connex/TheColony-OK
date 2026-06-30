"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/auth-client";
import type { Program, ScheduleEntry, PlayerConfig } from "@/lib/mux-247/types";

/**
 * ScheduleManager — Admin UI for managing the 24/7 program schedule.
 *
 * Features:
 * - List all programs and schedule entries
 * - Add/remove/reorder schedule entries
 * - Bump a program to play now (break in)
 * - Edit program metadata
 * - Toggle schedule loop
 */
export default function ScheduleManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [schedule, setSchedule] = useState<(ScheduleEntry & { program: Program | null })[]>([]);
  const [config, setConfig] = useState<PlayerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = supabaseBrowser();
      const [progRes, schedRes, cfgRes] = await Promise.all([
        sb.from("programs").select("*").order("title"),
        sb.from("schedules")
          .select("*, program:programs(*)")
          .order("position"),
        sb.from("player_configs").select("*").limit(1).maybeSingle(),
      ]);

      if (progRes.error) throw progRes.error;
      if (schedRes.error) throw schedRes.error;

      setPrograms(progRes.data as Program[]);
      setSchedule(schedRes.data as (ScheduleEntry & { program: Program | null })[]);
      setConfig(cfgRes.data as PlayerConfig | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const addToSchedule = useCallback(async (programId: string) => {
    const maxPos = schedule.length > 0 ? Math.max(...schedule.map((s) => s.position)) : 0;
    const sb = supabaseBrowser();
    const { error } = await sb.from("schedules").insert({
      program_id: programId,
      position: maxPos + 1,
      is_active: true,
    });
    if (!error) fetchData();
  }, [schedule, fetchData]);

  const removeFromSchedule = useCallback(async (scheduleId: string) => {
    const sb = supabaseBrowser();
    const { error } = await sb.from("schedules").delete().eq("id", scheduleId);
    if (!error) fetchData();
  }, [fetchData]);

  const bumpProgram = useCallback(async (programId: string) => {
    const sb = supabaseBrowser();
    const { error } = await sb.rpc("bump_program", { target_program_id: programId });
    if (!error) fetchData();
  }, [fetchData]);

  const reorder = useCallback(async (scheduleId: string, newPosition: number) => {
    const sb = supabaseBrowser();
    const { error } = await sb.from("schedules").update({ position: newPosition }).eq("id", scheduleId);
    if (!error) fetchData();
  }, [fetchData]);

  const toggleLoop = useCallback(async () => {
    if (!config) return;
    const sb = supabaseBrowser();
    const { error } = await sb.from("player_configs").update({ loop_schedule: !config.loop_schedule }).eq("id", config.id);
    if (!error) fetchData();
  }, [config, fetchData]);

  const programsNotInSchedule = programs.filter(
    (p) => !schedule.some((s) => s.program_id === p.id),
  );

  if (loading) return <div className="admin-card">Loading schedule...</div>;
  if (error) return <div className="admin-card admin-card--error">{error}</div>;

  return (
    <div className="admin-card">
      <h2>24/7 Schedule Manager</h2>

      {/* Player config */}
      <details className="admin-details">
        <summary>Player Config</summary>
        <div className="admin-row">
          <label>Channel Title</label>
          <span>{config?.channel_title ?? "The Colony 24/7"}</span>
        </div>
        <div className="admin-row">
          <label>Loop Schedule</label>
          <button type="button" className="btn btn--sm" onClick={toggleLoop}>
            {config?.loop_schedule ? "ON" : "OFF"}
          </button>
        </div>
        <div className="admin-row">
          <label>Global Fallback Playback ID</label>
          <code>{config?.global_fallback_playback_id ?? "—"}</code>
        </div>
      </details>

      {/* Current schedule */}
      <h3>Schedule ({schedule.length} programs)</h3>
      <div className="admin-list">
        {schedule.map((entry, idx) => (
          <div key={entry.id} className="admin-list-item">
            <span className="admin-list-item__pos">{entry.position}</span>
            <div className="admin-list-item__info">
              <strong>{entry.program?.title ?? "Unknown"}</strong>
              {entry.program?.description && (
                <span className="text-muted">{entry.program.description.slice(0, 80)}</span>
              )}
            </div>
            <div className="admin-list-item__actions">
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => bumpProgram(entry.program_id)}
                title="Play now (break in)"
              >
                ▶ BUMP
              </button>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => reorder(entry.id, Math.max(1, entry.position - 1))}
                disabled={idx === 0}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => reorder(entry.id, entry.position + 1)}
                disabled={idx === schedule.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                className="btn btn--sm btn--danger"
                onClick={() => removeFromSchedule(entry.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add programs to schedule */}
      {programsNotInSchedule.length > 0 && (
        <>
          <h3>Add Program</h3>
          <select
            className="admin-select"
            onChange={(e) => e.target.value && addToSchedule(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Select a program...</option>
            {programsNotInSchedule.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.playback_id.slice(0, 12)}...)
              </option>
            ))}
          </select>
        </>
      )}

      <div className="admin-actions">
        <button type="button" className="btn btn--outline" onClick={fetchData}>
          Refresh
        </button>
      </div>
    </div>
  );
}
