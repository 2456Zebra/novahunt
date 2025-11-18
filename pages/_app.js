import Header from '../components/Header';
// import '../styles/globals.css'; // uncomment if you use a global CSS file

export default function MyApp({ Component, pageProps }) {
  // Keep the header simple and predictable. Removed the capture-phase redirect hack.
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
