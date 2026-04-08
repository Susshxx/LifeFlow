import React, { useState } from 'react';
import { SearchIcon, MapPinIcon, DropletIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  variant?: 'default' | 'compact' | 'homepage';
  className?: string;
}
interface SearchFilters {
  bloodGroup: string;
  province?: string;
  district?: string;
  distance?: string;
  contentType?: string;
}
const bloodGroups = [
  { value: '', label: 'All Blood Groups' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
];

const distanceOptions = [
  { value: '', label: 'Any Distance' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
];

const contentTypeOptions = [
  { value: '', label: 'All Content' },
  { value: 'users', label: 'Users' },
  { value: 'hospitals', label: 'Hospitals' },
  { value: 'blood-requests', label: 'Blood Requests' },
  { value: 'emergency-requests', label: 'Emergency Requests' },
  { value: 'blood-camps', label: 'Blood Camps' },
];
const provinces = [
  { value: '', label: 'All Provinces' },
  { value: 'province-1', label: 'Province 1' },
  { value: 'madhesh', label: 'Madhesh Province' },
  { value: 'bagmati', label: 'Bagmati Province' },
  { value: 'gandaki', label: 'Gandaki Province' },
  { value: 'lumbini', label: 'Lumbini Province' },
  { value: 'karnali', label: 'Karnali Province' },
  { value: 'sudurpashchim', label: 'Sudurpashchim Province' }
];
const districtsByProvince: Record<string, {
  value: string;
  label: string;
}[]> = {
  bagmati: [{
    value: 'kathmandu',
    label: 'Kathmandu'
  }, {
    value: 'lalitpur',
    label: 'Lalitpur'
  }, {
    value: 'bhaktapur',
    label: 'Bhaktapur'
  }, {
    value: 'kavrepalanchok',
    label: 'Kavrepalanchok'
  }],
  gandaki: [{
    value: 'kaski',
    label: 'Kaski'
  }, {
    value: 'tanahu',
    label: 'Tanahu'
  }, {
    value: 'syangja',
    label: 'Syangja'
  }],
  'province-1': [{
    value: 'jhapa',
    label: 'Jhapa'
  }, {
    value: 'morang',
    label: 'Morang'
  }, {
    value: 'sunsari',
    label: 'Sunsari'
  }]
};
export function SearchBar({
  onSearch,
  variant = 'default',
  className = ''
}: SearchBarProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    bloodGroup: '',
    province: '',
    district: '',
    distance: '',
    contentType: ''
  });
  const handleProvinceChange = (province: string) => {
    setFilters({
      ...filters,
      province,
      district: ''
    });
  };
  const handleSearch = () => {
    onSearch(filters);
  };
  const districts = filters.province ? districtsByProvince[filters.province] || [] : [];
  if (variant === 'compact') {
    return <div className={`flex flex-wrap gap-2 ${className}`}>
        <Select options={bloodGroups} placeholder="Blood Group" value={filters.bloodGroup} onChange={e => setFilters({
        ...filters,
        bloodGroup: e.target.value
      })} size="sm" className="w-32" />
        <Select options={provinces} placeholder="Province" value={filters.province} onChange={e => handleProvinceChange(e.target.value)} size="sm" className="w-40" />
        <Button size="sm" onClick={handleSearch} leftIcon={<SearchIcon className="w-4 h-4" />}>
          Search
        </Button>
      </div>;
  }

  // Homepage variant - uses blood group, distance, and content type filters
  if (variant === 'homepage') {
    return <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select 
          label="Blood Group" 
          options={bloodGroups} 
          value={filters.bloodGroup} 
          onChange={e => setFilters({ ...filters, bloodGroup: e.target.value })} 
        />
        <Select 
          label="Distance" 
          options={distanceOptions} 
          value={filters.distance || ''} 
          onChange={e => setFilters({ ...filters, distance: e.target.value })} 
        />
        <Select 
          label="Filter By Type" 
          options={contentTypeOptions} 
          value={filters.contentType || ''} 
          onChange={e => setFilters({ ...filters, contentType: e.target.value })} 
        />
        <div className="flex items-end">
          <Button fullWidth size="lg" onClick={handleSearch} leftIcon={<SearchIcon className="w-5 h-5" />}>
            Search Now
          </Button>
        </div>
      </div>
    </div>;
  }

  // Default variant - uses province and district filters
  return <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select label="Blood Group" options={bloodGroups} value={filters.bloodGroup} onChange={e => setFilters({
        ...filters,
        bloodGroup: e.target.value
      })} />
        <Select label="Province" options={provinces} value={filters.province} onChange={e => handleProvinceChange(e.target.value)} />
        <Select label="District" options={districts} placeholder="Select district" value={filters.district} onChange={e => setFilters({
        ...filters,
        district: e.target.value
      })} disabled={!filters.province} />
        <div className="flex items-end">
          <Button fullWidth size="lg" onClick={handleSearch} leftIcon={<SearchIcon className="w-5 h-5" />}>
            Search Now
          </Button>
        </div>
      </div>
    </div>;
}