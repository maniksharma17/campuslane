import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Parent of 4th grader',
    content: 'My daughter actually asks to do her lessons now! The platform makes learning so engaging and I love being able to track her progress.',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5
  },
  {
    name: 'Mrs. Johnson',
    role: '3rd Grade Teacher',
    content: 'LearnJoy has transformed my classroom! The curriculum alignment and student engagement tools are exactly what I needed.',
    avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5
  },
  {
    name: 'Emma, Age 9',
    role: '4th Grade Student',
    content: 'I love earning badges and the games are so fun! Math used to be hard but now it\'s my favorite subject!',
    avatar: 'https://images.pexels.com/photos/1547043/pexels-photo-1547043.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            What{' '}
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Families Say
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Hear from the students, parents, and teachers who are already part of our learning community.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.name} className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-200 group">
              <CardContent className="p-8">
                {/* Quote Icon */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-3 rounded-full shadow-md">
                    <Quote className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-600 text-center leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </p>

                {/* Avatar and Info */}
                <div className="flex items-center justify-center space-x-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full border-3 border-white shadow-md"
                  />
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}