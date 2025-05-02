import puppeteer from 'puppeteer';

export async function connectBrowser() {
	const token = process.env.BROWSERLESS_API_KEY;
	if (!token) {
		throw new Error('Missing BROWSERLESS_API_KEY in .env');
	}
	return await puppeteer.connect({
		browserWSEndpoint: `wss://production-sfo.browserless.io?token=${token}`,
	});
}
