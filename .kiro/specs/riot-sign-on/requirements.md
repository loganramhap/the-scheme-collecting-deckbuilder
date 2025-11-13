# Requirements Document - Riot Sign-On Integration

## Introduction

This document outlines the requirements for implementing Riot Sign-On (RSO) as the primary authentication method for the Zaunite Workshop deck builder application. RSO will replace the current Gitea-based authentication system, allowing users to sign in with their Riot Games accounts.

## Glossary

- **RSO**: Riot Sign-On, Riot Games' OAuth 2.0 authentication system
- **OAuth 2.0**: Industry-standard protocol for authorization
- **Access Token**: A credential used to access protected resources
- **Refresh Token**: A credential used to obtain new access tokens
- **PKCE**: Proof Key for Code Exchange, security extension for OAuth 2.0
- **Summoner**: A player's account in League of Legends
- **PUUID**: Player Universally Unique Identifier, Riot's cross-game player ID
- **Application**: The Zaunite Workshop deck builder web application
- **Backend**: Server-side component handling authentication and data storage
- **Frontend**: Client-side React application

## Requirements

### Requirement 1: OAuth 2.0 Authentication Flow

**User Story:** As a user, I want to sign in with my Riot Games account, so that I can access the deck builder without creating a separate account.

#### Acceptance Criteria

1. WHEN a user visits the Application login page, THE Application SHALL display a "Sign in with Riot Games" button
2. WHEN a user clicks the "Sign in with Riot Games" button, THE Application SHALL redirect the user to Riot's authorization endpoint with PKCE parameters
3. WHEN a user authorizes the Application on Riot's page, THE Application SHALL receive an authorization code via callback
4. WHEN the Application receives an authorization code, THE Application SHALL exchange it for access and refresh tokens
5. WHEN token exchange succeeds, THE Application SHALL store tokens securely and mark the user as authenticated

### Requirement 2: User Profile Management

**User Story:** As a user, I want my Riot account information to be used as my profile, so that I don't need to maintain separate profile data.

#### Acceptance Criteria

1. WHEN a user completes RSO authentication, THE Application SHALL fetch the user's Riot account information
2. WHEN fetching account information, THE Application SHALL retrieve the user's PUUID, game name, and tag line
3. WHEN user information is retrieved, THE Application SHALL store it in the authentication state
4. WHEN displaying user information, THE Application SHALL show the game name and tag line (e.g., "PlayerName#NA1")
5. WHERE a user has a summoner profile, THE Application SHALL fetch and display summoner icon

### Requirement 3: Token Management

**User Story:** As a user, I want my session to remain active without frequent re-authentication, so that I can use the application seamlessly.

#### Acceptance Criteria

1. WHEN access tokens expire, THE Application SHALL automatically refresh them using the refresh token
2. WHEN a refresh token is used, THE Application SHALL store the new access and refresh tokens
3. IF token refresh fails, THEN THE Application SHALL redirect the user to the login page
4. WHEN a user logs out, THE Application SHALL revoke tokens and clear stored credentials
5. WHILE tokens are valid, THE Application SHALL include the access token in API requests to protected resources

### Requirement 4: Secure Token Storage

**User Story:** As a security-conscious user, I want my authentication tokens to be stored securely, so that my account cannot be compromised.

#### Acceptance Criteria

1. WHEN tokens are received, THE Application SHALL store them in httpOnly cookies on the Backend
2. WHEN storing tokens, THE Application SHALL encrypt sensitive token data
3. THE Application SHALL NOT expose access or refresh tokens to the Frontend JavaScript
4. WHEN making authenticated requests, THE Backend SHALL include tokens automatically via cookies
5. WHERE supported by the browser, THE Application SHALL use the Secure and SameSite cookie attributes

### Requirement 5: Backend Authentication Service

**User Story:** As a developer, I want a backend service to handle RSO authentication, so that sensitive operations are performed server-side.

#### Acceptance Criteria

1. THE Backend SHALL provide an endpoint to initiate the OAuth flow and generate PKCE parameters
2. THE Backend SHALL provide a callback endpoint to handle authorization codes
3. WHEN receiving an authorization code, THE Backend SHALL exchange it for tokens using the client secret
4. THE Backend SHALL provide an endpoint to refresh access tokens
5. THE Backend SHALL provide an endpoint to revoke tokens and log out users

### Requirement 6: Gitea Account Provisioning and Migration

**User Story:** As a new user, I want a Gitea account automatically created when I sign in with Riot, so that I can store my decks without additional setup.

#### Acceptance Criteria

1. WHEN a user completes RSO authentication for the first time, THE Application SHALL check if a Gitea account exists for that user
2. IF no Gitea account exists, THEN THE Application SHALL automatically provision a new Gitea account
3. WHEN provisioning a Gitea account, THE Application SHALL use the user's Riot PUUID as the unique identifier
4. WHEN creating a Gitea username, THE Application SHALL derive it from the user's game name and tag (e.g., "playername-na1")
5. THE Application SHALL generate a secure random password for the Gitea account
6. THE Application SHALL store the mapping between Riot PUUID and Gitea username in the Backend
7. WHERE a user already has a Gitea account from the old authentication system, THE Application SHALL link it to their Riot account
8. WHEN a returning user authenticates with RSO, THE Application SHALL retrieve their existing Gitea credentials
9. THE Application SHALL provide a one-time migration flow for existing users to link their Riot account to their Gitea data

### Requirement 7: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when authentication fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. IF RSO authorization is denied, THEN THE Application SHALL display a message explaining that authorization is required
2. IF token exchange fails, THEN THE Application SHALL display a generic error and log details for debugging
3. IF the user's session expires, THEN THE Application SHALL prompt the user to sign in again
4. WHEN network errors occur during authentication, THE Application SHALL display a retry option
5. THE Application SHALL log authentication errors to the Backend for monitoring and debugging

### Requirement 8: Riot API Integration

**User Story:** As a user, I want the application to use my Riot account for API requests, so that I can access my personal game data.

#### Acceptance Criteria

1. WHEN making Riot API requests, THE Application SHALL use the user's RSO access token
2. THE Application SHALL handle Riot API rate limits gracefully
3. IF API requests fail due to expired tokens, THEN THE Application SHALL refresh tokens and retry
4. THE Application SHALL respect Riot API terms of service and usage policies
5. WHERE applicable, THE Application SHALL cache API responses to minimize requests
