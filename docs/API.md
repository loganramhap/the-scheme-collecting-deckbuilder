# DeckBuilder API Reference

## Gitea API Integration

The web app uses Gitea's REST API for all Git operations.

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All requests require an OAuth token:
```
Authorization: token YOUR_ACCESS_TOKEN
```

## User Operations

### Get Current User
```http
GET /user
```

Response:
```json
{
  "id": 1,
  "username": "user",
  "email": "user@example.com",
  "avatar_url": "https://..."
}
```

### Get User Repositories
```http
GET /users/{username}/repos
```

## Repository Operations

### Create Repository
```http
POST /user/repos
```

Body:
```json
{
  "name": "decks",
  "description": "My deck collection",
  "private": false,
  "auto_init": true
}
```

### Get Repository Contents
```http
GET /repos/{owner}/{repo}/contents/{path}?ref={branch}
```

Response:
```json
{
  "name": "deck.deck.json",
  "path": "decks/deck.deck.json",
  "sha": "abc123",
  "size": 1234,
  "content": "base64_encoded_content",
  "encoding": "base64"
}
```

### Create/Update File
```http
POST /repos/{owner}/{repo}/contents/{path}
```

Body:
```json
{
  "content": "base64_encoded_content",
  "message": "Commit message",
  "branch": "main",
  "sha": "existing_file_sha"
}
```

## Branch Operations

### List Branches
```http
GET /repos/{owner}/{repo}/branches
```

### Create Branch
```http
POST /repos/{owner}/{repo}/branches
```

Body:
```json
{
  "new_branch_name": "feature-branch",
  "old_branch_name": "main"
}
```

### Delete Branch
```http
DELETE /repos/{owner}/{repo}/branches/{branch}
```

## Commit Operations

### List Commits
```http
GET /repos/{owner}/{repo}/commits?sha={branch}&page={page}&limit={limit}
```

### Get Single Commit
```http
GET /repos/{owner}/{repo}/commits/{sha}
```

### Compare Commits
```http
GET /repos/{owner}/{repo}/compare/{base}...{head}
```

Response:
```json
{
  "commits": [...],
  "files": [
    {
      "filename": "deck.deck.json",
      "status": "modified",
      "additions": 5,
      "deletions": 2
    }
  ]
}
```

## Pull Request Operations

### List Pull Requests
```http
GET /repos/{owner}/{repo}/pulls?state={open|closed|all}
```

### Create Pull Request
```http
POST /repos/{owner}/{repo}/pulls
```

Body:
```json
{
  "title": "Update deck",
  "body": "Added new cards",
  "head": "feature-branch",
  "base": "main"
}
```

### Get Pull Request
```http
GET /repos/{owner}/{repo}/pulls/{index}
```

### Merge Pull Request
```http
POST /repos/{owner}/{repo}/pulls/{index}/merge
```

Body:
```json
{
  "Do": "merge",
  "MergeMessageField": "Merge pull request",
  "MergeTitleField": "Merge #123"
}
```

### Get Pull Request Files
```http
GET /repos/{owner}/{repo}/pulls/{index}/files
```

## Fork Operations

### Fork Repository
```http
POST /repos/{owner}/{repo}/forks
```

Body:
```json
{
  "organization": "optional-org-name"
}
```

### List Forks
```http
GET /repos/{owner}/{repo}/forks
```

## Organization Operations

### List User Organizations
```http
GET /user/orgs
```

### Get Organization
```http
GET /orgs/{org}
```

### List Organization Repositories
```http
GET /orgs/{org}/repos
```

## Scryfall API (MTG Cards)

### Base URL
```
https://api.scryfall.com
```

### Search Cards
```http
GET /cards/search?q={query}
```

Query examples:
- `q=lightning bolt` - Name search
- `q=t:creature c:red` - Type and color
- `q=f:commander` - Format legal

Response:
```json
{
  "data": [
    {
      "id": "card-id",
      "name": "Card Name",
      "mana_cost": "{R}",
      "type_line": "Instant",
      "oracle_text": "...",
      "legalities": {
        "commander": "legal",
        "modern": "legal"
      },
      "image_uris": {
        "small": "https://...",
        "normal": "https://...",
        "large": "https://..."
      }
    }
  ]
}
```

### Get Card by ID
```http
GET /cards/{id}
```

### Get Card by Name
```http
GET /cards/named?exact={name}
```

### Autocomplete
```http
GET /cards/autocomplete?q={partial_name}
```

## DeckBuilder Backend API

### Base URL
```
http://localhost:3001/api
```

### OAuth Token Exchange
```http
POST /auth/token
```

Body:
```json
{
  "code": "oauth_code",
  "client_id": "...",
  "client_secret": "...",
  "redirect_uri": "..."
}
```

### Verify Token
```http
GET /auth/verify
Authorization: Bearer {token}
```

### Provision User
```http
POST /provision/user
```

Body:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "secure_password"
}
```

### Check User Exists
```http
GET /provision/user/{username}
```

### Validate MTG Deck
```http
POST /validation/mtg
```

Body:
```json
{
  "deck": {
    "game": "mtg",
    "format": "commander",
    "cards": [...]
  }
}
```

Response:
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

### Validate Riftbound Deck
```http
POST /validation/riftbound
```

## Rate Limits

### Gitea
- Default: 5000 requests per hour per token
- Configurable in Gitea settings

### Scryfall
- 10 requests per second
- Bulk data available for caching

## Error Handling

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no response body
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., file exists)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Specific error"
    }
  ]
}
```

## Webhooks

Configure webhooks in Gitea to trigger on:
- Push events (deck updates)
- Pull request events
- Branch creation/deletion

Webhook payload includes:
- Repository information
- Commit details
- Changed files
- User information

Use webhooks for:
- Automated validation
- Deck statistics
- Notifications
- CI/CD pipelines
