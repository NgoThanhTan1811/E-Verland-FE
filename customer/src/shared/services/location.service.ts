import provincesJson from "../../public/locations/provinces.json";
import districtsJson from "../../public/locations/districts.json";
import wardsJson from "../../public/locations/wards.json";

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

const STORAGE_KEY = "everland_locations_v1";

const bundledLocations: LocationData = {
  provinces: provincesJson as Province[],
  districts: districtsJson as District[],
  wards: wardsJson as Ward[],
};

const isBrowser = () => typeof window !== "undefined";

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const filterByQuery = <T extends { name: string }>(
  items: T[],
  keyword: string,
  limit = 20,
) => {
  const normalized = normalizeText(keyword);
  if (!normalized) return items.slice(0, limit);

  return items
    .filter((item) => normalizeText(item.name).includes(normalized))
    .slice(0, limit);
};

const saveToStorage = (data: LocationData) => {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota and privacy mode errors.
  }
};

const readFromStorage = (): LocationData | null => {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LocationData>;
    if (
      Array.isArray(parsed.provinces) &&
      Array.isArray(parsed.districts) &&
      Array.isArray(parsed.wards)
    ) {
      return {
        provinces: parsed.provinces as Province[],
        districts: parsed.districts as District[],
        wards: parsed.wards as Ward[],
      };
    }
  } catch {
    // Ignore parse errors and fallback to network.
  }

  return null;
};

let inMemoryCache: LocationData | null = null;
let loadingPromise: Promise<LocationData> | null = null;

const fetchLocations = async (): Promise<LocationData> => {
  return bundledLocations;
};

export const locationService = {
  loadLocationData: async (): Promise<LocationData> => {
    if (inMemoryCache) return inMemoryCache;

    const stored = readFromStorage();
    if (stored) {
      inMemoryCache = stored;
      return stored;
    }

    if (!loadingPromise) {
      loadingPromise = fetchLocations()
        .then((data) => {
          inMemoryCache = data;
          saveToStorage(data);
          return data;
        })
        .finally(() => {
          loadingPromise = null;
        });
    }

    return loadingPromise;
  },

  searchProvinces: (data: LocationData, keyword: string, limit = 20) =>
    filterByQuery(data.provinces, keyword, limit),

  searchDistricts: (
    data: LocationData,
    provinceId: number,
    keyword: string,
    limit = 20,
  ) => {
    const districts = data.districts.filter(
      (district) => district.provinceId === provinceId,
    );
    return filterByQuery(districts, keyword, limit);
  },

  searchWards: (
    data: LocationData,
    provinceId: number,
    districtId: number,
    keyword: string,
    limit = 20,
  ) => {
    const wards = data.wards.filter(
      (ward) =>
        ward.provinceId === provinceId && ward.districtId === districtId,
    );
    return filterByQuery(wards, keyword, limit);
  },
};
