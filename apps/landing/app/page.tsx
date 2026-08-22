import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { LogoCloud } from '@/components/LogoCloud';
import { Problem } from '@/components/Problem';
import { Platform } from '@/components/Platform';
import { Agents } from '@/components/Agents';
import { UseCases } from '@/components/UseCases';
import { Integrations } from '@/components/Integrations';
import { Testimonial } from '@/components/Testimonial';
import { FinalCTA } from '@/components/FinalCTA';
import KnowledgeGraphLazy from '@/components/KnowledgeGraphLazy';

export default function Page() {
  return (
    <>
      <a href="#main" style={{ position: 'absolute', left: -9999 }}>Skip to main content</a>
      <TopNav />
      <main id="main">
        <Hero />
        <LogoCloud />
        <Problem />
        <Platform />
        <KnowledgeGraphLazy />
        <Agents />
        <UseCases />
        <Integrations />
        <Testimonial />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
