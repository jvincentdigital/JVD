import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import Services from '@/components/Services';
import Work from '@/components/Work';
import LocalBusiness from '@/components/LocalBusiness';
import Pricing from '@/components/Pricing';
import AccessibilitySection from '@/components/AccessibilitySection';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent-dark focus:px-4 focus:py-2 focus:text-white focus:outline-none'
      >
        Skip to content
      </a>
      <Nav />
      <main id='main-content'>
        <Hero />
        <TrustBar />
        <Services />
        <Work />
        <LocalBusiness />
        <Pricing />
        <AccessibilitySection />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
