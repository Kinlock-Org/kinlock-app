/**
 * Every user-visible string lives in messages/<locale>.json (M3-23). English only for now;
 * adding a language means adding a file. i18n library choice pending (DEC-22).
 */
import en from "@/messages/en.json";

type Messages = typeof en;

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

export function t(key: MessageKey): string {
  let node: unknown = en;
  for (const part of key.split(".")) {
    node = (node as Record<string, unknown>)[part];
  }
  return node as string;
}

/** True if `key` names a string in the message file (for keys that arrive at runtime). */
export function hasMessage(key: string): boolean {
  let node: unknown = en;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object") return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string";
}
