import type { Metadata } from 'next'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import './globals.css'
import './studio.css'
import { ProductShell } from './components/platform/ProductShell'
export const metadata: Metadata = {
    title:'ISTE | Mlynq & Mentron',
    description:'One ISTE account for membership, events, projects and learning.'
}
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) {
    return <html lang="en" className="dark" suppressHydrationWarning>
        <body className="font-body antialiased" style={{fontFamily:"'Inter', sans-serif"}}>
            <ProductShell>{children}</ProductShell>
        </body>
    </html>
}
