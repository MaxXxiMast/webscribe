import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import NextAuth from 'next-auth';
// import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';

const prisma = new PrismaClient();

export const authOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
	],
	secret: process.env.NEXTAUTH_SECRET,
	session: { strategy: 'database' },
};

export default NextAuth(authOptions);
