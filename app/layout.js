export const metadata = {
  title: 'NovaHunt',
  description: 'Find and verify business contacts',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
