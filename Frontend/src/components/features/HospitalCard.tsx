import React from 'react';
import { MapPinIcon, PhoneIcon, ClockIcon, BuildingIcon, NavigationIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
interface BloodStock {
  group: string;
  units: number;
  status: 'available' | 'low' | 'critical' | 'unavailable';
}
interface HospitalCardProps {
  id: string;
  name: string;
  location: string;
  distance: string;
  phone: string;
  isOpen: boolean;
  openHours: string;
  bloodStock: BloodStock[];
  isVerified: boolean;
  onNavigate?: (id: string) => void;
  onCall?: (id: string) => void;
}
const stockStatusColors: Record<string, string> = {
  available: 'bg-success text-white',
  low: 'bg-warning text-white',
  critical: 'bg-error text-white',
  unavailable: 'bg-gray-300 text-gray-600'
};
export function HospitalCard({
  id,
  name,
  location,
  distance,
  phone,
  isOpen,
  openHours,
  bloodStock,
  isVerified,
  onNavigate,
  onCall
}: HospitalCardProps) {
  return <Card hoverable className="relative overflow-hidden">
      {/* Status bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isOpen ? 'bg-success' : 'bg-gray-300'}`} />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <BuildingIcon className="w-6 h-6 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              {isVerified && <Badge variant="success" size="sm">
                  Verified
                </Badge>}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <MapPinIcon className="w-4 h-4" />
              <span>{location}</span>
              <span className="text-primary font-medium">• {distance}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span className={isOpen ? 'text-success font-medium' : 'text-gray-500'}>
              {isOpen ? 'Open Now' : 'Closed'}
            </span>
            <span className="text-gray-400">• {openHours}</span>
          </div>
        </div>

        {/* Blood Stock */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">
            Blood Availability
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {bloodStock.map(stock => <div key={stock.group} className={`
                  px-2 py-1.5 rounded-lg text-center text-xs font-semibold
                  ${stockStatusColors[stock.status]}
                `} title={`${stock.units} units`}>
                {stock.group}
              </div>)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Button size="sm" variant="primary" className="flex-1" leftIcon={<NavigationIcon className="w-4 h-4" />} onClick={() => onNavigate?.(id)}>
            Directions
          </Button>
          <Button size="sm" variant="outline" leftIcon={<PhoneIcon className="w-4 h-4" />} onClick={() => onCall?.(id)}>
            {phone}
          </Button>
        </div>
      </div>
    </Card>;
}