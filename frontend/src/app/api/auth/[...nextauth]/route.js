/**
 * NextAuth.js Configuration (Optional)
 * This file is for future integration with NextAuth.js
 * Currently, the app uses custom JWT authentication
 * 
 * To enable NextAuth.js:
 * 1. npm install next-auth
 * 2. Configure providers below
 * 3. Update login/register pages to use NextAuth
 */

// import NextAuth from 'next-auth';
// import CredentialsProvider from 'next-auth/providers/credentials';

// const handler = NextAuth({
//   providers: [
//     CredentialsProvider({
//       name: 'Credentials',
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         try {
//           const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               email: credentials.email,
//               password: credentials.password
//             })
//           });

//           const data = await res.json();

//           if (res.ok && data.user) {
//             return {
//               id: data.user.id,
//               email: data.user.email,
//               name: data.user.username,
//               token: data.token
//             };
//           }

//           return null;
//         } catch (error) {
//           console.error('Auth error:', error);
//           return null;
//         }
//       }
//     })
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.accessToken = user.token;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (token) {
//         session.user.id = token.id;
//         session.accessToken = token.accessToken;
//       }
//       return session;
//     }
//   },
//   pages: {
//     signIn: '/login',
//     error: '/login',
//   },
//   session: {
//     strategy: 'jwt',
//     maxAge: 7 * 24 * 60 * 60, // 7 days
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// });

// export { handler as GET, handler as POST };

/**
 * Placeholder for NextAuth.js
 * Remove this comment block and uncomment the code above when ready to use NextAuth
 */

export async function GET(req) {
  return new Response(
    JSON.stringify({ 
      message: 'NextAuth not configured. Using custom JWT authentication.' 
    }), 
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function POST(req) {
  return new Response(
    JSON.stringify({ 
      message: 'NextAuth not configured. Using custom JWT authentication.' 
    }), 
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}