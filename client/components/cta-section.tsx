import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-green-300 rounded-full"></div>
        <div className="absolute bottom-20 left-32 w-24 h-24 bg-pink-300 rounded-full"></div>
        <div className="absolute bottom-32 right-10 w-12 h-12 bg-cyan-300 rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Sparkle Icon */}
        <div className="inline-flex p-4 rounded-full bg-white/20 backdrop-blur-sm mb-8 shadow-xl">
          <Sparkles className="h-10 w-10 text-white" />
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
          Ready to Start Your{' '}
          <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
            Learning Adventure?
          </span>
        </h2>

        {/* Subtext */}
        <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
          Join over 15,000 students already learning and having fun! 
          Start your free trial today - no credit card required.
        </p>

        {/* Features List */}
        <div className="flex flex-wrap justify-center gap-6 mb-10 text-white">
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="font-medium">Free 30-day trial</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            <span className="font-medium">No credit card needed</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
            <span className="font-medium">Cancel anytime</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-8 py-3 text-lg rounded-xl shadow-lg min-w-[220px] font-semibold">
            Start Free Trial
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
          
          <Button variant="outline" className="border-white border-2 text-white hover:bg-white hover:text-purple-600 px-8 py-3 text-lg rounded-xl shadow-lg min-w-[220px] backdrop-blur-sm font-semibold">
            Schedule Demo
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-blue-200 text-sm mb-4">Trusted by schools and families worldwide</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-white font-bold text-lg">15,000+ Students</div>
            <div className="h-6 w-px bg-white/30"></div>
            <div className="text-white font-bold text-lg">500+ Teachers</div>
            <div className="h-6 w-px bg-white/30"></div>
            <div className="text-white font-bold text-lg">50+ Schools</div>
          </div>
        </div>
      </div>
    </section>
  );
}