// src/pages/_app.js
import '@/styles/globals.css';
import { SessionProvider } from 'next-auth/react';

const MyApp = ({ Component, pageProps }) => {
	return (
		<SessionProvider session={pageProps.session}>
			<Component {...pageProps} />
		</SessionProvider>
	);
};

export default MyApp;
