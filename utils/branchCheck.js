// utils/branchCheck.js

export function ensureGoodBranch() {
  const allowedBranch = "restore-good-design-f5d87fc";
  const currentBranch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF;

  if (currentBranch !== allowedBranch) {
    console.error(
      `🚨 Deployment blocked! You are on branch "${currentBranch}". Only "${allowedBranch}" is allowed.`
    );
    // Redirect to good site if in browser
    if (typeof window !== "undefined") {
      window.location.href = "https://novahunt-2sxouw5cx-nova-hunts-projects.vercel.app";
    }
    return false;
  }
  return true;
}
