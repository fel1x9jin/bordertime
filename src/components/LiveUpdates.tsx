"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, m } from "motion/react";
import { BODY_LIMIT, MEDIA_ACCEPT, NICKNAME_LIMIT } from "@/lib/airportUpdates";
import { formatAgo } from "@/lib/format";
import type { AirportUpdate, PublishIssue, PublishResult } from "@/lib/useAirportUpdates";
import { useAirportFeed } from "@/lib/useAirportUpdates";
import { primaryButtonClass, secondaryButtonClass } from "./buttons";
import { EASE } from "./motion";

interface Props {
  airportCode: string;
  airportName: string;
}

const ISSUE_TEXT: Record<PublishIssue, string> = {
  empty: "请写一句话，或上传一张现场照片 / 短视频。",
  body: "文字需要在 1 到 280 字之间。",
  nickname: "昵称最多 30 个字。",
  type: "只支持 JPG、PNG、WEBP、HEIC 照片，或 MP4、MOV、WEBM 视频。",
  size: "文件超过 20 MB，请换一张更小的照片或更短的视频。",
  rejected: "内容不符合要求，请缩短文字，或换一张照片 / 视频。",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LiveUpdates({ airportCode, airportName }: Props) {
  const { now, updates, ready, readError, publish } = useAirportFeed(airportCode);
  const [body, setBody] = useState("");
  const [nickname, setNickname] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<PublishResult | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const bodyId = useId();
  const nickId = useId();
  const fileId = useId();
  const countId = useId();

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  useEffect(() => {
    if (status?.status !== "ok") return;
    const id = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(id);
  }, [status]);

  function replacePreview(next: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreviewUrl(next);
  }

  function chooseFile(next: File | null) {
    const showPreview =
      next !== null &&
      next.type.startsWith("image/") &&
      next.type !== "image/heic" &&
      next.type !== "image/heif";
    replacePreview(showPreview && next ? URL.createObjectURL(next) : null);
    setFile(next);
    setStatus(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus(null);
    const result = await publish({ body, nickname, file });
    setSubmitting(false);
    if (result.status === "ok") {
      setBody("");
      setNickname("");
      replacePreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
    setStatus(result);
  }

  const counterClass =
    body.length >= BODY_LIMIT ? "text-bad" : body.length >= 260 ? "text-warn" : "text-slate-500";

  return (
    <section aria-labelledby="live-updates-heading">
      <h2 id="live-updates-heading" className="text-xl font-semibold">
        现场动态
        <span className="ml-2 text-base font-normal text-slate-500">/ Live updates</span>
      </h2>
      <p className="mb-3 mt-1 text-sm leading-relaxed text-slate-600">
        拍下现在的队伍，或用一句话说说现场。不需要登录。
      </p>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/[0.04] sm:p-6"
      >
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={bodyId} className="text-sm font-medium">
            现在的情况
          </label>
          <span id={countId} className={`text-xs tabular-nums ${counterClass}`}>
            {body.length}/{BODY_LIMIT}
          </span>
        </div>
        <textarea
          id={bodyId}
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            setStatus(null);
          }}
          maxLength={BODY_LIMIT}
          rows={3}
          aria-describedby={countId}
          placeholder="例如：安检队伍很长，出境边检这边人不多"
          className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-line bg-mist px-4 py-3 text-base leading-relaxed placeholder:text-slate-400"
        />

        <div className="mt-4">
          <p id={fileId} className="text-sm font-medium">
            照片或短视频
          </p>
          <p className="mt-1 text-sm text-slate-600">一张即可，最大 20 MB。照片会在上传前适当压缩。</p>
          <input
            ref={fileRef}
            type="file"
            accept={MEDIA_ACCEPT}
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={submitting}
            aria-describedby={fileId}
            className={`${secondaryButtonClass} mt-2`}
          >
            {file ? "重新选择" : "选择照片或视频"}
          </button>
          {file && (
            <div className="mt-3 flex items-start gap-3 rounded-2xl bg-mist px-3 py-3">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                <button
                  type="button"
                  onClick={() => {
                    chooseFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="mt-1 text-sm text-slate-600 underline-offset-2 hover:underline"
                >
                  移除
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor={nickId} className="block text-sm font-medium">
            昵称（可选）
          </label>
          <input
            id={nickId}
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value);
              setStatus(null);
            }}
            maxLength={NICKNAME_LIMIT}
            autoComplete="off"
            placeholder="怎么称呼你"
            className="mt-2 w-full rounded-2xl border border-line bg-mist px-4 py-3 text-base placeholder:text-slate-400 sm:max-w-xs"
          />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          发布后所有人都能看到。请不要拍摄证件、登机牌或他人的清晰正脸。
        </p>

        <button type="submit" disabled={submitting} className={`${primaryButtonClass} mt-4`}>
          {submitting ? "发布中…" : "发布现场动态"}
        </button>

        <FormStatus status={status} />
      </form>

      <div className="mt-4">
        <Feed
          airportName={airportName}
          now={now}
          updates={updates}
          ready={ready}
          readError={readError}
          onOpenImage={setLightbox}
        />
      </div>

      <Lightbox image={lightbox} onClose={() => setLightbox(null)} />
    </section>
  );
}

function FormStatus({ status }: { status: PublishResult | null }) {
  if (!status || status.status === "ok") {
    return (
      <AnimatePresence initial={false}>
        {status?.status === "ok" && (
          <m.p
            key="ok"
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="mt-3 text-sm text-ok"
          >
            已发布，谢谢你的更新。
          </m.p>
        )}
      </AnimatePresence>
    );
  }

  const message =
    status.status === "invalid"
      ? ISSUE_TEXT[status.issue]
      : status.status === "rate_limited"
        ? "发布太频繁了：同一个网络 10 分钟内最多 5 条现场动态，请稍后再试。"
        : status.status === "unavailable"
          ? "现场动态暂时还不能发布。排队时间不受影响，请稍后再试。"
          : "发布失败，网络或服务器暂时有问题，请稍后再试。";

  return (
    <p role="alert" className="mt-3 text-sm leading-relaxed text-bad">
      {message}
    </p>
  );
}

function Feed({
  airportName,
  now,
  updates,
  ready,
  readError,
  onOpenImage,
}: {
  airportName: string;
  now: number | null;
  updates: AirportUpdate[];
  ready: boolean;
  readError: boolean;
  onOpenImage: (image: { url: string; alt: string }) => void;
}) {
  if (!ready || now === null) {
    return (
      <ul className="grid gap-3" aria-hidden="true">
        {[0, 1].map((item) => (
          <li key={item} className="rounded-2xl bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
            <div className="flex items-center gap-3">
              <span className="skeleton h-4 w-16 rounded-full" />
              <span className="skeleton h-4 w-20 rounded-full" />
            </div>
            <span className="skeleton mt-3 block h-4 w-3/4 rounded-full" />
          </li>
        ))}
      </ul>
    );
  }

  if (readError && updates.length === 0) {
    return (
      <p
        role="alert"
        className="rounded-2xl bg-white px-4 py-5 leading-relaxed text-bad shadow-card ring-1 ring-black/[0.04]"
      >
        暂时无法读取现场动态，请稍后刷新。
      </p>
    );
  }

  if (updates.length === 0) {
    return (
      <m.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: EASE }}
        className="rounded-2xl bg-white px-4 py-5 text-center leading-relaxed shadow-card ring-1 ring-black/[0.04]"
      >
        <span className="block font-medium text-ink">暂无现场动态</span>
        <span className="mt-1 block text-sm text-slate-600">路过的话，可以用上面的表单拍一张或写一句。</span>
      </m.p>
    );
  }

  return (
    <div>
      {readError && (
        <p role="alert" className="mb-3 text-sm text-bad">
          暂时无法刷新，下面还是上次读到的内容。
        </p>
      )}
      <ul className="grid gap-3">
        <AnimatePresence initial={false}>
          {updates.map((update, index) => (
            <UpdateCard
              key={update.id}
              update={update}
              airportName={airportName}
              now={now}
              index={index}
              onOpenImage={onOpenImage}
            />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function UpdateCard({
  update,
  airportName,
  now,
  index,
  onOpenImage,
}: {
  update: AirportUpdate;
  airportName: string;
  now: number;
  index: number;
  onOpenImage: (image: { url: string; alt: string }) => void;
}) {
  const nickname = update.nickname?.trim() || "旅客";
  const alt = update.body?.trim() || `${airportName}的现场照片`;

  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.26, delay: Math.min(index, 5) * 0.04, ease: EASE }}
      className="rounded-2xl bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-medium">{nickname}</span>
        <span className="text-slate-300" aria-hidden="true">
          ·
        </span>
        <span className="text-slate-500">{formatAgo(now, update.createdAt)}</span>
      </div>
      {update.body && (
        <p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{update.body}</p>
      )}
      {update.mediaUrl && update.mediaType === "image" && (
        <UpdateImage url={update.mediaUrl} alt={alt} onOpen={() => onOpenImage({ url: update.mediaUrl!, alt })} />
      )}
      {update.mediaUrl && update.mediaType === "video" && (
        <video
          src={update.mediaUrl}
          controls
          muted
          playsInline
          preload="metadata"
          className="mt-3 max-h-80 w-full rounded-2xl bg-board"
        />
      )}
    </m.li>
  );
}

function UpdateImage({ url, alt, onOpen }: { url: string; alt: string; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <p className="mt-3 text-sm text-slate-500">这张照片暂时无法在浏览器里预览。</p>;
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-3 block w-full overflow-hidden rounded-2xl"
    >
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="max-h-64 w-full object-cover"
      />
    </button>
  );
}

function Lightbox({
  image,
  onClose,
}: {
  image: { url: string; alt: string } | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !image || dialog.open) return;
    dialog.showModal();
  }, [image]);

  if (!image) return null;

  return (
    <dialog
      ref={dialogRef}
      className="media-lightbox"
      aria-label="查看大图"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <img src={image.url} alt={image.alt} className="max-h-[80vh] w-full rounded-2xl object-contain" />
        <button type="button" onClick={onClose} className={secondaryButtonClass}>
          关闭
        </button>
      </div>
    </dialog>
  );
}
