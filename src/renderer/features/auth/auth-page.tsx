import React, { useState } from "react";

interface Props {
  onAuthenticated: () => void;
}

export function AuthPage({ onAuthenticated }: Props) {
  const [showPaste, setShowPaste] = useState(false);
  const [cookies, setCookies] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBrowserLogin = async () => {
    setLoading(true);
    setError(null);
    const result = await window.api.auth.browserLogin();
    setLoading(false);
    if (result.success) {
      onAuthenticated();
    } else {
      setError(result.error || "Login failed.");
    }
  };

  const handlePasteImport = async () => {
    if (!cookies.trim()) {
      setError("Please paste your cookies.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await window.api.auth.import(cookies.trim());
    setLoading(false);
    if (result.success) {
      onAuthenticated();
    } else {
      setError(result.error || "Authentication failed.");
    }
  };

  return (
    <div className="auth-page">
      <h1>YTM2Local</h1>
      <p>
        Sign in to your Google account to access your YouTube Music liked songs.
      </p>

      <button
        className="btn btn-primary"
        onClick={handleBrowserLogin}
        disabled={loading}
        style={{ fontSize: 16, padding: "12px 24px" }}
      >
        {loading ? "Waiting for sign-in..." : "Sign in with Google"}
      </button>

      {!showPaste && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowPaste(true)}
          style={{ marginTop: 8 }}
        >
          Or paste cookies manually
        </button>
      )}

      {showPaste && (
        <>
          <textarea
            className="auth-textarea"
            placeholder="Paste Netscape cookies.txt or header format cookies..."
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            disabled={loading}
          />
          <button
            className="btn btn-secondary"
            onClick={handlePasteImport}
            disabled={loading}
          >
            Import Cookies
          </button>
        </>
      )}

      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}
