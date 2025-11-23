import React from "react";
import dynamic from "next/dynamic";

// Import the existing SearchResults component. Adjust this path if your project uses relative imports.
import SearchResults from "./SearchResults"; // or "../components/SearchResults" depending on location
import CompanyProfile from "./CompanyProfile/CompanyProfile";
import styles from "./ResultsWithSidebar.module.css";

/**
 * ResultsWithSidebar - non-invasive wrapper that places SearchResults in the main column
 * and shows CompanyProfile as a right-hand sticky sidebar. CompanyProfile receives null by default.
 */
export default function ResultsWithSidebar(props) {
  // If SearchResults requires props, pass them through: <SearchResults {...props} />
  return (
    <div className={styles.resultsRoot}>
      <main className={styles.resultsMain}>
        <SearchResults {...props} />
      </main>

      <aside className={styles.resultsSide}>
        <CompanyProfile company={null} />
      </aside>
    </div>
  );
}
