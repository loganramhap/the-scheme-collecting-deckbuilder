# Implementation Plan - Riot Sign-On Integration

- [x] 1. Set up backend infrastructure and database






  - Create PostgreSQL database schema for users and sessions tables
  - Set up database connection and ORM configuration
  - Implement database migration scripts
  - _Requirements: 6.1, 6.2, 6.6, 6.8_

- [x] 2. Implement backend authentication service




- [x] 2.1 Create PKCE utility functions


  - Write function to generate cryptographically secure code_verifier
  - Implement SHA-256 code_challenge generation
  - Write function to generate secure state parameter
  - _Requirements: 1.2, 1.3_

- [x] 2.2 Implement OAuth token exchange

  - Create service to exchange authorization code for tokens
  - Implement token refresh logic
  - Add token revocation on logout
  - Handle Riot API errors and retries
  - _Requirements: 1.4, 3.1, 3.2, 3.4_

- [x] 2.3 Implement Riot user info fetching

  - Create service to fetch user profile from Riot API
  - Parse PUUID, game name, and tag line
  - Handle API errors gracefully
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2.4 Write unit tests for auth service


  - Test PKCE generation and validation
  - Test token exchange with mocked Riot API
  - Test token refresh logic
  - Test error handling scenarios
  - _Requirements: 1.1-1.5, 2.1-2.3, 3.1-3.4_

- [x] 3. Implement user and session management services



- [x] 3.1 Create user service


  - Implement findUserByPuuid function
  - Implement createUser function with Gitea provisioning
  - Generate unique Gitea usernames from game name and tag
  - Implement password encryption/decryption
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 3.2 Create session service


  - Implement session creation and storage
  - Implement session retrieval and validation
  - Add session expiration logic
  - Implement httpOnly cookie management
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


- [x] 3.3 Implement Gitea provisioning

  - Create function to provision new Gitea accounts via API
  - Generate secure random passwords
  - Handle Gitea API errors and retries
  - Store Gitea credentials securely
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 3.4 Write unit tests for user and session services


  - Test user creation and retrieval
  - Test Gitea username generation
  - Test password encryption
  - Test session management
  - _Requirements: 6.1-6.9_

- [x] 4. Create backend API endpoints





- [x] 4.1 Implement /api/auth/riot/init endpoint


  - Generate PKCE parameters
  - Store code_verifier in session
  - Build and return authorization URL
  - _Requirements: 1.1, 1.2_

- [x] 4.2 Implement /api/auth/riot/callback endpoint

  - Validate state parameter
  - Exchange code for tokens
  - Fetch user info from Riot
  - Check if user exists or create new user
  - Provision Gitea account for new users
  - Set httpOnly cookies
  - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 6.1, 6.2, 6.3_

- [x] 4.3 Implement /api/auth/refresh endpoint

  - Read refresh token from cookie
  - Request new access token
  - Update cookies with new tokens
  - _Requirements: 3.1, 3.2_

- [x] 4.4 Implement /api/auth/logout endpoint

  - Revoke tokens with Riot
  - Clear session
  - Clear cookies
  - _Requirements: 3.4_

- [x] 4.5 Implement /api/auth/me endpoint

  - Validate session
  - Return current user data
  - _Requirements: 2.3, 2.4_

- [x] 4.6 Add authentication middleware


  - Create middleware to validate session cookies
  - Implement automatic token refresh
  - Handle expired sessions
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 4.7 Write integration tests for API endpoints


  - Test complete OAuth flow
  - Test callback handling
  - Test token refresh
  - Test logout
  - Test authentication middleware
  - _Requirements: 1.1-1.5, 3.1-3.4_

- [x] 5. Update frontend authentication store





- [x] 5.1 Modify auth store for RSO


  - Replace Gitea token with Riot user data
  - Remove token from localStorage
  - Update login method to initiate RSO flow
  - Update logout method to call backend
  - Add refreshAuth method
  - _Requirements: 2.3, 2.4, 3.4, 4.1, 4.2, 4.3_


- [x] 5.2 Create Riot user type definitions

  - Define RiotUser interface
  - Define AuthState interface
  - Export types for use across frontend
  - _Requirements: 2.1, 2.2, 2.3_


- [x] 5.3 Write unit tests for auth store

  - Test login flow
  - Test logout flow
  - Test state updates
  - _Requirements: 2.3, 2.4, 3.4_

- [x] 6. Implement frontend login page




- [x] 6.1 Update Login component


  - Remove username/password form
  - Add "Sign in with Riot Games" button
  - Add Riot Games branding and styling
  - Implement click handler to initiate OAuth
  - Add loading state during redirect
  - _Requirements: 1.1, 1.2_

- [x] 6.2 Add error handling to login page


  - Display OAuth error messages
  - Handle network errors
  - Show retry option on failure
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 6.3 Write component tests for login page


  - Test button rendering
  - Test click handler
  - Test error display
  - _Requirements: 1.1, 7.1, 7.2, 7.4_

- [x] 7. Implement OAuth callback handler






- [x] 7.1 Update AuthCallback component

  - Extract authorization code from URL
  - Extract state parameter from URL
  - Send code to backend callback endpoint
  - Handle success and redirect to dashboard
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 7.2 Add error handling to callback

  - Display error messages for failed authentication
  - Handle OAuth denial
  - Handle invalid state
  - Provide link to retry login
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7.3 Write component tests for callback handler


  - Test code extraction
  - Test success flow
  - Test error handling
  - _Requirements: 1.3, 1.4, 1.5, 7.1, 7.2_

- [x] 8. Update user interface components





- [x] 8.1 Update navigation bar


  - Display Riot game name and tag line
  - Show summoner icon if available
  - Update user menu styling
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 8.2 Update dashboard


  - Show welcome message with Riot username
  - Update any user-specific UI elements
  - _Requirements: 2.3, 2.4_

- [x] 8.3 Add session expiry handling


  - Detect expired sessions
  - Show re-authentication prompt
  - Redirect to login on session expiry
  - _Requirements: 3.3, 7.3_

- [x] 9. Implement Riot API integration




- [x] 9.1 Create Riot API service


  - Set up API client with authentication
  - Implement rate limiting
  - Add request retry logic
  - Handle API errors
  - _Requirements: 8.1, 8.2, 8.3, 8.4_


- [x] 9.2 Update existing API calls

  - Replace Gitea auth with RSO tokens where applicable
  - Update card data fetching to use user's access token
  - Implement response caching
  - _Requirements: 8.1, 8.5_


- [x] 9.3 Write integration tests for Riot API service

  - Test authenticated requests
  - Test rate limiting
  - Test error handling
  - Test caching
  - _Requirements: 8.1-8.5_

- [x] 10. Add environment configuration





  - Add Riot OAuth environment variables to .env
  - Update .env.example with new variables
  - Document configuration in README
  - Add validation for required environment variables
  - _Requirements: 1.1-1.5_

- [x] 11. Implement security measures




- [x] 11.1 Add rate limiting middleware


  - Implement rate limiting on auth endpoints
  - Set limit to 10 requests per minute per IP
  - Return 429 status when exceeded
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 11.2 Add CORS configuration


  - Configure CORS for production domain
  - Set appropriate headers for cookies
  - Restrict origins to zauniteworkshop.com
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11.3 Implement session cleanup job


  - Create background job to delete expired sessions
  - Schedule to run every hour
  - Log cleanup statistics
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 12. Update deployment configuration





- [x] 12.1 Update backend deployment


  - Add new environment variables to production
  - Update Docker configuration if needed
  - Deploy backend changes
  - _Requirements: 1.1-1.5_

- [x] 12.2 Update frontend deployment


  - Build frontend with new auth flow
  - Deploy to production
  - Verify OAuth redirect URIs
  - _Requirements: 1.1, 1.2_

- [x] 12.3 Configure database


  - Run migration scripts on production database
  - Verify tables created correctly
  - Set up database backups
  - _Requirements: 6.1, 6.2, 6.6_

- [x] 13. Testing and validation






- [x] 13.1 Perform end-to-end testing

  - Test complete new user flow
  - Test existing user login
  - Test session persistence
  - Test logout flow
  - Test token refresh
  - _Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.4, 6.1-6.9_


- [x] 13.2 Test error scenarios

  - Test OAuth denial
  - Test network failures
  - Test token expiration
  - Test invalid sessions
  - Test Gitea provisioning failures
  - _Requirements: 7.1-7.4_



- [x] 13.3 Perform security audit





  - Verify PKCE implementation
  - Verify token storage security
  - Verify session management
  - Test for CSRF vulnerabilities
  - Test rate limiting
  - _Requirements: 4.1-4.5, 11.1, 11.2_

- [x] 14. Documentation and monitoring





- [x] 14.1 Update documentation
  - Document RSO setup process
  - Update API documentation
  - Create troubleshooting guide
  - Document migration process for existing users
  - _Requirements: 1.1-1.5, 6.1-6.9_


- [x] 14.2 Set up monitoring

  - Add logging for authentication events
  - Set up alerts for auth failures
  - Monitor token refresh rates
  - Track new user registrations
  - _Requirements: 7.5_



- [x] 14.3 Create rollback plan

  - Document rollback procedure
  - Test rollback process
  - Prepare emergency maintenance message
  - _Requirements: 1.1-1.5_
