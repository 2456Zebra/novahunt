import React from "react";
import SearchResults from "./SearchResults";
import CompanyProfile from "./CompanyProfile/CompanyProfile";
import ErrorBoundary from "./ErrorBoundary";
import styles from "./ResultsWithSidebar.module.css";

/**
 * ResultsWithSidebar - wrapper that places SearchResults in the main column
 * and shows CompanyProfile as a right-hand sticky sidebar.
 *
 * This version wraps SearchResults in an ErrorBoundary to prevent a client-side
 * exception in SearchResults from crashing the entire page. The fallback UI
 * instructs you to copy the console error so I can diagnose the root cause.
 *
 * NOTE: This is a temporary safety patch. Once we capture and fix the underlying
 * exception, we can remove the fallback and restore normal behavior.
 */

const Fallback = ({ error }) => (
  <div style={{ padding: 16, border: "1px solid #f5c6cb", background: "#fff4f6", color: "#721c24", borderRadius: 6 }}>
    <strong>Unable to render search results.</strong>
    <div style={{ marginTop: 8 }}>
      A client-side error occurred while rendering results. Open DevTools → Console and copy the first error + stack trace, then paste it into the chat so I can fix it.
    </div>
    <details style={{ marginTop: 8 }}>
      <summary style={{ cursor: "pointer" }}>Show error (dev only)</summary>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{String(error)}</pre>
    </details>
  </div>
);

export default function ResultsWithSidebar(props) {
  return (
    <div className={styles.resultsRoot}>
      <main className={styles.resultsMain}>
        <ErrorBoundary FallbackComponent={Fallback} onError={(err) => {
          // Log a clear message and full stack so it's easy to copy from the browser console
          // eslint-disable-next-line no-console
          console.error("[ResultsWithSidebar] caught error rendering SearchResults:", err);
        }}>
          <SearchResults {...props} />
        </ErrorBoundary>
      </main>

      <aside className={styles.resultsSide}>
        <CompanyProfile company={null} />
      </aside>
    </div>
  );
}
