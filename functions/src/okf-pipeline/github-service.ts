import { Octokit } from "@octokit/rest";

export class GitHubService {
  private octokit: Octokit | null = null;
  private owner: string;
  private repo: string;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    this.owner = process.env.GITHUB_REPO_OWNER || "aliunnab";
    this.repo = process.env.GITHUB_REPO_NAME || "MarineWorld-Contracts";

    if (token && !token.includes("placeholder")) {
      try {
        this.octokit = new Octokit({ auth: token });
        console.log(`✅ GitHub Client Initialized for repo: ${this.owner}/${this.repo}`);
      } catch (err) {
        console.error("❌ Failed to initialize GitHub Client:", err);
      }
    } else {
      console.warn("⚠️ GITHUB_TOKEN is missing or a placeholder. GitHub Service will operate in offline log-only mode.");
    }
  }

  /**
   * Commits and pushes the OKF document to the company's folder in the GitHub repo.
   */
  public async commitOKFDocument(
    companyId: string,
    fileName: string,
    content: string,
    commitMessage?: string
  ): Promise<{ path: string; htmlUrl?: string; sha: string }> {
    // Generate clean path: e.g. companies/company_123/katalog_xyz.md
    const cleanFileName = fileName.replace(/\.[^/.]+$/, "") + ".md";
    const filePath = `companies/${companyId}/okf/${cleanFileName}`;
    const message = commitMessage || `[OKF Sync] Auto-update document: ${cleanFileName}`;

    if (!this.octokit) {
      console.log(`[GitHub Offline Mock] Committing to: ${this.owner}/${this.repo}/${filePath}`);
      console.log(`[GitHub Offline Mock] Message: ${message}`);
      return {
        path: filePath,
        sha: `mock-sha-${Math.random().toString(36).substr(2, 9)}`,
        htmlUrl: `https://github.com/${this.owner}/${this.repo}/blob/main/${filePath}`,
      };
    }

    try {
      let existingFileSha: string | undefined = undefined;

      // 1. Check if file already exists to get its SHA
      try {
        console.log(`🔍 Checking if file exists on GitHub: ${filePath}`);
        const res = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
        });

        if (res.data && !Array.isArray(res.data) && res.data.sha) {
          existingFileSha = res.data.sha;
          console.log(`📝 Existing file found. SHA: ${existingFileSha}`);
        }
      } catch (error: any) {
        if (error.status === 404) {
          console.log(`📝 File does not exist yet. Creating a new one.`);
        } else {
          console.warn("⚠️ Warn checking file existence on GitHub:", error.message);
        }
      }

      // 2. Commit and push
      console.log(`🚀 Pushing document to GitHub: ${filePath}...`);
      const base64Content = Buffer.from(content).toString("base64");

      const response = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: message,
        content: base64Content,
        sha: existingFileSha,
      });

      console.log(`✅ Successfully committed to GitHub. Commit SHA: ${response.data.commit.sha}`);
      return {
        path: response.data.content?.path || filePath,
        sha: response.data.content?.sha || "unknown-sha",
        htmlUrl: response.data.content?.html_url || `https://github.com/${this.owner}/${this.repo}/blob/main/${filePath}`,
      };
    } catch (error: any) {
      console.error(`❌ GitHub Commit Failed for ${filePath}:`, error.message);
      throw new Error(`GitHub Service Error: ${error.message}`);
    }
  }
}
