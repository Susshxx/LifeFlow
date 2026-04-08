import React from 'react';
import { CalendarIcon, MapPinIcon, ClockIcon, UsersIcon, BuildingIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
interface CampCardProps {
  id: string;
  title: string;
  organizer: string;
  date: string;
  time: string;
  location: string;
  address: string;
  registeredCount: number;
  maxCapacity: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  onRegister?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}
const statusConfig = {
  upcoming: {
    label: 'Upcoming',
    variant: 'primary' as const
  },
  ongoing: {
    label: 'Happening Now',
    variant: 'success' as const
  },
  completed: {
    label: 'Completed',
    variant: 'default' as const
  }
};
export function CampCard({
  id,
  title,
  organizer,
  date,
  time,
  location,
  address,
  registeredCount,
  maxCapacity,
  status,
  onRegister,
  onViewDetails
}: CampCardProps) {
  const config = statusConfig[status];
  const spotsLeft = maxCapacity - registeredCount;
  const isFull = spotsLeft <= 0;
  return <Card hoverable className="relative overflow-hidden">
      {/* Status indicator */}
      {status === 'ongoing' && <div className="absolute top-0 left-0 right-0 h-1 bg-success animate-pulse" />}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant={config.variant} size="sm" dot={status === 'ongoing'}>
              {config.label}
            </Badge>
            <h3 className="font-semibold text-gray-900 mt-2">{title}</h3>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Organizer */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <BuildingIcon className="w-4 h-4 text-gray-400" />
          <span>
            Organized by <span className="font-medium">{organizer}</span>
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span>{time}</span>
          </div>
          <div className="flex items-start gap-2 text-gray-600">
            <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">{location}</p>
              <p className="text-gray-500">{address}</p>
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {registeredCount} registered
              </span>
            </div>
            <span className={`font-medium ${isFull ? 'text-error' : 'text-success'}`}>
              {isFull ? 'Full' : `${spotsLeft} spots left`}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${isFull ? 'bg-error' : 'bg-success'}`} style={{
            width: `${registeredCount / maxCapacity * 100}%`
          }} />
          </div>
        </div>

        {/* Actions */}
        {status !== 'completed' && <div className="flex gap-2 pt-2">
            <Button size="sm" variant={isFull ? 'outline' : 'primary'} className="flex-1" disabled={isFull} onClick={() => onRegister?.(id)}>
              {isFull ? 'Join Waitlist' : 'Register Now'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onViewDetails?.(id)}>
              Details
            </Button>
          </div>}
      </div>
    </Card>;
}