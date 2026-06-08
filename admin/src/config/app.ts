// ============================================================================
// Application Configuration
// ============================================================================

export const APP_CONFIG = {
  // Application Info
  name: 'Seller Hub',
  version: '1.0.0',
  
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_ADMIN_URL || 'http://localhost:8080/api/',
    timeout: 30000, // 30 seconds
  },

  // Pagination Defaults
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
  },

  // SSE Configuration
  sse: {
    reconnectInterval: 5000, // 5 seconds
    maxReconnectAttempts: 5,
  },

  // UI Configuration
  ui: {
    sidebarWidth: 256, // px
    headerHeight: 64, // px
    animationDuration: 200, // ms
  },

  // Feature Flags
  features: {
    darkMode: true,
    realTimeNotifications: true,
    realTimeChat: true,
    videoManagement: true,
    advancedFilters: true,
  },

  // Date/Time Format
  dateFormat: {
    short: 'MMM dd, yyyy',
    long: 'MMMM dd, yyyy HH:mm:ss',
    time: 'HH:mm',
  },

  // Currency Configuration
  currency: {
    code: 'USD',
    symbol: '$',
    decimals: 2,
  },

  // Validation Rules
  validation: {
    product: {
      nameMinLength: 3,
      nameMaxLength: 200,
      descriptionMaxLength: 5000,
      minPrice: 0.01,
      maxPrice: 999999.99,
    },
    order: {
      codePattern: /^ORD-\d{4}-\d{3,}$/,
    },
    review: {
      minRating: 1,
      maxRating: 5,
      contentMaxLength: 1000,
    },
    report: {
      titleMinLength: 5,
      titleMaxLength: 100,
      descriptionMinLength: 20,
      descriptionMaxLength: 2000,
    },
  },

  // Status Colors
  statusColors: {
    product: {
      Published: 'green',
      Inactive: 'gray',
      Draft: 'yellow',
    },
    order: {
      Pending: 'yellow',
      Confirmed: 'blue',
      Shipping: 'purple',
      Completed: 'green',
      Canceled: 'red',
    },
  },

  // Error Messages
  errorMessages: {
    network: 'Network error. Please check your connection.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: 'The requested resource was not found.',
    serverError: 'Server error. Please try again later.',
    validation: 'Please check your input and try again.',
    timeout: 'Request timed out. Please try again.',
  },

  // Success Messages
  successMessages: {
    created: 'Item created successfully',
    updated: 'Item updated successfully',
    deleted: 'Item deleted successfully',
    saved: 'Changes saved successfully',
  },
};

// Helper function to get status color
export function getStatusColorClass(
  type: 'product' | 'order' | 'video' | 'report',
  status: string
): string {
  const colorMap = APP_CONFIG.statusColors[type] as Record<string, string>;
  const color = colorMap[status] || 'gray';
  
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  };

  return colorClasses[color] || colorClasses.gray;
}

// Helper function to format currency
export function formatCurrency(amount: number): string {
  const { symbol, decimals } = APP_CONFIG.currency;
  return `${symbol}${amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// Helper function to format date
export function formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleString();
    case 'time':
      return d.toLocaleTimeString();
    default:
      return d.toLocaleDateString();
  }
}

// Helper function to validate file upload
export function validateFile(file: File, type: 'image' | 'video'): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = type === 'image' 
    ? APP_CONFIG.upload.allowedImageTypes 
    : APP_CONFIG.upload.allowedVideoTypes;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > APP_CONFIG.upload.maxFileSize) {
    const maxSizeMB = APP_CONFIG.upload.maxFileSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

export default APP_CONFIG;
