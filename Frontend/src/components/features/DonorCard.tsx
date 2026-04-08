import React from 'react';
import { MapPinIcon, ClockIcon, CheckCircleIcon, PhoneIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
interface DonorCardProps {
  id: string;
  name: string;
  bloodGroup: string;
  location: string;
  distance: string;
  lastDonation: string;
  isVerified: boolean;
  isAvailable: boolean;
  avatar?: string;
  onRequest?: (id: string) => void;
}
export function DonorCard({
  id,
  name,
  bloodGroup,
  location,
  distance,
  lastDonation,
  isVerified,
  isAvailable,
  avatar,
  onRequest
}: DonorCardProps) {
  return <Card hoverable className="relative overflow-hidden">
      {/* Availability indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isAvailable ? 'bg-success' : 'bg-gray-300'}`} />

      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar name={name} src={avatar} size="lg" />
          {isVerified && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center border-2 border-white">
              <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
            </div>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="primary" size="sm">
                  {bloodGroup}
                </Badge>
                <Badge variant={isAvailable ? 'success' : 'default'} size="sm" dot>
                  {isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              <span>{location}</span>
              <span className="text-primary font-medium">• {distance}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span>Last donation: {lastDonation}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button size="sm" variant={isAvailable ? 'primary' : 'outline'} disabled={!isAvailable} onClick={() => onRequest?.(id)} className="flex-1">
              Request Blood
            </Button>
            <Button size="sm" variant="ghost" leftIcon={<PhoneIcon className="w-4 h-4" />}>
              Call
            </Button>
          </div>
        </div>
      </div>
    </Card>;
}