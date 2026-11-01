export const BODY_LIMIT = 280;
export const NICKNAME_LIMIT = 30;
export const MEDIA_BYTES_LIMIT = 20 * 1024 * 1024;
export const FEED_WINDOW_MS = 24 * 60 * 60 * 1000;
export const ACTIVITY_WINDOW_MS = 3 * 60 * 60 * 1000;
export const FEED_LIMIT = 20;
export const MEDIA_BUCKET = "airport-media";

export const MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.webm";

const IMAGE_EXT = new Set(["jpg", "png", "webp", "heic"]);
const VIDEO_EXT = new Set(["mp4", "mov", "webm"]);

const MIME_TO_FILE: Record<string, { kind: "image" | "video"; ext: string; mime: string }> = {
  "image/jpeg": { kind: "image", ext: "jpg", mime: "image/jpeg" },
  "image/png": { kind: "image", ext: "png", mime: "image/png" },
  "image/webp": { kind: "image", ext: "webp", mime: "image/webp" },
  "image/heic": { kind: "image", ext: "heic", mime: "image/heic" },
  "image/heif": { kind: "image", ext: "heic", mime: "image/heic" },
  "video/mp4": { kind: "video", ext: "mp4", mime: "video/mp4" },
  "video/quicktime": { kind: "video", ext: "mov", mime: "video/quicktime" },
  "video/webm": { kind: "video", ext: "webm", mime: "video/webm" },
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heic",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

/** 与迁移里的 media_path 检查一致，避免把任意字符串当成公开地址渲染。 */
const MEDIA_PATH_RE =
  /^[A-Z]{3}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|heic|mp4|mov|webm)$/;

export type MediaKind = "image" | "video";

export type TextIssue = "empty" | "body" | "nickname";
export type MediaIssue = "type" | "size";

export interface PreparedMedia {
  file: File;
  kind: MediaKind;
  ext: string;
  mime: string;
}

export function normalizeText(
  body: string,
  nickname: string,
): { body: string | null; nickname: string | null } | { issue: TextIssue } {
  const trimmedBody = body.trim();
  const trimmedNick = nickname.trim();
  if ([...trimmedBody].length > BODY_LIMIT || trimmedBody.length > BODY_LIMIT) {
    return { issue: "body" };
  }
  if ([...trimmedNick].length > NICKNAME_LIMIT || trimmedNick.length > NICKNAME_LIMIT) {
    return { issue: "nickname" };
  }
  return {
    body: trimmedBody.length > 0 ? trimmedBody : null,
    nickname: trimmedNick.length > 0 ? trimmedNick : null,
  };
}

export function resolveMedia(file: File): { kind: MediaKind; ext: string; mime: string } | null {
  if (file.size <= 0) return null;
  const fromType = file.type ? MIME_TO_FILE[file.type] : undefined;
  if (fromType) return fromType;
  if (file.type && file.type !== "application/octet-stream") return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = EXT_TO_MIME[ext];
  if (!mime) return null;
  return MIME_TO_FILE[mime] ?? null;
}

export function newMediaId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function mediaPathFor(airportId: string, id: string, ext: string): string {
  return `${airportId}/${id}.${ext}`;
}

export function isSafeMediaPath(path: string, kind: MediaKind | null): boolean {
  if (!MEDIA_PATH_RE.test(path)) return false;
  const ext = path.split(".").pop() ?? "";
  if (kind === "image") return IMAGE_EXT.has(ext);
  if (kind === "video") return VIDEO_EXT.has(ext);
  return IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext);
}

export function isMissingTable(error: unknown): boolean {
  const text = errorText(error);
  return (
    text.includes("pgrst205") ||
    text.includes("42p01") ||
    text.includes("schema cache") ||
    text.includes("could not find the table") ||
    text.includes("does not exist")
  );
}

export function isMissingBucket(error: unknown): boolean {
  const text = errorText(error);
  return text.includes("bucket not found");
}

export function isRateLimited(error: unknown): boolean {
  return errorText(error).includes("rate_limited");
}

export function isCheckViolation(error: unknown): boolean {
  const text = errorText(error);
  return text.includes("23514") || text.includes("check constraint");
}

function errorText(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const value = error as { message?: string; code?: string; statusCode?: string | number };
  return `${value.code ?? ""} ${value.statusCode ?? ""} ${value.message ?? ""}`.toLowerCase();
}

const MAX_EDGE = 1920;
const COMPRESS_QUALITY = 0.82;

/**
 * 浏览器能解码的图片先缩小到最长边 1920，再压成 webp（不行就 jpeg）。
 * HEIC 留给原文件；失败时退回原文件，由大小检查决定能不能传。
 */
export async function prepareMedia(file: File): Promise<PreparedMedia | { issue: MediaIssue }> {
  const resolved = resolveMedia(file);
  if (!resolved) return { issue: "type" };

  if (file.size > MEDIA_BYTES_LIMIT * 2) return { issue: "size" };

  if (resolved.kind === "video" || resolved.mime === "image/heic") {
    if (file.size > MEDIA_BYTES_LIMIT) return { issue: "size" };
    return withType(file, resolved);
  }

  const compressed = await compressImage(file);
  const next = compressed ?? { file, mime: resolved.mime, ext: resolved.ext };
  if (next.file.size > MEDIA_BYTES_LIMIT) return { issue: "size" };
  return withType(next.file, { kind: "image", mime: next.mime, ext: next.ext });
}

function withType(
  file: File,
  resolved: { kind: MediaKind; ext: string; mime: string },
): PreparedMedia {
  if (file.type === resolved.mime) {
    return { file, kind: resolved.kind, ext: resolved.ext, mime: resolved.mime };
  }
  return {
    file: new File([file], `upload.${resolved.ext}`, {
      type: resolved.mime,
      lastModified: file.lastModified,
    }),
    kind: resolved.kind,
    ext: resolved.ext,
    mime: resolved.mime,
  };
}

async function compressImage(
  file: File,
): Promise<{ file: File; mime: string; ext: string } | null> {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    if (!longest) {
      bitmap.close();
      return null;
    }
    const scale = Math.min(1, MAX_EDGE / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const webp = await canvasBlob(canvas, "image/webp", COMPRESS_QUALITY);
    const blob = webp ?? (await canvasBlob(canvas, "image/jpeg", COMPRESS_QUALITY));
    if (!blob) return null;
    const mime = webp ? "image/webp" : "image/jpeg";
    const ext = webp ? "webp" : "jpg";
    if (blob.size >= file.size && scale === 1 && file.size <= MEDIA_BYTES_LIMIT) return null;
    if (blob.size >= file.size && file.size <= MEDIA_BYTES_LIMIT) return null;
    return {
      file: new File([blob], `photo.${ext}`, { type: mime, lastModified: Date.now() }),
      mime,
      ext,
    };
  } catch {
    return null;
  }
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}
