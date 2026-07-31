import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "https://hemengmailal.com/apps/sbox_api.php";
const API_TOKEN = process.env.API_TOKEN || "";

function parseM3U(m3uLink: string) {
  const match = m3uLink.match(
    /(http[s]?:\/\/[^\/]+)(?:\:\d+)?\/get\.php\?username=([^&]+)&password=([^&]+)/
  );
  if (!match) return null;
  return {
    server: match[1],
    username: match[2],
    password: match[3],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      method,
      action_type,
      m3u,
      server: serverInput,
      username: usernameInput,
      password: passwordInput,
      device_id,
    } = body;

    if (!API_TOKEN) {
      return NextResponse.json(
        { status: "error", message: "API configuration is missing." },
        { status: 500 }
      );
    }

    let server = "";
    let username = "";
    let password = "";

    if (method === "xtream") {
      server = String(serverInput || "").trim();
      username = String(usernameInput || "").trim();
      password = String(passwordInput || "").trim();
    } else if (method === "m3u") {
      const parsed = parseM3U(String(m3u || "").trim());
      if (!parsed) {
        return NextResponse.json(
          { status: "error", message: "Invalid M3U link!" },
          { status: 400 }
        );
      }
      server = parsed.server;
      username = parsed.username;
      password = parsed.password;
    } else {
      return NextResponse.json(
        { status: "error", message: "Invalid method." },
        { status: 400 }
      );
    }

    if (!server || !username || !password) {
      return NextResponse.json(
        { status: "error", message: "Please fill in all fields!" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      token: API_TOKEN,
      action: "create",
      username,
      password,
      dns: server,
    });

    if (action_type === "activation") {
      params.set("create_type", "activation_xtream");
    } else if (action_type === "device_id") {
      const deviceId = String(device_id || "").trim();
      if (!deviceId) {
        return NextResponse.json(
          { status: "error", message: "Device ID is required!" },
          { status: 400 }
        );
      }
      params.set("create_type", "device_id_xtream");
      params.set("device_id", deviceId);
    } else {
      return NextResponse.json(
        { status: "error", message: "Invalid action type." },
        { status: 400 }
      );
    }

    const dataUrl = `${API_URL}?${params.toString()}`;
    const apiRes = await fetch(dataUrl, {
      method: "POST",
      signal: AbortSignal.timeout(30000),
    });

    const text = await apiRes.text();
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { status: "error", message: "Failed to process API response." },
        { status: 502 }
      );
    }

    if (
      action_type === "device_id" &&
      result.message === "Created successfully."
    ) {
      result.message = "Successfully Added.";
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { status: "error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
