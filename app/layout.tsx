import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '打烊前，還有一位客人 | The Rainlit Café', description: '雨還沒停，店裡的燈卻還亮著。一段關於等待、告別與母親的單人敘事故事。' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="zh-Hant"><body>{children}</body></html>; }
