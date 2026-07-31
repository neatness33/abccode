import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "https://hemengmailal.com/apps/sbox_api.php";
const API_TOKEN = process.env.API_TOKEN || "";
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || "";

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

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET) return false;
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: RECAPTCHA_SECRET,
      response: token,
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.success);
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
      recaptcha_token,
    } = body;

    if (!recaptcha_token || !(await verifyRecaptcha(recaptcha_token))) {
      return NextResponse.json(
        { status: "error", message: "Lütfen reCAPTCHA doğrulamasını tamamlayın." },
        { status: 400 }
      );
    }

    if (!API_TOKEN) {
      return NextResponse.json(
        { status: "error", message: "API yapılandırması eksik." },
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
          { status: "error", message: "Geçersiz M3U linki!" },
          { status: 400 }
        );
      }
      server = parsed.server;
      username = parsed.username;
      password = parsed.password;
    } else {
      return NextResponse.json(
        { status: "error", message: "Geçersiz yöntem." },
        { status: 400 }
      );
    }

    if (!server || !username || !password) {
      return NextResponse.json(
        { status: "error", message: "Tüm alanları doldurun!" },
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
          { status: "error", message: "Device ID gerekli!" },
          { status: 400 }
        );
      }
      params.set("create_type", "device_id_xtream");
      params.set("device_id", deviceId);
    } else {
      return NextResponse.json(
        { status: "error", message: "Geçersiz işlem türü." },
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
        { status: "error", message: "API yanıtı işlenemedi." },
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
      { status: "error", message: "Beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}
