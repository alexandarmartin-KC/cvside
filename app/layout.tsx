import './globals.css';

export const metadata = {
  title: 'CVSide - Upload & Match Your CV',
  description: 'Upload your CV and get AI-powered job matching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
