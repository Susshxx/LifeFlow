import React from 'react';
import { QuoteIcon, StarIcon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
interface TestimonialCardProps {
  name: string;
  role: 'donor' | 'recipient';
  location: string;
  content: string;
  avatar?: string;
  rating?: number;
  date?: string;
}
export function TestimonialCard({
  name,
  role,
  location,
  content,
  avatar,
  rating = 5,
  date
}: TestimonialCardProps) {
  return <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 relative">
      {/* Quote icon */}
      <div className="absolute top-4 right-4 text-primary/10">
        <QuoteIcon className="w-12 h-12" />
      </div>

      {/* Rating */}
      {rating > 0 && <div className="flex gap-0.5 mb-4">
          {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-4 h-4 ${i < rating ? 'text-warning fill-warning' : 'text-gray-200'}`} />)}
        </div>}

      {/* Content */}
      <p className="text-gray-600 leading-relaxed mb-6 relative z-10">
        "{content}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <Avatar name={name} src={avatar} size="md" />
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">
            {role === 'donor' ? 'Blood Donor' : 'Blood Recipient'} • {location}
          </p>
        </div>
      </div>

      {date && <p className="text-xs text-gray-400 mt-4">{date}</p>}
    </div>;
}