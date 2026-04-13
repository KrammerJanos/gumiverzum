import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Gumiverzum - Prémium Gumiszerviz',
  description: 'Professzionális Gumiszerviz: Gyorsaság, Precizitás, Biztonság az utakon.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="hu">
      <head>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body className="carbon-fiber">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
