import { connectBrowser } from '@/lib/browserless';
import { GeneratePdfSchema } from '@/validation/schema';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { getServerSession } from 'next-auth/next';
import path from 'path';
import { authOptions } from './auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
	// 1) Must be signed in
	const session = await getServerSession(req, res, authOptions);
	if (!session) return res.status(401).json({ error: 'Auth required' });

	// 2) Look up user record by email
	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});
	if (!user) return res.status(401).json({ error: 'User not found' });
	const userId = user.id;

	// 3) Validate incoming JSON
	let data;
	try {
		data = GeneratePdfSchema.parse(req.body);
	} catch (err) {
		return res.status(400).json({ error: err.flatten().fieldErrors });
	}
	const { url } = data;

	// 4) Puppeteer + Browserless
	const browser = await connectBrowser();
	const page = await browser.newPage();

	// 5) Track images by network events
	const pendingImages = new Set();
	page.on('request', (req) => {
		if (req.resourceType() === 'image') pendingImages.add(req.url());
	});
	page.on('response', (res) => {
		const r = res.request();
		if (r.resourceType() === 'image') pendingImages.delete(r.url());
	});

	try {
		// 6) Load page
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

		// 7) Wait up to 30s for images
		await Promise.race([
			new Promise((resolve) => {
				const check = () => {
					if (pendingImages.size === 0) return resolve();
					setTimeout(check, 200);
				};
				check();
			}),
			new Promise((_, reject) => setTimeout(() => reject(new Error('Image-load timeout')), 30000)),
		]).catch((e) => console.warn('⚠️', e.message));

		// 8) PDF streaming
		const filename = `${userId}-${Date.now()}.pdf`;
		const outDir = path.join(process.cwd(), 'public/pdfs');
		if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

		const filePath = path.join(outDir, filename);
		const publicPath = `/pdfs/${filename}`;

		const pdfStream = await page.createPDFStream();
		const writer = fs.createWriteStream(filePath);
		const reader = pdfStream.getReader();

		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			const buf = Buffer.from(value);
			writer.write(buf);
			res.write(buf);
		}
		writer.end();
		res.end();

		// 9) Record it for this user
		await prisma.pdfRecord.create({
			data: {
				userId,
				url,
				path: publicPath,
			},
		});
	} catch (err) {
		console.error('❌ generate-pdf error:', err);
		if (!res.headersSent) res.status(500).json({ error: err.message });
	} finally {
		await browser.close();
	}
}
