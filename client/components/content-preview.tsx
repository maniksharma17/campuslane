import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Play, CheckCircle, Star, Clock, Users } from 'lucide-react';

const contentTypes = [
  {
    type: 'PDF Lesson',
    title: 'Ocean Adventures',
    subject: 'Science',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    image: 'https://images.pexels.com/photos/544966/pexels-photo-544966.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '15 min read',
    difficulty: 'Grade 3'
  },
  {
    type: 'Video Lesson',
    title: 'Fun with Fractions',
    subject: 'Math',
    icon: Play,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    image: 'https://images.pexels.com/photos/6238020/pexels-photo-6238020.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '12 min watch',
    difficulty: 'Grade 4'
  },
  {
    type: 'Interactive Quiz',
    title: 'Story Elements',
    subject: 'English',
    icon: CheckCircle,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    image: 'https://images.pexels.com/photos/8613308/pexels-photo-8613308.jpeg?auto=compress&cs=tinysrgb&w=400',
    duration: '10 questions',
    difficulty: 'Grade 5'
  }
];

export default function ContentPreview() {
  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Explore Our{' '}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Learning Content
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From interactive PDFs to engaging videos and fun quizzes - discover the variety of 
            content that makes learning exciting and effective.
          </p>
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {contentTypes.map((content, index) => (
            <Card key={content.title} className="group hover:shadow-lg transition-shadow duration-200 border-0 overflow-hidden bg-white">
              <div className="relative">
                <img 
                  src={content.image} 
                  alt={content.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className={`absolute top-4 left-4 inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${content.color} text-white text-sm font-medium shadow-lg`}>
                  <content.icon className="mr-2 h-4 w-4" />
                  {content.type}
                </div>
                <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-gray-700">
                    <Clock className="h-3 w-3" />
                    <span>{content.duration}</span>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    {content.subject}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">{content.difficulty}</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                  {content.title}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-500 ml-2">(4.9)</span>
                  </div>
                  <Button 
                    size="sm" 
                    className={`bg-gradient-to-r ${content.color} hover:shadow-md text-white rounded-lg px-4`}
                  >
                    Start Learning
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                2,500+
              </div>
              <div className="text-gray-600 font-medium">Interactive Lessons</div>
            </div>
            <div className="group">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                15,000+
              </div>
              <div className="text-gray-600 font-medium">Happy Students</div>
            </div>
            <div className="group">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                500+
              </div>
              <div className="text-gray-600 font-medium">Expert Teachers</div>
            </div>
            <div className="group">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                99%
              </div>
              <div className="text-gray-600 font-medium">Parent Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}