export default function Loading() {
  return (
    <main id="main">
      <div className="container">
        <div
          style={{
            padding: "var(--space-24) 0",
            minHeight: "40vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-live="polite"
          aria-busy="true"
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              letterSpacing: "var(--track-wider)",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
            }}
          >
            ▼ Loading…
          </p>
        </div>
      </div>
    </main>
  );
}