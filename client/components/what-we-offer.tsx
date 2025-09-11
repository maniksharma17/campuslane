import { UserPlus, BookOpen, Trophy, Users, BarChart3, Shield, Heart, Link, Eye, ShoppingCart, Bell, FilePlus, UserCheck, TrendingUp, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const studentOffers = [
  {
    icon: UserPlus,
    title: 'Premium Learning Access',
    description:
      'Get instant entry into a curated library of expert-approved lessons, games, and quizzes designed for real results.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: ShieldCheck,
    title: 'Control Your Experience',
    description:
      'Approve or reject parent requests with a single tap — your privacy and independence come first.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: TrendingUp,
    title: 'Track Your Growth',
    description:
      'Every lesson you complete, every game you play, and every quiz you ace is tracked — so you can see your progress in real time.',
    color: 'bg-blue-100 text-blue-600',
  },
];

const teacherOffers = [
  {
    icon: UserCheck,
    title: 'Verified Teacher Accounts',
    description:
      'Only approved educators get access — ensuring a trusted community of teachers committed to quality learning.',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: FilePlus,
    title: 'Professional Content Tools',
    description:
      'Easily upload and share worksheets, PDFs, quizzes, and videos — every resource is reviewed for excellence.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description:
      'Get notified when your account is verified and when your content is live — no waiting in the dark.',
    color: 'bg-green-100 text-green-600',
  },
];

const parentOffers = [
  {
    icon: Link,
    title: 'Seamless Child Linking',
    description:
      'Connect with your child’s account securely — requests are approved directly by students for peace of mind.',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Eye,
    title: 'Full Progress Insights',
    description:
      'See exactly what your child is learning, how they’re performing, and where they need more practice.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: ShoppingCart,
    title: 'Curated Learning Store',
    description:
      'Get access to hand-picked books, stationery, and digital tools designed to complement your child’s learning journey.',
    color: 'bg-orange-100 text-orange-600',
  },
];


function SectionLayout({
  heading,
  subheading,
  offers,
  ctaText,
  image,
  bgImage,
  bgImageMobile,
  reverse = false,
}: {
  heading: string;
  subheading: string;
  offers: any[];
  ctaText: string;
  image: string;
  bgImage: string;
  bgImageMobile: string;
  reverse?: boolean;
}) {
  return (
    <section className="border-t border-t-gray-400 relative py-20 bg-gray-50 bg-cover bg-center">
      {/* Background images */}
      <div
        className="absolute inset-0 bg-cover bg-center sm:hidden"
        style={{ backgroundImage: `url('${bgImageMobile}')` }}
      />
      <div
        className="absolute inset-0 bg-cover bg-center hidden sm:block"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      

      

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 items-center gap-12 ${
            reverse ? 'lg:flex-row-reverse' : ''
          }`}
        >
          {/* Image Side (if reversed) */}
          {reverse && (
            <div className="hidden lg:block">
              <div
                className="w-full h-[500px] bg-contain bg-no-repeat bg-center"
                style={{ backgroundImage: `url('${image}')` }}
              />
            </div>
          )}

          {/* Text + Offers */}
          <div className="relative max-w-xl">
            <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-4">
              {heading}{' '}
              <span className="bg-gradient-to-r font-semibold from-primary to-indigo-700 bg-clip-text text-transparent">
                {subheading}
              </span>
            </h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed tracking-tight">
              Our platform is built to empower {subheading.toLowerCase()} with the right tools to succeed.
            </p>

            <div className="space-y-8">
              {offers.map((offer) => (
                <div key={offer.title} className="flex items-start space-x-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${offer.color}`}
                  >
                    <offer.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      {offer.title}
                    </h3>
                    <p className="text-gray-600 tracking-tight">
                      {offer.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Button className="text-xl bg-gradient-to-b shadow-md from-primary to-indigo-800 font-normal text-white lg:p-6 lg:px-10 rounded-full hover:scale-105 duration-300 transition-all">
                {ctaText}
              </Button>
            </div>
          </div>

          {/* Image Side (if not reversed) */}
          {!reverse && (
            <div className="hidden lg:block">
              <div
                className="w-full h-[500px] bg-contain bg-no-repeat bg-center"
                style={{ backgroundImage: `url('${image}')` }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


export default function AudienceSections() {
  return (
    <>
      <SectionLayout
        heading="What We Offer For"
        subheading="Students"
        offers={studentOffers}
        ctaText="Get Started as a Student"
        image=""
        bgImage="/bg-1-new.png"
        bgImageMobile="/bg-1-mobile.png"
        reverse
      />
      <SectionLayout
        heading="Empowering"
        subheading="Teachers"
        offers={teacherOffers}
        ctaText="Join as a Teacher"
        image=""
        bgImage="/bg-2-new.png"
        bgImageMobile="/bg-2-mobile.png"
      />
      <SectionLayout
        heading="Support for"
        subheading="Parents"
        offers={parentOffers}
        ctaText="Explore Parent Tools"
        image=""
        bgImage="/bg-3-new.png"
        bgImageMobile="/bg-1-mobile.png"
        reverse
      />
    </>
  );
}
