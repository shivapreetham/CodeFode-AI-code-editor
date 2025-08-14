# Authentication System

## 🔐 Authentication Overview

CodeFode implements a comprehensive authentication system using NextAuth.js with support for credential-based authentication, OAuth providers, and two-factor authentication.

## 🏗️ Authentication Architecture

### NextAuth.js Configuration (`/app/api/auth/[...nextauth]/auth.ts`)

The authentication system is built on NextAuth.js v4 with custom providers and adapters.

**Supported Authentication Methods:**
- Email and password (credential-based)
- Google OAuth 2.0
- Two-factor authentication (OTP/TOTP)

### Authentication Flow

```
User Registration/Login → NextAuth.js → Custom Providers → Database → Session Creation
                      ↓
User Access → Middleware → Session Validation → Protected Routes
```

## 🔑 Authentication Providers

### Credentials Provider

Custom email/password authentication with bcrypt password hashing.

**Features:**
- Email validation and normalization
- Password strength requirements
- Secure password hashing with bcryptjs
- Login attempt rate limiting
- Account lockout protection

**Implementation:**
```typescript
CredentialsProvider({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" }
  },
  async authorize(credentials) {
    // Custom authentication logic
    const user = await authenticateUser(credentials);
    return user || null;
  }
})
```

### Google OAuth Provider

Social authentication integration with Google.

**Features:**
- OAuth 2.0 flow implementation
- Automatic account linking
- Profile information retrieval
- Scope management

**Configuration:**
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: "openid email profile"
    }
  }
})
```

## 🛡️ Security Features

### Password Security

**Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Implementation:**
```typescript
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[0-9]/, "Password must contain number")
  .regex(/[^A-Za-z0-9]/, "Password must contain special character");
```

### Two-Factor Authentication (2FA)

Support for both OTP (One-Time Password) and TOTP (Time-based OTP).

**OTP Features:**
- Email-based verification codes
- 6-digit numeric codes
- 5-minute expiration
- Rate limiting (max 3 attempts)

**TOTP Features:**
- Authenticator app support
- QR code generation
- Backup codes
- Recovery options

### Session Management

**Security Features:**
- JWT tokens with secure signing
- Session rotation on sensitive operations
- Automatic session expiration
- Secure HTTP-only cookies

**Session Configuration:**
```typescript
session: {
  strategy: "jwt",
  maxAge: 24 * 60 * 60, // 24 hours
  updateAge: 60 * 60, // 1 hour
}
```

## 📱 Authentication Pages

### Login Page (`/app/(auth)/login/page.tsx`)

**Features:**
- Email/password form validation
- Google OAuth button
- "Remember me" functionality
- Forgot password link
- Error handling and display

**Form Validation:**
```typescript
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional()
});
```

### Registration Page (`/app/(auth)/register/page.tsx`)

**Features:**
- Multi-step registration form
- Email verification requirement
- Password confirmation
- Terms of service acceptance
- Automatic login after registration

### Password Reset (`/app/(auth)/forgot-password/page.tsx`)

**Reset Flow:**
1. User enters email address
2. Reset token generated and emailed
3. User clicks reset link
4. New password form displayed
5. Password updated and user notified

## 🔒 Route Protection

### Middleware (`/middleware.ts`)

Protects routes and handles authentication requirements.

**Protected Routes:**
- `/room/*` - Collaborative editing rooms
- `/dashboard/*` - User dashboard
- `/profile/*` - User profile management

**Public Routes:**
- `/` - Landing page
- `/login` - Authentication
- `/register` - User registration
- `/forgot-password` - Password reset

**Implementation:**
```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token');
  const isAuthPage = authPages.includes(request.nextUrl.pathname);
  const isProtectedPage = protectedPages.some(page => 
    request.nextUrl.pathname.startsWith(page)
  );

  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}
```

### Server-Side Protection

**API Route Protection:**
```typescript
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }
  
  // Protected API logic
}
```

### Client-Side Protection

**Component-Level Protection:**
```typescript
const ProtectedComponent = () => {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <Loading />;
  if (status === "unauthenticated") redirect('/login');
  
  return <AuthenticatedContent />;
};
```

## 📧 Email Integration

### Email Verification

**Features:**
- Account activation emails
- HTML and plain text versions
- Custom email templates
- Resend functionality

### Password Reset Emails

**Features:**
- Secure reset token generation
- Time-limited reset links
- Clear instructions and branding
- Automatic token cleanup

**Email Configuration:**
```typescript
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT!),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## 🌐 Social Authentication

### Google OAuth Integration

**Setup Requirements:**
1. Google Cloud Console project
2. OAuth 2.0 credentials
3. Authorized redirect URIs
4. Environment variable configuration

**Scope Permissions:**
- `openid` - Basic identity information
- `email` - Email address access
- `profile` - Profile information

### Account Linking

**Features:**
- Automatic account merging
- Conflict resolution
- Profile information synchronization
- Security notifications

## 🔄 Authentication State Management

### Session Hooks

**useSession Hook:**
```typescript
const { data: session, status, update } = useSession();

// Session states: "loading" | "authenticated" | "unauthenticated"
```

**Custom Authentication Hook:**
```typescript
const useAuth = () => {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login: signIn,
    logout: signOut
  };
};
```

### Context Integration

Authentication state is integrated with the application's context system for consistent state management across components.

## 🧪 Testing Authentication

### Unit Tests
- Provider configuration testing
- Password validation testing
- Token generation and validation
- Session management testing

### Integration Tests
- Complete authentication flows
- OAuth provider integration
- Email delivery testing
- Route protection verification

### Security Testing
- Password brute force protection
- Session hijacking prevention
- CSRF token validation
- XSS prevention testing

## 📊 Security Monitoring

### Authentication Events
- Login attempts (successful/failed)
- Password reset requests
- Account lockouts
- Suspicious activity detection

### Audit Logging
- User registration events
- Password changes
- Permission modifications
- Security setting updates

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Database Connection
MONGODB_URL=mongodb://localhost:27017/codefode

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false

# Security Settings
JWT_SECRET=your-jwt-secret
BCRYPT_ROUNDS=12
```

### Production Considerations
- Use strong, unique secrets
- Enable HTTPS only
- Configure secure cookie settings
- Set up proper CORS policies
- Implement rate limiting
- Monitor authentication metrics