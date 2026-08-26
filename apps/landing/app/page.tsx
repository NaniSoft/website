import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { Problem } from '@/components/Problem';
import { Platform } from '@/components/Platform';
import { ArchitectureSection } from '@/components/ArchitectureSection';
import { UseCases } from '@/components/UseCases';
import { Integrations } from '@/components/Integrations';
import { FinalCTA } from '@/components/FinalCTA';

export default function Page() {
  return (
    <>
      <a href="#main">Skip to main content</a>
      <TopNav />
      <main id="main">
        <Hero />
        <Problem />
        <Platform />
        {/* Interactive pipeline walkthrough — Platform's copy hands off into this section. */}
        <ArchitectureSection />
        <UseCases />
        <Integrations />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
