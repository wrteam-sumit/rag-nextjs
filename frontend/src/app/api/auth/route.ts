import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "login-url") {
      const res = await fetch(`${config.API_BASE_URL}/api/auth/google/login`, {
        cache: "no-store",
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "me") {
      // forward cookies to backend
      const res = await fetch(`${config.API_BASE_URL}/api/auth/me`, {
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
        cache: "no-store",
      });
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return NextResponse.json(json, { status: res.status });
      } catch {
        return NextResponse.json({ error: text }, { status: res.status });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { action } = await req.json().catch(() => ({ action: "" }));
  try {
    if (action === "logout") {
      const res = await fetch(`${config.API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
      });
      const data = await res.json();
      const out = NextResponse.json(data, { status: res.status });
      // Clear cookie on frontend domain as well
      out.cookies.set({ name: "auth_token", value: "", maxAge: 0, path: "/" });
      return out;
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }
}
