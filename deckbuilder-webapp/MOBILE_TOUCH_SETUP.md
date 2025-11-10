# Mobile Touch Support Setup

## Installation Required

To enable drag-and-drop on touch devices, install the touch backend:

```bash
npm install react-dnd-touch-backend
```

## Update App.tsx

Replace the static HTML5Backend with the dynamic backend selector:

```typescript
import { getDndBackend, getDndBackendOptions } from './utils/dndBackend';

function App() {
  return (
    <DndProvider backend={getDndBackend()} options={getDndBackendOptions()}>
      {/* ... rest of app */}
    </DndProvider>
  );
}
```

## Features

- Automatically detects touch devices
- Falls back to HTML5Backend for desktop
- Enables mouse events on touch devices for hybrid support
- Adds 200ms delay before drag starts (allows scrolling)

## Testing

Test on:
- Mobile browsers (iOS Safari, Chrome Mobile)
- Tablets (iPad, Android tablets)
- Desktop with touch screen
- Desktop with mouse only

## Current Status

The utility functions are ready in `src/utils/dndBackend.ts`, but the package needs to be installed and App.tsx needs to be updated.
