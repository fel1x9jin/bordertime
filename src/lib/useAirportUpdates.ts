"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ACTIVITY_WINDOW_MS,
  FEED_LIMIT,
  FEED_WINDOW_MS,
  MEDIA_BUCKET,
  isCheckViolation,
  isMissingBucket,
  isMissingTable,
  isRateLimited,
  isSafeMediaPath,
  mediaPathFor,
  newMediaId,
  normalizeText,
  prepareMedia,
  type MediaKind,
} from "./airportUpdates";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface AirportUpdate {
  id: string;
  airportId: string;
  body: string | null;
  mediaPath: string | null;
  mediaType: MediaKind | null;
  mediaUrl: string | null;
  nickname: string | null;
  createdAt: number;
}

export type PublishIssue = "empty" | "body" | "nickname" | "type" | "size" | "rejected";

export type PublishResult =
  | { status: "ok" }
  | { status: "invalid"; issue: PublishIssue }
  | { status: "rate_limited" }
  | { status: "unavailable" }
  | { status: "error" };

interface UpdateRow {
  id: string;
  airport_id: string;
  body: string | null;
  media_path: string | null;
  media_type: string | null;
  nickname: string | null;
  created_at: string;
}

const REFRESH_MS = 60_000;

function mediaUrl(path: string | null, kind: MediaKind | null): string | null {
  if (!path || !isSafeMediaPath(path, kind)) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl || null;
}

function rowToUpdate(row: UpdateRow): AirportUpdate | null {
  const createdAt = Date.parse(row.created_at);
  if (!row.id || !row.airport_id || Number.isNaN(createdAt)) return null;
  const mediaType = row.media_type === "image" || row.media_type === "video" ? row.media_type : null;
  const mediaPath = row.media_path && isSafeMediaPath(row.media_path, mediaType) ? row.media_path : null;
  return {
    id: row.id,
    airportId: row.airport_id,
    body: row.body,
    mediaPath,
    mediaType: mediaPath ? mediaType : null,
    mediaUrl: mediaUrl(mediaPath, mediaType),
    nickname: row.nickname,
    createdAt,
  };
}

async function fetchFeed(airportId: string): Promise<
  { ok: true; updates: AirportUpdate[] } | { ok: false; missing: boolean }
> {
  const supabase = getSupabase();
  if (!supabase) return { ok: true, updates: [] };
  const since = new Date(Date.now() - FEED_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from("airport_updates")
    .select("id, airport_id, body, media_path, media_type, nickname, created_at")
    .eq("airport_id", airportId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (error) return { ok: false, missing: isMissingTable(error) };
  const updates = ((data ?? []) as UpdateRow[])
    .map(rowToUpdate)
    .filter((item): item is AirportUpdate => item !== null);
  return { ok: true, updates };
}

export function useAirportFeed(airportId: string) {
  const [now, setNow] = useState<number | null>(null);
  const [updates, setUpdates] = useState<AirportUpdate[]>([]);
  const [ready, setReady] = useState(false);
  const [readError, setReadError] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchFeed(airportId);
    if (!result.ok) {
      if (result.missing) {
        setUpdates([]);
        setReadError(false);
      } else {
        setReadError(true);
      }
      setReady(true);
      return;
    }
    setUpdates(result.updates);
    setReadError(false);
    setReady(true);
  }, [airportId]);

  useEffect(() => {
    setNow(Date.now());
    const clock = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setReadError(false);

    async function run() {
      const result = await fetchFeed(airportId);
      if (cancelled) return;
      if (!result.ok) {
        if (result.missing) {
          setUpdates([]);
          setReadError(false);
        } else {
          setReadError(true);
        }
      } else {
        setUpdates(result.updates);
        setReadError(false);
      }
      setReady(true);
    }

    void run();
    if (!isSupabaseConfigured) {
      return () => {
        cancelled = true;
      };
    }

    const id = setInterval(() => void run(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [airportId]);

  const publish = useCallback(
    async (input: { body: string; nickname: string; file: File | null }): Promise<PublishResult> => {
      const text = normalizeText(input.body, input.nickname);
      if ("issue" in text) return { status: "invalid", issue: text.issue };

      let media: { path: string; kind: MediaKind } | null = null;
      if (input.file) {
        const prepared = await prepareMedia(input.file);
        if ("issue" in prepared) return { status: "invalid", issue: prepared.issue };
        const id = newMediaId();
        const path = mediaPathFor(airportId, id, prepared.ext);
        if (!isSafeMediaPath(path, prepared.kind)) return { status: "invalid", issue: "type" };
        media = { path, kind: prepared.kind };

        const supabase = getSupabase();
        if (!supabase) return { status: "unavailable" };
        const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, prepared.file, {
          contentType: prepared.mime,
          upsert: false,
          cacheControl: "3600",
        });
        if (error) {
          return { status: isMissingBucket(error) ? "unavailable" : "error" };
        }
      }

      if (!text.body && !media) return { status: "invalid", issue: "empty" };

      const supabase = getSupabase();
      if (!supabase) return { status: "unavailable" };

      const { error } = await supabase.from("airport_updates").insert({
        airport_id: airportId,
        body: text.body,
        media_path: media?.path ?? null,
        media_type: media?.kind ?? null,
        nickname: text.nickname,
      });

      if (error) {
        if (isRateLimited(error)) return { status: "rate_limited" };
        if (isMissingTable(error)) return { status: "unavailable" };
        if (isCheckViolation(error)) return { status: "invalid", issue: "rejected" };
        return { status: "error" };
      }

      await load();
      return { status: "ok" };
    },
    [airportId, load],
  );

  return { now, updates, ready, readError, publish };
}

/** 所有机场近 3 小时的动态条数，一次查询。表还不存在时返回空对象。 */
export function useAirportActivity(): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    async function run() {
      const supabase = getSupabase();
      if (!supabase) return;
      const since = new Date(Date.now() - ACTIVITY_WINDOW_MS).toISOString();
      const { data, error } = await supabase
        .from("airport_updates")
        .select("airport_id, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (cancelled) return;
      if (error) {
        if (isMissingTable(error)) setCounts({});
        return;
      }

      const next: Record<string, number> = {};
      for (const row of (data ?? []) as { airport_id?: string }[]) {
        if (!row.airport_id) continue;
        next[row.airport_id] = (next[row.airport_id] ?? 0) + 1;
      }
      setCounts(next);
    }

    void run();
    const id = setInterval(() => void run(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return counts;
}
