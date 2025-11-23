import React from 'react';
import SearchResults from '../../components/SearchResults';
import CompanyProfile from './CompanyProfile/CompanyProfile';
import styles from './ResultsWithSidebar.module.css';

/**
 * ResultsWithSidebar - Wrapper component that displays search results with a company profile sidebar
 * Props:
 *  - results (array) - Search results to display
 *  - All other props are passed through to SearchResults
 * 
 * This is a non-invasive wrapper that:
 * - Renders the existing SearchResults component in the main column
 * - Renders CompanyProfile with company={null} in the right sidebar
 * - Uses a responsive grid layout
 * 
 * The sidebar is displayed with company={null} so it shows the placeholder state,
 * allowing the page to compile and the sidebar to be tested without requiring
 * changes to the core SearchResults component.
 */
export default function ResultsWithSidebar({ results, ...restProps }) {
  return (
    <div className={styles.container}>
      <div className={styles.mainColumn}>
        <SearchResults results={results} {...restProps} />
      </div>
      <div className={styles.sidebarColumn}>
        <CompanyProfile company={null} />
      </div>
    </div>
  );
}
