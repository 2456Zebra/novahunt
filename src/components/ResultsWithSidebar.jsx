import React from "react";
import SearchResults from "../../components/SearchResults";
import CompanyProfile from "./CompanyProfile/CompanyProfile";
import styles from "./ResultsWithSidebar.module.css";

export default function ResultsWithSidebar(props) {
  return (
    <div className={styles.resultsRoot}>
      <div className={styles.resultsMain}>
        <SearchResults {...props} />
      </div>
      <div className={styles.resultsSide}>
        <CompanyProfile company={null} />
      </div>
    </div>
  );
}
