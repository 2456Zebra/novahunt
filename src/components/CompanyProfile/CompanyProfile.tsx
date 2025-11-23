.cp-root {
  width: 300px;
  box-sizing: border-box;
  padding: 16px;
  border-left: 1px solid var(--border-color, #e6e6e6);
  background: var(--sidebar-bg, #fff);
  position: sticky;
  top: 16px;
  align-self: start;
  font-family: inherit;
  color: var(--text-color, #111);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cp-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cp-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #f0f0f0;
}

.cp-logo-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  background: linear-gradient(90deg,#f6f6f6,#ededed);
}

.cp-title h3 {
  margin: 0;
  font-size: 16px;
}

.cp-rating .star {
  color: #ccc;
  margin-left: 2px;
}

.cp-rating .star.filled {
  color: #f5a623;
}

.cp-close {
  margin-left: auto;
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--muted, #666);
}

.cp-body {
  font-size: 14px;
  color: var(--muted, #333);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cp-row strong {
  margin-right: 6px;
}

.cp-description {
  margin-top: 6px;
  color: var(--text-color, #222);
  font-size: 13px;
  line-height: 1.4;
  max-height: 6.6em; /* roughly 5 lines */
  overflow: hidden;
  text-overflow: ellipsis;
}

.cp-footer {
  margin-top: auto;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
}

.cp-socials a {
  text-decoration: none;
  font-size: 13px;
  color: var(--primary, #0366d6);
}

/* Loading skeleton */
.cp-loading .cp-skeleton {
  background: linear-gradient(90deg,#f0f0f0,#eaeaea);
  border-radius: 4px;
}
.cp-loading .logo { width: 56px; height: 56px; }
.cp-loading .title { width: 70%; height: 16px; margin-top: 8px; }
.cp-loading .line { width: 100%; height: 12px; margin-top: 8px; }

/* Responsive: hide sidebar under small widths (mobile) or make collapsible */
@media (max-width: 900px) {
  .cp-root {
    display: none; /* or change to position: fixed with toggler for a slide-over */
  }
}
