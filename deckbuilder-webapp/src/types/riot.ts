/**
 * Riot Sign-On (RSO) authentication types
 */

/**
 * Represents a Riot Games user authenticated via RSO
 */
export interface RiotUser {
  /** Player Universally Unique Identifier - Riot's cross-game player ID */
  puuid: string;
  /** Player's in-game name (e.g., "PlayerName") */
  gameName: string;
  /** Player's tag line (e.g., "NA1") */
  tagLine: string;
  /** Optional summoner icon ID */
  summonerIcon?: number;
}

/**
 * Authentication state for the application
 */
export interface AuthState {
  /** Current authenticated Riot user, null if not authenticated */
  user: RiotUser | null;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Gitea username for backend operations (deck storage) */
  giteaUsername: string | null;
  /** Initiates the RSO OAuth flow */
  login: () => void;
  /** Logs out the user and clears session */
  logout: () => Promise<void>;
  /** Refreshes the authentication state from the backend */
  refreshAuth: () => Promise<void>;
}
