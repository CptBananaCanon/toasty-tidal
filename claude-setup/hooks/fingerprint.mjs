import { execFileSync } from "node:child_process";

/**
 * Where the repository stands: the commit, and whether the working tree is clean.
 * A check only counts for a clean tree at a known commit.
 */
export function fingerprint(root) {
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  try {
    return {
      head: git("rev-parse", "HEAD"),
      clean: git("status", "--porcelain", "--untracked-files=normal") === "",
    };
  } catch {
    return { head: "unknown", clean: false };
  }
}
