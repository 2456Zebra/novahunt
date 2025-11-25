import React from "react";
import SearchResults from "../../components/SearchResults";
import CompanyProfile from "./CompanyProfile/CompanyProfile";
import styles from "./ResultsWithSidebar.module.css";

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
