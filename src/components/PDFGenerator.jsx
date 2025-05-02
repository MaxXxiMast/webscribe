// src/components/PDFGenerator.jsx

'use client';

import { useState } from 'react';

const PDFGenerator = () => {
	const [url, setUrl] = useState('');
	const [loading, setLoading] = useState(false);
	const [pdfUrl, setPdfUrl] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setPdfUrl(null);

		try {
			const res = await fetch('/api/generate-pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url }),
			});

			if (!res.ok) {
				const err = await res.json();
				alert('Error: ' + JSON.stringify(err));
			} else {
				const blob = await res.blob();
				setPdfUrl(URL.createObjectURL(blob));
			}
		} catch (error) {
			console.error(error);
			alert('Unexpected error');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<form onSubmit={handleSubmit} className="space-y-4">
				<input
					type="url"
					placeholder="https://example.com"
					className="w-full p-2 border rounded"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					required
				/>
				<button
					type="submit"
					disabled={loading}
					className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
				>
					{loading ? 'Generating…' : 'Generate PDF'}
				</button>
			</form>

			{pdfUrl && (
				<div className="space-y-2">
					<a href={pdfUrl} download="output.pdf" className="inline-block text-blue-600 underline">
						Download PDF
					</a>

					<div className="border rounded overflow-hidden" style={{ height: '600px' }}>
						<object data={pdfUrl} type="application/pdf" width="100%" height="100%">
							<p className="p-4 text-sm text-gray-500">PDF preview not available.</p>
						</object>
					</div>
				</div>
			)}
		</div>
	);
};

export default PDFGenerator;
// This component allows users to input a URL, generate a PDF from it, and download or preview the PDF.
// It uses the Fetch API to send a POST request to the server, which handles the PDF generation.
// The PDF is then displayed in an <object> element, and a download link is provided.
