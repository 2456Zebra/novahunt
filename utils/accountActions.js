let accountState = {
  searchesRemaining: 5,
  revealsRemaining: 3,
};

export function getAccountState() {
  return { ...accountState };
}

export function performSearch() {
  if (accountState.searchesRemaining > 0) {
    accountState.searchesRemaining -= 1;
    return true;
  }
  return false;
}

export function performReveal() {
  if (accountState.revealsRemaining > 0) {
    accountState.revealsRemaining -= 1;
    return true;
  }
  return false;
}
