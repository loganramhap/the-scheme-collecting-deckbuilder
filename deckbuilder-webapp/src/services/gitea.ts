import axios from 'axios';
import type { GiteaUser, GiteaRepo, GiteaBranch, GiteaCommit, GiteaPullRequest, GiteaFileContent } from '../types/gitea';

const GITEA_URL = import.meta.env.VITE_GITEA_URL || 'http://localhost:3000';

class GiteaService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      Authorization: `token ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async getCurrentUser(): Promise<GiteaUser> {
    const { data } = await axios.get(`${GITEA_URL}/api/v1/user`, {
      headers: this.getHeaders(),
    });
    return data;
  }

  async getUserRepos(username: string): Promise<GiteaRepo[]> {
    const { data } = await axios.get(`${GITEA_URL}/api/v1/users/${username}/repos`, {
      headers: this.getHeaders(),
    });
    return data;
  }

  async createRepo(name: string, isPrivate: boolean = false): Promise<GiteaRepo> {
    const { data } = await axios.post(
      `${GITEA_URL}/api/v1/user/repos`,
      { name, private: isPrivate, auto_init: true },
      { headers: this.getHeaders() }
    );
    return data;
  }

  async getBranches(owner: string, repo: string): Promise<GiteaBranch[]> {
    const { data } = await axios.get(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/branches`,
      { headers: this.getHeaders() }
    );
    return data;
  }

  async createBranch(owner: string, repo: string, branchName: string, fromBranch: string = 'main') {
    await axios.post(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/branches`,
      { new_branch_name: branchName, old_branch_name: fromBranch },
      { headers: this.getHeaders() }
    );
  }

  async getFileContent(owner: string, repo: string, path: string, ref: string = 'main'): Promise<GiteaFileContent> {
    const { data } = await axios.get(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
      { headers: this.getHeaders() }
    );
    return data;
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string = 'main',
    sha?: string
  ) {
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    await axios.post(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/${path}`,
      {
        content: encodedContent,
        message,
        branch,
        sha,
      },
      { headers: this.getHeaders() }
    );
  }

  async getCommits(owner: string, repo: string, branch: string = 'main'): Promise<GiteaCommit[]> {
    const { data } = await axios.get(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/commits?sha=${branch}`,
      { headers: this.getHeaders() }
    );
    return data;
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string
  ): Promise<GiteaPullRequest> {
    const { data } = await axios.post(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/pulls`,
      { title, head, base, body },
      { headers: this.getHeaders() }
    );
    return data;
  }

  async getPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GiteaPullRequest[]> {
    const { data } = await axios.get(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/pulls?state=${state}`,
      { headers: this.getHeaders() }
    );
    return data;
  }

  async mergePullRequest(owner: string, repo: string, index: number) {
    await axios.post(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/pulls/${index}/merge`,
      {},
      { headers: this.getHeaders() }
    );
  }

  async forkRepo(owner: string, repo: string, organization?: string): Promise<GiteaRepo> {
    const { data } = await axios.post(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/forks`,
      { organization },
      { headers: this.getHeaders() }
    );
    return data;
  }

  async compareCommits(owner: string, repo: string, base: string, head: string) {
    const { data } = await axios.get(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/compare/${base}...${head}`,
      { headers: this.getHeaders() }
    );
    return data;
  }
}

export const giteaService = new GiteaService();
