import React from "react";
import SearchResults from "./SearchResults";
import CompanyProfile from "./CompanyProfile/CompanyProfile";
import styles from "./ResultsWithSidebar.module.css";

/**
 * Temporary debug version of ResultsWithSidebar.
 * - Renders a very visible test banner so you can confirm the wrapper is in the page.
 * - Passes a SAMPLE_COMPANY object to CompanyProfile so the profile is populated.
 * - Remove this test before merging to production (replace SAMPLE_COMPANY with null).
 */

const SAMPLE_COMPANY = {
  name: "ACME Corp (Preview)",
  logoUrl: "",
  rating: 4.3,
  industry: "Software",
  location: "Remote",
  employeeCount: "200",
  openPositions: 12,
  website: "https://acme.example",
  description: "This is a temporary preview company used to verify the CompanyProfile sidebar is rendering correctly.",
  linkedin: "https://linkedin.com",
  twitter: "https://twitter.com"
};

export default function ResultsWithSidebar(props) {
  // Put a console log so it shows up in DevTools if code executes
  // (helps detect if this module errors before rendering).
  // eslint-disable-next-line no-console
  console.log("[ResultsWithSidebar] rendering debug wrapper", { props });

  return (
    <div className={styles.resultsRoot} style={{ minHeight: "200px" }}>
      <main className={styles.resultsMain}>
        <SearchResults {...props} />
      </main>

      <aside
        className={styles.resultsSide}
        style={{
          borderLeft: "4px solid #e44",
          padding: 16,
          background: "#fff8f8",
          minHeight: 200,
        }}
      >
        {/* VERY VISIBLE DEBUG BANNER */}
        <div
          id="company-profile-debug-banner"
          style={{
            background: "#ffecec",
            color: "#900",
            fontWeight: 700,
            padding: "8px 12px",
            borderRadius: 6,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          DEBUG: CompanyProfile wrapper (temporary)
        </div>

        {/* Render populated sample company so the UI is obvious */}
        <CompanyProfile company={SAMPLE_COMPANY} />

        {/* Visible footer so you can find this exact element in the DOM */}
        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          Debug id: company-profile-debug-banner
        </div>
      </aside>
    </div>
  );
}
