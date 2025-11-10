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
