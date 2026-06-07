import provincesData from '../public/locations/provinces.json';
import districtsData from '../public/locations/districts.json';
import wardsData from '../public/locations/wards.json';

export interface Province {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
  provinceId: number;
}

export interface Ward {
  id: number;
  name: string;
  districtId: number;
  provinceId: number;
}

export interface LocationData {
  provinces: Province[];
  districts: District[];
  wards: Ward[];
}

const inMemoryCache: LocationData = {
  provinces: provincesData as Province[],
  districts: districtsData as District[],
  wards: wardsData as Ward[],
};

export const locationService = {
  getLocationDataSync: (): LocationData => inMemoryCache,

  getProvinceName: (provinceId: number): string => {
    return inMemoryCache.provinces.find((p) => p.id === provinceId)?.name || "";
  },

  getDistrictName: (districtId: number): string => {
    return inMemoryCache.districts.find((d) => d.id === districtId)?.name || "";
  },

  getWardName: (wardId: number): string => {
    return inMemoryCache.wards.find((w) => w.id === wardId)?.name || "";
  },
};
