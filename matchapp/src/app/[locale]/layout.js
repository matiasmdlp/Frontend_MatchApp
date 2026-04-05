import '../globals.css'
import { AuthProvider } from '../../context/AuthContext'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export const metadata = {
  title: 'SportMatch Web',
  description: 'Buscador de partidos deportivos',
}

export default async function RootLayout({ children, params }) {
  
  const { locale } = await params;

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="bg-gray-100 text-gray-900">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}