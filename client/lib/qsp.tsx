import { ReadonlyURLSearchParams } from "next/navigation";

export type Qs = Record<string, string | number | undefined | null>;

export function toQuery(params: Qs) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  return `?${sp.toString()}`;
}

export function mergeQuery(
  current: ReadonlyURLSearchParams,
  updates: Record<string, string | undefined>
) {
  const params = new URLSearchParams(current.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });
  return `?${params.toString()}`;
}


export function getStr(sp: ReadonlyURLSearchParams, key: string, def = "") {
  const v = sp.get(key);
  return v ?? def;
}

export function getNum(sp: URLSearchParams, key: string) {
  const v = sp.get(key);
  if (!v) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}
