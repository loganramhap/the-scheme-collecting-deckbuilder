# Login Component - Riot Sign-On Implementation

## Overview

The Login component has been updated to use Riot Sign-On (RSO) OAuth 2.0 authentication instead of the previous Gitea username/password form.

## Changes Made

### 1. Updated Login Component (`Login.tsx`)

**Removed:**
- Username/password form fields
- Email field for sign-up
- Sign-up/sign-in toggle
- Direct Gitea token creation

**Added:**
- "Sign in with Riot Games" button with Riot branding
- Riot Games shield icon (SVG)
- Riot red color scheme (#D13639)
- Loading state with spinner during OAuth redirect
- OAuth error handling from URL parameters
- Network error handling
- Retry button for failed authentication attempts

### 2. Error Handling

The component handles multiple error scenarios:

- **OAuth Errors**: Reads `error` and `error_description` from URL params
  - `access_denied`: Shows message about authorization requirement
  - Other errors: Shows generic error message
  
- **Network Errors**: Detects `ERR_NETWORK` and connection issues
  - Shows user-friendly message with retry option
  
- **Retry Functionality**: Error display includes a "Try Again" button
  - Clears error state and re-initiates OAuth flow

### 3. Component Tests (`Login.test.ts`)

Created manual test suite following the project's testing pattern:

**Tests included:**
1. Login button rendering verification
2. Click handler functionality
3. OAuth error display
4. Network error handling
5. Retry functionality
6. Loading state management
7. Authenticated user redirect
8. Riot Games branding
9. URL error parameter handling
10. Button disabled state during loading

**Running tests:**
```javascript
// In browser console
window.runLoginTests()
```

## User Flow

1. User visits `/login` page
2. Sees "Sign in with Riot Games" button with Riot branding
3. Clicks button → `handleRiotSignIn()` is called
4. Component shows loading state
5. `login()` from auth store initiates OAuth flow
6. User is redirected to Riot's authorization page
7. After authorization, user is redirected back to `/auth/callback`
8. Callback handler completes authentication
9. User is redirected to dashboard

## Error Flow

1. If OAuth fails, Riot redirects to `/login?error=access_denied`
2. Component detects error in URL params
3. Displays appropriate error message
4. Shows "Try Again" button
5. User can retry authentication

## Styling

- Uses Riot Games official red color: `#D13639`
- Hover state: `#B8292C`
- Shield icon for Riot branding
- Loading spinner with Riot colors
- Responsive card layout
- Dark theme consistent with app design

## Integration Points

- **Auth Store**: Uses `useAuthStore` for `login()` method
- **Auth API**: Calls `/api/auth/riot/init` endpoint
- **Router**: Uses `useNavigate` for redirects and `useSearchParams` for error handling
- **Callback**: Works with `AuthCallback.tsx` component

## Requirements Satisfied

✅ **Requirement 1.1**: Display "Sign in with Riot Games" button  
✅ **Requirement 1.2**: Redirect to Riot's authorization endpoint with PKCE  
✅ **Requirement 7.1**: Display OAuth error messages  
✅ **Requirement 7.2**: Handle network errors  
✅ **Requirement 7.4**: Show retry option on failure  

## Manual Testing Checklist

- [ ] Click "Sign in with Riot Games" button
- [ ] Verify redirect to Riot authorization page
- [ ] Test error display by adding `?error=access_denied` to URL
- [ ] Test network error by disconnecting from backend
- [ ] Verify retry button appears and works
- [ ] Check loading state during OAuth initiation
- [ ] Verify authenticated users redirect to dashboard
- [ ] Test on different screen sizes (responsive)
- [ ] Verify Riot branding colors and icon display correctly

## Future Enhancements

- Add proper testing framework (Vitest + React Testing Library)
- Add accessibility improvements (ARIA labels, keyboard navigation)
- Add analytics tracking for login attempts
- Add "Remember me" functionality (if needed)
- Add multi-language support
