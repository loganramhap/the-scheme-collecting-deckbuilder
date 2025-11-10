# Gitea Deck Plugin

Go-based plugin that enhances Gitea's viewing and editing of `.deck.json` files.

## Features

- Detects `.deck.json` files in repositories
- Renders visual deck viewer instead of raw JSON
- Provides deck validation API
- Links to DeckBuilder web app for editing

## Installation

1. Build the plugin:
```bash
go build -o deck-plugin
```

2. Run the plugin server:
```bash
./deck-plugin
```

The plugin runs on port 8080 by default.

## Integration with Gitea

To integrate with Gitea, you can:

1. **Reverse Proxy**: Configure Nginx to proxy `/deck/*` requests to the plugin
2. **Custom Template**: Modify Gitea templates to detect `.deck.json` files and embed the viewer
3. **Webhook**: Use Gitea webhooks to trigger validation on deck commits

## API Endpoints

### Parse Deck
```
GET /api/deck/parse?content=<json>
```

Parses and validates deck JSON structure.

### Validate Deck
```
GET /api/deck/validate?content=<json>
```

Returns validation results including errors and warnings.

## Deck Viewer

Access the deck viewer at:
```
http://localhost:8080/viewer/?deck=<encoded-json>
```

The viewer displays:
- Deck information and metadata
- Card list with counts
- Validation results
- Link to open in DeckBuilder app

## Development

The plugin is built with:
- Go 1.21+
- chi router for HTTP handling
- Standard library for JSON parsing

To modify the viewer UI, edit `static/viewer.html`.
