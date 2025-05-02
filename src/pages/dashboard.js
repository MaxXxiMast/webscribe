// src/pages/dashboard.jsx

import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export async function getServerSideProps(ctx) {
	const session = await getSession(ctx);
	if (!session) {
		return {
			redirect: {
				destination: '/api/auth/signin',
				permanent: false,
			},
		};
	}

	const records = await prisma.pdfRecord.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: 'desc' },
	});

	return {
		props: {
			records: records.map((r) => ({
				...r,
				createdAt: r.createdAt.toISOString(),
			})),
		},
	};
}

export default function Dashboard({ records }) {
	return (
		<div className="p-6 max-w-5xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Your PDF History</h1>
			{records.length === 0 ? (
				<p>No PDFs generated yet.</p>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Date
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									URL
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Preview
								</th>
								<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
									Download
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{records.map((r) => (
								<tr key={r.id}>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{new Date(r.createdAt).toLocaleString()}
									</td>
									<td className="px-6 py-4 break-all text-sm">
										<a
											href={r.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 hover:underline"
										>
											{r.url}
										</a>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<object
											data={r.path}
											type="application/pdf"
											width="100%"
											height="150px"
											className="border rounded"
										>
											<p className="text-sm text-gray-500">Preview not available.</p>
										</object>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-center">
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
		</div>
	);
}
