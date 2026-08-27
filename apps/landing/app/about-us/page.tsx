import type { Metadata } from 'next';
import { AboutUs } from '@/components/AboutUs';
import { Footer } from '@/components/Footer';
import { TopNav } from '@/components/TopNav';
import { BRAND } from '@/lib/data';

export const metadata: Metadata = {
  title: 'About nanisoft — digital twin of the IT estate',
  description: `${BRAND.tagline} The team, the approach, and how to get in touch.`,
};

export default function Page() {
  return (
    <>
      <a href="#main">Skip to main content</a>
      <TopNav />
      <main id="main">
        <AboutUs />
      </main>
      <Footer />
    </>
  );
}