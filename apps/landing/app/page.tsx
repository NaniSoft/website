import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { Problem } from '@/components/Problem';
import { Platform } from '@/components/Platform';
import { UseCases } from '@/components/UseCases';
import { Integrations } from '@/components/Integrations';
import { FinalCTA } from '@/components/FinalCTA';

export default function Page() {
  return (
    <>
      <a href="#main" style={{ position: 'absolute', left: -9999 }}>Skip to main content</a>
      <TopNav />
      <main id="main">
        <Hero />
        <Problem />
        <Platform />
        <UseCases />
        <Integrations />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
