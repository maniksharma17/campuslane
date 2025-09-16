import Navbar from '@/components/navbar';
import HeroSection from '@/components/hero-section';
import FeaturesSection from '@/components/features-section';
import HowItWorks from '@/components/what-we-offer';
import ContentPreview from '@/components/content-preview';
import Testimonials from '@/components/testimonials';
import CTASection from '@/components/cta-section';
import Footer from '@/components/footer';
import SubscriptionSection from '@/components/SubscriptionSection';
import DownloadAppPage from '@/components/DownloadAppSection';
import EcommerceSection from '@/components/ECommerce';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      
      <SubscriptionSection />
      <EcommerceSection />
      <DownloadAppPage />
    </main>
  );
}