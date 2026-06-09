export default function Loading() {
  return (
    <main id="main">
      <div className="container">
        <div
          className="system-page__loading"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="system-page__loading-text">
            ▼ Loading…
          </p>
        </div>
      </div>
    </main>
  );
}