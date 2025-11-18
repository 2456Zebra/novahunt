# NextAuth Authentication Setup

This project uses NextAuth v4 with a Credentials provider and a file-backed user store.

## Environment Variables

The following environment variables are **required** for authentication to work:

### NEXTAUTH_URL
- **Required for production**
- The canonical URL of your site
- Example: `https://www.novahunt.ai`
- For local development: `http://localhost:3000`

### NEXTAUTH_SECRET
- **Required for production**
- A random string used to hash tokens and sign/encrypt cookies
- Generate with: `openssl rand -base64 32`
- Example: `your-secret-key-here-min-32-chars`

## Setting Environment Variables in Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables for **Production**:
   - `NEXTAUTH_URL` = `https://www.novahunt.ai`
   - `NEXTAUTH_SECRET` = `[your-generated-secret]`

4. **Important**: Also add these for Preview and Development environments if needed

## API Endpoints

### POST /api/signup
Creates a new user account.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "your-password",
  "name": "User Name" // optional
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com"
}
```

**Error responses:**
- 400: Email and password required
- 409: User already exists
- 500: Internal server error

### NextAuth Endpoints

NextAuth automatically creates the following endpoints at `/api/auth/*`:

- `/api/auth/signin` - Sign in page
- `/api/auth/signout` - Sign out
- `/api/auth/session` - Get session
- `/api/auth/csrf` - Get CSRF token
- `/api/auth/providers` - Get configured providers

## User Store

Users are stored in a file at `data/users.json` (gitignored).

**User schema:**
```javascript
{
  id: "uuid",
  email: "user@example.com",
  passwordHash: "bcrypt-hashed-password",
  name: "User Name"
}
```

## Migration Path

The current implementation uses a simple file-backed store for user data. To migrate to a database:

1. Install a NextAuth database adapter (e.g., `@next-auth/prisma-adapter`)
2. Replace the file-backed user store with database queries
3. Update the NextAuth configuration to use the adapter
4. Migrate existing users from `data/users.json` to the database

## Security Notes

- Passwords are hashed using bcryptjs with 10 salt rounds
- Sessions use JWT strategy with 30-day expiration
- The user store maintains backward compatibility with legacy crypto-based hashing
- User data file is stored in `data/` directory (gitignored)

## Testing Locally

1. Create a `.env.local` file:
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret-at-least-32-chars
```

2. Run the development server:
```bash
npm run dev
```

3. Test signup:
```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

4. Test signin using NextAuth's built-in signin page at:
```
http://localhost:3000/api/auth/signin
```
