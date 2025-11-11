export interface GiteaUser {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
}

export interface GiteaRepo {
  id: number;
  name: string;
  full_name: string;
  owner: GiteaUser;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
}

export interface GiteaBranch {
  name: string;
  commit: {
    id: string;
    message: string;
  };
}

export interface GiteaCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    tree: {
      sha: string;
      url: string;
    };
  };
  parents: Array<{
    sha: string;
    url: string;
  }>;
  author: {
    id: number;
    login: string;
    email: string;
    avatar_url: string;
  };
  committer: {
    id: number;
    login: string;
    email: string;
    avatar_url: string;
  };
}

export interface GiteaPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  user: GiteaUser;
  head: {
    ref: string;
    repo: GiteaRepo;
  };
  base: {
    ref: string;
    repo: GiteaRepo;
  };
  created_at: string;
  updated_at: string;
}

export interface GiteaFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
}

/**
 * Represents a Git tree object
 */
export interface GiteaTree {
  sha: string;
  url: string;
  tree: GiteaTreeEntry[];
  truncated: boolean;
}

/**
 * Represents an entry in a Git tree
 */
export interface GiteaTreeEntry {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  size: number;
  sha: string;
  url: string;
}

/**
 * Represents a Git blob object
 */
export interface GiteaBlob {
  content: string;
  encoding: string;
  url: string;
  sha: string;
  size: number;
}

/**
 * Represents a comparison between two commits
 */
export interface GiteaCompare {
  total_commits: number;
  commits: GiteaCommit[];
  diff_url: string;
  html_url: string;
  files?: GiteaCompareFile[];
}

/**
 * Represents a file change in a comparison
 */
export interface GiteaCompareFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
}

/**
 * Request body for creating or updating a file
 */
export interface GiteaCreateFileRequest {
  content: string; // Base64 encoded
  message: string;
  branch?: string;
  sha?: string; // Required for updates
  author?: {
    name: string;
    email: string;
  };
  committer?: {
    name: string;
    email: string;
  };
  dates?: {
    author: string; // ISO 8601
    committer: string; // ISO 8601
  };
}

/**
 * Response from creating or updating a file
 */
export interface GiteaFileResponse {
  content: GiteaFileContent;
  commit: {
    sha: string;
    message: string;
    url: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
}
