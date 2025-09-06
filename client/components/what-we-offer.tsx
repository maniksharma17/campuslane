import { UserPlus, BookOpen, Trophy, Users, BarChart3, Shield, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const studentOffers = [
  {
    icon: UserPlus,
    title: 'Personalized Profiles',
    description: 'Each student gets a tailored experience based on grade level and learning pace. Parents can manage multiple children easily.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: BookOpen,
    title: 'Interactive Learning',
    description: 'Engaging lessons, quizzes, and videos designed to make complex concepts simple and fun to explore.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Trophy,
    title: 'Achievements & Rewards',
    description: 'Students earn badges, certificates, and milestones to keep them motivated and celebrate progress.',
    color: 'bg-red-100 text-red-600',
  },
];

const teacherOffers = [
  {
    icon: BookOpen,
    title: 'Curriculum-Aligned Tools',
    description: 'High-quality content aligned with educational standards to make lesson planning seamless.',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'Track Class Progress',
    description: 'Monitor student performance in real-time with detailed reports and insights.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Built with safety in mind, ensuring a secure environment for teachers and students alike.',
    color: 'bg-green-100 text-green-600',
  },
];

const parentOffers = [
  {
    icon: Users,
    title: 'Stay Involved',
    description: 'Get updates on your child’s progress and milestones instantly.',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Heart,
    title: 'Encourage Growth',
    description: 'Celebrate achievements with badges and certificates that keep kids motivated.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: BarChart3,
    title: 'Insightful Reports',
    description: 'Understand strengths and areas for improvement with easy-to-read analytics.',
    color: 'bg-purple-100 text-purple-600',
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
    <section
      className="border-t border-t-gray-400 relative py-20 bg-gray-50 bg-cover bg-center"
    >
      {/* Background layers */}
      <div
        className="absolute inset-0 bg-cover bg-center sm:hidden"
        style={{ backgroundImage: `url('${bgImageMobile}')` }}
      />
      <div
        className="absolute inset-0 bg-cover bg-center hidden sm:block"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      <div
        className="absolute inset-0 bg-cover bg-center sm:hidden bg-white/50"
      />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 items-center gap-12 ${
            reverse ? 'lg:flex-row-reverse' : ''
          }`}
        >
          {/* Image Side */}
          {reverse && (
            <div className="hidden lg:block">
              <div
                className="w-full h-[500px] bg-contain bg-no-repeat bg-center"
                style={{ backgroundImage: `url('${image}')` }}
              ></div>
            </div>
          )}

          {/* Text + Offers */}
          <div className="relative max-w-xl">
            <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-4">
              {heading}{' '}
              <span className="bg-gradient-to-r font-semibold from-indigo-500 to-indigo-700 bg-clip-text text-transparent">
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
                    <p className="text-gray-600 tracking-tight">{offer.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Button className="text-xl bg-gradient-to-b shadow-md from-indigo-500 to-indigo-700 font-normal text-white lg:p-6 lg:px-10 rounded-full hover:scale-105 duration-300 transition-all">
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
              ></div>
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
        image="/student.png"
        bgImage="/bg-1.png"
        bgImageMobile="/bg-1-mobile.png"
      />
      <SectionLayout
        heading="Empowering"
        subheading="Teachers"
        offers={teacherOffers}
        ctaText="Join as a Teacher"
        image="/teacher.png"
        bgImage="/bg-2.png"
        bgImageMobile="/bg-2-mobile.png"
        reverse
      />
      <SectionLayout
        heading="Support for"
        subheading="Parents"
        offers={parentOffers}
        ctaText="Explore Parent Tools"
        image="/parent.png"
        bgImage="/bg-3.png"
        bgImageMobile="/bg-1-mobile.png"
      />
    </>
  );
}
