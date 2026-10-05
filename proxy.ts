/**
 * [sec] Per-route-group header rules. Next.js 16 renamed `middleware.ts` to `proxy.ts`.
 * SCAFFOLD: pass-through until M3-14.
 */
import { NextResponse } from "next/server";

export function proxy(): NextResponse {
  return NextResponse.next();
}
