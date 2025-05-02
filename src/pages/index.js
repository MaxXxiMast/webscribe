import PDFGenerator from '@/components/PDFGenerator';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { authOptions } from './api/auth/[...nextauth]';

const prisma = new PrismaClient();

export async function getServerSideProps(ctx) {
	// 1) Ensure the user is signed in
	const session = await getServerSession(ctx.req, ctx.res, authOptions);
	if (!session) {
		return {
			redirect: { destination: '/api/auth/signin', permanent: false },
		};
	}

	// 2) Look up user by their email
	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});
	if (!user) {
		return {
			redirect: { destination: '/api/auth/signin', permanent: false },
		};
	}

	// 3) Fetch the user's PDF records
	const records = await prisma.pdfRecord.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: 'desc' },
	});

	// 4) Serialize Date objects to strings
	const serialized = records.map((r) => ({
		id: r.id,
		url: r.url,
		path: r.path,
		createdAt: r.createdAt.toISOString(),
		updatedAt: r.updatedAt.toISOString(),
	}));

	return {
		props: {
			session,
			records: serialized,
		},
	};
}

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

const Home = ({ session, records }) => {
	return (
		<div
			className={`${geistSans.className} ${geistMono.className} items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
		>
			<main className="p-6 max-w-5xl mx-auto space-y-8">
				<section className="flex items-center space-x-4">
					{session.user.image && (
						<img src={session.user.image} alt={session.user.name} className="w-12 h-12 rounded-full" />
					)}
					<div>
						<p className="text-lg font-semibold">{session.user.name || 'Anonymous'}</p>
						<p className="text-sm text-gray-600">{session.user.email}</p>
						<Link href="/api/auth/signout" className="text-xs text-blue-600 hover:underline">
							Sign out
						</Link>
					</div>
				</section>

				{/* PDF Generator UI */}
				<section className="mt-5">
					<h1 className="text-2xl font-bold mb-4">Generate PDF</h1>
					<PDFGenerator />
				</section>

				{/* Previous PDFs Table */}
				<section className="mt-5">
					<h2 className="text-xl font-semibold mb-4">Your Previous PDFs</h2>
					{records.length === 0 ? (
						<p>{`You haven't generated any PDFs yet.`}</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
											Date
										</th>
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
											URL
										</th>
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
											Preview
										</th>
										<th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
											Download
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{records.map((r) => (
										<tr key={r.id}>
											<td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
												{new Date(r.createdAt).toLocaleString()}
											</td>
											<td className="px-4 py-2 text-sm break-all">
												<a
													href={r.url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:underline"
												>
													{r.url}
												</a>
											</td>
											<td className="px-4 py-2 whitespace-nowrap">
												<object
													data={r.path}
													type="application/pdf"
													width="100%"
													height="120px"
													className="border rounded"
												>
													<p className="text-sm text-gray-500">Preview not available.</p>
												</object>
											</td>
											<td className="px-4 py-2 text-center whitespace-nowrap">
												<a href={r.path} download className="text-blue-600 hover:underline">
													Download
												</a>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
			</main>
		</div>
	);
};

export default Home;
