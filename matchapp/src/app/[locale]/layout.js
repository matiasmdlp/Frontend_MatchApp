import '../globals.css'
import { AuthProvider } from '../../context/AuthContext'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Navbar from '../../components/Navbar'; 

export const metadata = { title: 'SportMatch Web', description: 'Buscador de partidos' }

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="bg-gray-100 text-gray-900 flex flex-col min-h-screen">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <Navbar /> 
            <main className="flex-1">
              {children}
            </main>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}