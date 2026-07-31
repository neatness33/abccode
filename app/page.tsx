"use client";

import Script from "next/script";
import { FormEvent, useState } from "react";

type Method = "m3u" | "xtream";
type ActionType = "activation" | "device_id";

type ApiResult = {
  status?: string;
  message?: string;
  activation_code?: string;
  device_id?: string;
};

declare global {
  interface Window {
    grecaptcha?: {
      getResponse: () => string;
      reset: () => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

export default function HomePage() {
  const [method, setMethod] = useState<Method>("m3u");
  const [actionType, setActionType] = useState<ActionType>("activation");
  const [m3u, setM3u] = useState("");
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setCopied(false);

    setLoading(true);
    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          action_type: actionType,
          m3u,
          server,
          username,
          password,
          device_id: deviceId,
        }),
      });

      const data: ApiResult = await res.json();
      if (!res.ok || data.status !== "success") {
        setError(data.message || "An unknown error occurred.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
      window.grecaptcha?.reset();
    }
  }

  async function copyCode() {
    const code = result?.activation_code || result?.device_id;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <Script src="https://www.google.com/recaptcha/api.js" async defer />
      <main className="page">
        <div className="atmosphere" aria-hidden>
          <div className="atmosphere__base" />
          <div className="atmosphere__grid" />
          <div className="atmosphere__orb atmosphere__orb--a" />
          <div className="atmosphere__orb atmosphere__orb--b" />
        </div>

        <div className="shell">
          <header className="brand">
            <div className="brand__mark" aria-hidden>
              <span>ABC</span>
            </div>
            <h1 className="brand__name">
              ABC <em>IPTV</em> Player
            </h1>
            <p className="brand__tag">
              Get an activation code or register your device — via M3U or Xtream Codes.
            </p>
          </header>

          <form className="panel" onSubmit={onSubmit}>
            <div className="field">
              <span className="field__label">Connection method</span>
              <div className="segment" role="group" aria-label="Connection method">
                <button
                  type="button"
                  className={`segment__btn${method === "m3u" ? " is-active" : ""}`}
                  onClick={() => setMethod("m3u")}
                >
                  M3U Link
                </button>
                <button
                  type="button"
                  className={`segment__btn${method === "xtream" ? " is-active" : ""}`}
                  onClick={() => setMethod("xtream")}
                >
                  Xtream Codes
                </button>
              </div>
            </div>

            {method === "m3u" ? (
              <div className="field">
                <label className="field__label" htmlFor="m3u">
                  M3U Link
                </label>
                <input
                  id="m3u"
                  className="input"
                  type="text"
                  value={m3u}
                  onChange={(e) => setM3u(e.target.value)}
                  placeholder="http://.../get.php?username=...&password=..."
                  autoComplete="off"
                />
              </div>
            ) : (
              <>
                <div className="field">
                  <label className="field__label" htmlFor="server">
                    Server URL
                  </label>
                  <input
                    id="server"
                    className="input"
                    type="text"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    placeholder="e.g. http://vamus.live:8080"
                    autoComplete="off"
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="username">
                    Username
                  </label>
                  <input
                    id="username"
                    className="input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    autoComplete="username"
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    className="input"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                  />
                </div>
              </>
            )}

            <div className="field">
              <label className="field__label" htmlFor="actionType">
                Action
              </label>
              <select
                id="actionType"
                className="select"
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ActionType)}
              >
                <option value="activation">Get activation code</option>
                <option value="device_id">Add Device ID</option>
              </select>
            </div>

            {actionType === "device_id" && (
              <div className="field">
                <label className="field__label" htmlFor="deviceId">
                  Device ID
                </label>
                <input
                  id="deviceId"
                  className="input"
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="e.g. 8dd078fda0843117"
                  autoComplete="off"
                />
              </div>
            )}

            <div className="field">
              <div className="recaptcha-wrap">
                {SITE_KEY ? (
                  <div className="g-recaptcha" data-sitekey={SITE_KEY} data-theme="dark" />
                ) : (
                  <p className="alert alert--error" style={{ margin: 0 }}>
                    reCAPTCHA site key missing.
                  </p>
                )}
              </div>
            </div>

            <button className="submit" type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit"}
            </button>
          </form>

          {error && <div className="alert alert--error">{error}</div>}

          {result?.status === "success" && (
            <div className="result">
              {result.activation_code && (
                <>
                  <div className="result__label">Your activation code</div>
                  <div className="result__code">{result.activation_code}</div>
                  <button type="button" className="copy-btn" onClick={copyCode}>
                    {copied ? "Copied" : "Copy"}
                  </button>
                </>
              )}
              {!result.activation_code && result.device_id && (
                <>
                  <div className="result__label">Device ID</div>
                  <div className="result__code">{result.device_id}</div>
                  <button type="button" className="copy-btn" onClick={copyCode}>
                    {copied ? "Copied" : "Copy"}
                  </button>
                </>
              )}
              {result.message && <div className="result__msg">{result.message}</div>}
            </div>
          )}

          <p className="foot">ABC IPTV Player Activation</p>
        </div>
      </main>
    </>
  );
}
