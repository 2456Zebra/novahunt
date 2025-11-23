import React from "react";
import SearchResults from "./SearchResults";
import CompanyProfile from "./CompanyProfile/CompanyProfile";
import styles from "./ResultsWithSidebar.module.css";

/**
 * ResultsWithSidebar - wrapper that places SearchResults in the main column
 * and shows CompanyProfile as a right-hand sticky sidebar (company={null}).
 */
export default function ResultsWithSidebar(props) {
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
