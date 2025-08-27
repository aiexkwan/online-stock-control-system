# Authentication Dependency Injection System

## Overview

This directory implements a comprehensive dependency injection pattern for authentication in the application. The system provides centralized authentication state management and service injection through React Context.

## Architecture

### Core Components

1. **AuthContext.tsx** - Main authentication context provider
2. **LoginContext.tsx** - Login-specific context (existing, enhanced)
3. **AuthProviderSetup.tsx** - Provider configuration helpers
4. **index.ts** - Unified exports and convenience hooks

### Dependency Injection Pattern

The system follows React's Context pattern for dependency injection:

```tsx
// Before (Direct Dependencies)
import { useAuth } from '@/app/hooks/useAuth';
const { user, loading } = useAuth(); // Direct hook dependency

// After (Dependency Injection)
import { useAuthState } from '@/app/(auth)/main-login/context';
const { user, loading } = useAuthState(); // Injected through context
```

## Features

### 1. Authentication Service (`AuthService`)

Provides centralized authentication operations:

```tsx
const authService = useAuthService();

// Authentication operations
await authService.getCurrentUser();
await authService.signOut();
await authService.refreshSession();

// Permission checking
const canAccess = authService.canAccessPath('/admin/dashboard');
const hasPermission = authService.hasPermission('ask_database');
const isAdmin = authService.hasRole('admin');
```

### 2. Extended Auth State (`ExtendedAuthState`)

Enhances the basic auth state with computed properties:

```tsx
const {
  user,              // Supabase user object
  loading,           // Loading state
  isAuthenticated,   // Authentication status
  userRole,          // User role object
  isAdmin,           // Computed: is user admin
  isUser,            // Computed: is user regular user
  department,        // User's department
  position,          // User's position
  email,             // User's email
  defaultPath,       // Default redirect path
  allowedPaths,      // Allowed navigation paths
  navigationRestricted  // Whether navigation is restricted
} = useAuthState();
```

### 3. Permission-based Access Control

```tsx
const { hasRole, hasPermission, canAccessPath } = useAuthPermissions();

// Role-based checks
if (hasRole('admin')) {
  // Admin-only functionality
}

// Permission-based checks
if (hasPermission('ask_database')) {
  // Database query functionality
}

// Path-based checks
if (canAccessPath('/admin/sensitive-data')) {
  // Sensitive page access
}
```

## Setup and Usage

### 1. Application-level Setup

Wrap your app root with the AuthProvider:

```tsx
// app/layout.tsx or root component
import { AuthProviderSetup } from '@/app/(auth)/main-login/context/AuthProviderSetup';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProviderSetup>
          {children}
        </AuthProviderSetup>
      </body>
    </html>
  );
}
```

### 2. Login Routes Setup

For login-specific routes, use the combined provider:

```tsx
// app/(auth)/main-login/layout.tsx
import { CombinedAuthProviderSetup } from './context/AuthProviderSetup';

export default function AuthLayout({ children }) {
  return (
    <CombinedAuthProviderSetup>
      {children}
    </CombinedAuthProviderSetup>
  );
}
```

### 3. Component Usage

```tsx
// In any component
import { useAuthState, useAuthService, useAuthPermissions } from '@/app/(auth)/main-login/context';

function MyComponent() {
  const { user, isAuthenticated, loading } = useAuthState();
  const authService = useAuthService();
  const { hasPermission } = useAuthPermissions();

  const handleSignOut = async () => {
    await authService.signOut();
  };

  if (!hasPermission('view_dashboard')) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      {loading ? 'Loading...' : `Hello ${user?.email}`}
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
}
```

## Migration Guide

### Updating Existing Components

1. **Replace direct useAuth imports:**
   ```tsx
   // Before
   import { useAuth } from '@/app/hooks/useAuth';
   
   // After
   import { useAuthState } from '@/app/(auth)/main-login/context';
   ```

2. **Update hook usage:**
   ```tsx
   // Before
   const { user, loading, isAuthenticated } = useAuth();
   
   // After  
   const { user, loading, isAuthenticated } = useAuthState();
   ```

3. **Use specialized hooks for specific needs:**
   ```tsx
   // For authentication operations
   const authService = useAuthService();
   
   // For permission checks
   const { hasRole, hasPermission } = useAuthPermissions();
   ```

### Backward Compatibility

The system maintains backward compatibility through:

1. **Compatibility hooks** in `index.ts`
2. **Existing LoginContext** integration
3. **Gradual migration** support

## Benefits

### 1. Centralized State Management
- Single source of truth for authentication state
- Consistent state across the entire application
- Easier debugging and state inspection

### 2. Service Abstraction
- Abstract authentication operations through services
- Easier to mock for testing
- Simpler to swap authentication providers

### 3. Permission System
- Built-in role-based access control
- Path-based navigation restrictions
- Fine-grained permission checking

### 4. Performance Optimization
- Memoized context values
- Reduced re-renders through proper dependency arrays
- Optional refresh intervals for long-running sessions

### 5. Developer Experience
- TypeScript support with proper type inference
- Clear separation of concerns
- Consistent API across components

## Testing

### Mocking for Tests

```tsx
// Create mock auth provider for tests
const MockAuthProvider = ({ children, mockState }) => {
  return (
    <AuthContext.Provider value={mockState}>
      {children}
    </AuthContext.Provider>
  );
};

// Use in tests
test('component with auth', () => {
  const mockAuthState = {
    user: { email: 'test@example.com' },
    isAuthenticated: true,
    loading: false,
    // ... other required properties
  };

  render(
    <MockAuthProvider mockState={mockAuthState}>
      <MyComponent />
    </MockAuthProvider>
  );
});
```

## Configuration Options

### AuthProvider Options

```tsx
<AuthProvider
  enableLogging={true}          // Enable debug logging
  refreshInterval={300000}      // Auto-refresh every 5 minutes
>
  {children}
</AuthProvider>
```

### LoginProvider Options

```tsx
<LoginProvider
  initialView="login"           // Default view
  enablePersistence={true}      // Persist form state
>
  {children}
</LoginProvider>
```

## Troubleshooting

### Common Issues

1. **Context not found error:**
   - Ensure components are wrapped with AuthProvider
   - Check provider hierarchy

2. **Type errors:**
   - Verify imports from the correct context file
   - Check TypeScript version compatibility

3. **State not updating:**
   - Verify useAuth hook is being used within provider
   - Check for proper dependency arrays in effects

### Debug Mode

Enable logging to debug authentication issues:

```tsx
<AuthProvider enableLogging={process.env.NODE_ENV === 'development'}>
  {children}
</AuthProvider>
```

## Future Enhancements

1. **Multi-tenant support** - Context per tenant
2. **Session management** - Advanced session handling
3. **Audit logging** - Track authentication events
4. **Rate limiting** - Built-in rate limiting for auth operations
5. **Multi-factor authentication** - MFA support through context