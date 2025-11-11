import axios from 'axios';
import type { GiteaUser, GiteaRepo, GiteaBranch, GiteaCommit, GiteaPullRequest, GiteaFileContent } from '../types/gitea';
import type { DeckCommit, DeckBranch } from '../types/versioning';
import type { Deck } from '../types/deck';
import { LRUCache } from '../utils/lruCache';

const GITEA_URL = import.meta.env.VITE_GITEA_URL || 'http://localhost:3000';

class GiteaService {
  private token: string | null = null;
  private deckVersionCache: LRUCache<string, Deck>;

  constructor() {
    // Initialize LRU cache with max 10 deck versions
    this.deckVersionCache = new LRUCache<string, Deck>(10);
  }

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

  async deleteRepo(owner: string, repo: string) {
    await axios.delete(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get commit history for a branch with pagination
   * @param owner Repository owner
   * @param repo Repository name
   * @param branch Branch name (defaults to 'main')
   * @param page Page number (defaults to 1)
   * @param perPage Number of commits per page (defaults to 20)
   * @returns Array of DeckCommit objects
   */
  async getCommitHistory(
    owner: string,
    repo: string,
    branch: string = 'main',
    page: number = 1,
    perPage: number = 20
  ): Promise<DeckCommit[]> {
    const { data } = await axios.get<GiteaCommit[]>(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/commits`,
      {
        headers: this.getHeaders(),
        params: {
          sha: branch,
          page,
          limit: perPage,
        },
      }
    );

    // Transform Gitea commits to DeckCommit format
    return data.map((giteaCommit) => {
      // Check if this is an auto-save commit by looking at the message
      const isAutoSave = giteaCommit.commit.message.startsWith('Auto-save:');
      
      // Try to parse changes summary from commit message
      let changesSummary: DeckCommit['changesSummary'] | undefined;
      const summaryMatch = giteaCommit.commit.message.match(/Added (\d+) cards?, removed (\d+) cards?, modified (\d+) cards?/i);
      if (summaryMatch) {
        changesSummary = {
          cardsAdded: parseInt(summaryMatch[1], 10),
          cardsRemoved: parseInt(summaryMatch[2], 10),
          cardsModified: parseInt(summaryMatch[3], 10),
        };
      }

      return {
        sha: giteaCommit.sha,
        message: giteaCommit.commit.message,
        author: {
          name: giteaCommit.commit.author.name,
          email: giteaCommit.commit.author.email,
          date: giteaCommit.commit.author.date,
        },
        committer: {
          name: giteaCommit.commit.committer.name,
          email: giteaCommit.commit.committer.email,
          date: giteaCommit.commit.committer.date,
        },
        parents: giteaCommit.parents.map((p) => p.sha),
        isAutoSave,
        changesSummary,
      };
    });
  }

  /**
   * Get deck state at a specific commit
   * @param owner Repository owner
   * @param repo Repository name
   * @param sha Commit SHA
   * @param deckPath Path to deck file (defaults to 'deck.json')
   * @returns Deck object at the specified commit
   */
  async getDeckAtCommit(
    owner: string,
    repo: string,
    sha: string,
    deckPath: string = 'deck.json'
  ): Promise<Deck> {
    // Create cache key
    const cacheKey = `${owner}/${repo}/${sha}/${deckPath}`;

    // Check cache first
    const cachedDeck = this.deckVersionCache.get(cacheKey);
    if (cachedDeck) {
      return cachedDeck;
    }

    // Fetch from API
    const { data } = await axios.get<GiteaFileContent>(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/${deckPath}`,
      {
        headers: this.getHeaders(),
        params: {
          ref: sha,
        },
      }
    );

    // Decode the base64 content
    const decodedContent = decodeURIComponent(escape(atob(data.content)));
    const deck = JSON.parse(decodedContent) as Deck;

    // Store in cache
    this.deckVersionCache.set(cacheKey, deck);

    return deck;
  }

  /**
   * Create a new Git branch
   * @param owner Repository owner
   * @param repo Repository name
   * @param branchName New branch name
   * @param fromBranch Source branch (defaults to 'main')
   * @returns Created DeckBranch object
   */
  async createBranchFromRef(
    owner: string,
    repo: string,
    branchName: string,
    fromBranch: string = 'main'
  ): Promise<DeckBranch> {
    // Create the branch using existing method
    await this.createBranch(owner, repo, branchName, fromBranch);

    // Fetch the newly created branch to get its details
    const branches = await this.listBranches(owner, repo);
    const newBranch = branches.find((b) => b.name === branchName);

    if (!newBranch) {
      throw new Error(`Failed to create branch: ${branchName}`);
    }

    return newBranch;
  }

  /**
   * List all branches in a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Array of DeckBranch objects
   */
  async listBranches(owner: string, repo: string): Promise<DeckBranch[]> {
    const { data } = await axios.get<GiteaBranch[]>(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/branches`,
      { headers: this.getHeaders() }
    );

    // Get repository info to determine the default branch
    const repoInfo = await this.getRepoInfo(owner, repo);
    const defaultBranch = repoInfo.default_branch;

    return data.map((branch) => ({
      name: branch.name,
      commit: {
        sha: branch.commit.id,
        message: branch.commit.message,
        date: new Date().toISOString(), // Gitea branch API doesn't include date, would need separate commit fetch
      },
      protected: branch.name === defaultBranch,
    }));
  }

  /**
   * Get repository information
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Repository information
   */
  async getRepoInfo(owner: string, repo: string): Promise<GiteaRepo> {
    const { data } = await axios.get<GiteaRepo>(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}`,
      { headers: this.getHeaders() }
    );
    return data;
  }

  /**
   * Clear the deck version cache
   * Should be called on logout or when cache needs to be invalidated
   */
  clearDeckVersionCache(): void {
    this.deckVersionCache.clear();
  }

  /**
   * Merge a source branch into a target branch
   * @param owner Repository owner
   * @param repo Repository name
   * @param sourceBranch Source branch to merge from
   * @param targetBranch Target branch to merge into
   * @param message Merge commit message
   * @returns The merge commit
   */
  async mergeBranch(
    owner: string,
    repo: string,
    sourceBranch: string,
    targetBranch: string,
    message: string
  ): Promise<DeckCommit> {
    // Gitea's merge API uses the pull request merge endpoint
    // First, we need to create a pull request, then merge it
    // For a simpler approach, we'll use the merge endpoint directly if available
    
    const { data } = await axios.post<GiteaCommit>(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/merge-base/${targetBranch}/${sourceBranch}`,
      {
        message,
      },
      { headers: this.getHeaders() }
    );

    // Transform to DeckCommit format
    return {
      sha: data.sha,
      message: data.commit.message,
      author: {
        name: data.commit.author.name,
        email: data.commit.author.email,
        date: data.commit.author.date,
      },
      committer: {
        name: data.commit.committer.name,
        email: data.commit.committer.email,
        date: data.commit.committer.date,
      },
      parents: data.parents.map((p) => p.sha),
      isAutoSave: false,
    };
  }

  /**
   * Update a deck file with an optional commit message
   * @param owner Repository owner
   * @param repo Repository name
   * @param deck Deck object to save
   * @param commitMessage Optional commit message (defaults to 'Update deck')
   * @param deckPath Path to deck file (defaults to 'deck.json')
   * @param branch Branch to commit to (defaults to 'main')
   * @throws Error if the update fails
   */
  async updateDeck(
    owner: string,
    repo: string,
    deck: Deck,
    commitMessage?: string,
    deckPath: string = 'deck.json',
    branch: string = 'main'
  ): Promise<void> {
    try {
      // Get current file to retrieve SHA
      const currentFile = await this.getFileContent(owner, repo, deckPath, branch);
      
      // Use provided commit message or default
      const message = commitMessage || 'Update deck';
      
      // Serialize deck to JSON
      const content = JSON.stringify(deck, null, 2);
      
      // Update file with commit
      await this.createOrUpdateFile(
        owner,
        repo,
        deckPath,
        content,
        message,
        branch,
        currentFile.sha
      );
    } catch (error) {
      // Handle errors gracefully with context
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        
        if (status === 404) {
          throw new Error(`Deck file not found: ${deckPath}`);
        } else if (status === 409) {
          throw new Error('Conflict: The deck file was modified by another process. Please refresh and try again.');
        } else if (status === 401 || status === 403) {
          throw new Error('Authentication failed. Please sign in again.');
        } else {
          throw new Error(`Failed to update deck: ${message}`);
        }
      }
      
      // Re-throw non-Axios errors
      throw error;
    }
  }

  /**
   * Get a deck from a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param deckPath Path to deck file (defaults to 'deck.json')
   * @param ref Git reference (branch, tag, or commit SHA)
   * @returns Deck object
   */
  async getDeck(
    owner: string,
    repo: string,
    deckPath: string = 'deck.json',
    ref: string = 'main'
  ): Promise<Deck> {
    try {
      const fileContent = await this.getFileContent(owner, repo, deckPath, ref);
      const content = atob(fileContent.content);
      return JSON.parse(content) as Deck;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        
        if (status === 404) {
          throw new Error(`Deck file not found: ${deckPath}`);
        } else if (status === 401 || status === 403) {
          throw new Error('Authentication failed. Please sign in again.');
        }
      }
      
      throw error;
    }
  }
}

export const giteaService = new GiteaService();
