export const COMMON_TIMEZONES = [
  { value: 'auto', label: 'Auto (Local Timezone)', offset: '' },
  // UTC-10 to UTC-5
  { value: 'Pacific/Honolulu', label: 'Honolulu', offset: 'UTC-10' },
  { value: 'America/Anchorage', label: 'Anchorage', offset: 'UTC-8' },
  { value: 'America/Juneau', label: 'Juneau', offset: 'UTC-8' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', offset: 'UTC-7' },
  { value: 'America/Phoenix', label: 'Phoenix', offset: 'UTC-7' },
  { value: 'America/Vancouver', label: 'Vancouver', offset: 'UTC-7' },
  { value: 'America/Denver', label: 'Denver', offset: 'UTC-6' },
  { value: 'America/Mexico_City', label: 'Mexico City', offset: 'UTC-6' },
  { value: 'America/El_Salvador', label: 'San Salvador', offset: 'UTC-6' },
  { value: 'America/Bogota', label: 'Bogota', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Chicago', offset: 'UTC-5' },
  { value: 'America/Lima', label: 'Lima', offset: 'UTC-5' },
  // UTC-4 to UTC-3
  { value: 'America/Caracas', label: 'Caracas', offset: 'UTC-4' },
  { value: 'America/New_York', label: 'New York', offset: 'UTC-4' },
  { value: 'America/Toronto', label: 'Toronto', offset: 'UTC-4' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC-3' },
  { value: 'America/Santiago', label: 'Santiago', offset: 'UTC-3' },
  { value: 'America/Sao_Paulo', label: 'Sao Paulo', offset: 'UTC-3' },
  // UTC
  { value: 'Atlantic/Azores', label: 'Azores', offset: 'UTC' },
  { value: 'Atlantic/Reykjavik', label: 'Reykjavik', offset: 'UTC' },
  // UTC+1
  { value: 'Africa/Casablanca', label: 'Casablanca', offset: 'UTC+1' },
  { value: 'Europe/Dublin', label: 'Dublin', offset: 'UTC+1' },
  { value: 'Africa/Lagos', label: 'Lagos', offset: 'UTC+1' },
  { value: 'Europe/Lisbon', label: 'Lisbon', offset: 'UTC+1' },
  { value: 'Europe/London', label: 'London', offset: 'UTC+1' },
  { value: 'Africa/Tunis', label: 'Tunis', offset: 'UTC+1' },
  // UTC+2
  { value: 'Europe/Amsterdam', label: 'Amsterdam', offset: 'UTC+2' },
  { value: 'Europe/Belgrade', label: 'Belgrade', offset: 'UTC+2' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: 'UTC+2' },
  { value: 'Europe/Bratislava', label: 'Bratislava', offset: 'UTC+2' },
  { value: 'Europe/Brussels', label: 'Brussels', offset: 'UTC+2' },
  { value: 'Europe/Budapest', label: 'Budapest', offset: 'UTC+2' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen', offset: 'UTC+2' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', offset: 'UTC+2' },
  { value: 'Europe/Luxembourg', label: 'Luxembourg', offset: 'UTC+2' },
  { value: 'Europe/Madrid', label: 'Madrid', offset: 'UTC+2' },
  { value: 'Europe/Malta', label: 'Malta', offset: 'UTC+2' },
  { value: 'Europe/Oslo', label: 'Oslo', offset: 'UTC+2' },
  { value: 'Europe/Paris', label: 'Paris', offset: 'UTC+2' },
  { value: 'Europe/Prague', label: 'Prague', offset: 'UTC+2' },
  { value: 'Europe/Rome', label: 'Rome', offset: 'UTC+2' },
  { value: 'Europe/Stockholm', label: 'Stockholm', offset: 'UTC+2' },
  { value: 'Europe/Vienna', label: 'Vienna', offset: 'UTC+2' },
  { value: 'Europe/Warsaw', label: 'Warsaw', offset: 'UTC+2' },
  { value: 'Europe/Zurich', label: 'Zurich', offset: 'UTC+2' },
  // UTC+3
  { value: 'Europe/Athens', label: 'Athens', offset: 'UTC+3' },
  { value: 'Asia/Bahrain', label: 'Bahrain', offset: 'UTC+3' },
  { value: 'Europe/Bucharest', label: 'Bucharest', offset: 'UTC+3' },
  { value: 'Africa/Cairo', label: 'Cairo', offset: 'UTC+3' },
  { value: 'Europe/Helsinki', label: 'Helsinki', offset: 'UTC+3' },
  { value: 'Europe/Istanbul', label: 'Istanbul', offset: 'UTC+3' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem', offset: 'UTC+3' },
  { value: 'Asia/Kuwait', label: 'Kuwait', offset: 'UTC+3' },
  { value: 'Europe/Moscow', label: 'Moscow', offset: 'UTC+3' },
  { value: 'Africa/Nairobi', label: 'Nairobi', offset: 'UTC+3' },
  { value: 'Asia/Nicosia', label: 'Nicosia', offset: 'UTC+3' },
  { value: 'Asia/Qatar', label: 'Qatar', offset: 'UTC+3' },
  { value: 'Europe/Riga', label: 'Riga', offset: 'UTC+3' },
  { value: 'Asia/Riyadh', label: 'Riyadh', offset: 'UTC+3' },
  { value: 'Europe/Tallinn', label: 'Tallinn', offset: 'UTC+3' },
  { value: 'Europe/Vilnius', label: 'Vilnius', offset: 'UTC+3' },
  // UTC+3:30 to UTC+4
  { value: 'Asia/Tehran', label: 'Tehran', offset: 'UTC+3:30' },
  { value: 'Asia/Dubai', label: 'Dubai', offset: 'UTC+4' },
  { value: 'Asia/Muscat', label: 'Muscat', offset: 'UTC+4' },
  // UTC+5 to UTC+5:30
  { value: 'Asia/Ashgabat', label: 'Ashgabat', offset: 'UTC+5' },
  { value: 'Asia/Almaty', label: 'Astana', offset: 'UTC+5' },
  { value: 'Asia/Karachi', label: 'Karachi', offset: 'UTC+5' },
  { value: 'Asia/Colombo', label: 'Colombo', offset: 'UTC+5:30' },
  { value: 'Asia/Kolkata', label: 'Kolkata', offset: 'UTC+5:30' },
  // UTC+5:45 to UTC+6:30
  { value: 'Asia/Kathmandu', label: 'Kathmandu', offset: 'UTC+5:45' },
  { value: 'Asia/Dhaka', label: 'Dhaka', offset: 'UTC+6' },
  { value: 'Asia/Yangon', label: 'Yangon', offset: 'UTC+6:30' },
  // UTC+7
  { value: 'Asia/Bangkok', label: 'Bangkok', offset: 'UTC+7' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh', offset: 'UTC+7' },
  { value: 'Asia/Jakarta', label: 'Jakarta', offset: 'UTC+7' },
  // UTC+8
  { value: 'Asia/Chongqing', label: 'Chongqing', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: 'UTC+8' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur', offset: 'UTC+8' },
  { value: 'Asia/Manila', label: 'Manila', offset: 'UTC+8' },
  { value: 'Australia/Perth', label: 'Perth', offset: 'UTC+8' },
  { value: 'Asia/Shanghai', label: 'Shanghai', offset: 'UTC+8' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+8' },
  { value: 'Asia/Taipei', label: 'Taipei', offset: 'UTC+8' },
  // UTC+9 to UTC+9:30
  { value: 'Asia/Seoul', label: 'Seoul', offset: 'UTC+9' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: 'UTC+9' },
  { value: 'Australia/Adelaide', label: 'Adelaide', offset: 'UTC+9:30' },
  // UTC+10 to UTC+13
  { value: 'Australia/Brisbane', label: 'Brisbane', offset: 'UTC+10' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: 'UTC+10' },
  { value: 'Pacific/Norfolk', label: 'Norfolk Island', offset: 'UTC+11' },
  { value: 'Pacific/Auckland', label: 'New Zealand', offset: 'UTC+12' },
  { value: 'Pacific/Chatham', label: 'Chatham Islands', offset: 'UTC+12:45' },
  { value: 'Pacific/Fakaofo', label: 'Tokelau', offset: 'UTC+13' },
];

export const getLocalTimezone = () => {
  try {
    // Try to get the browser's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      return timezone;
    }
  } catch (error) {
    console.error('Error detecting local timezone:', error);
  }
  // Fallback to UTC if detection fails
  return 'Etc/UTC';
};

export const getUserTimezone = (userPreferences) => {
  // Check if user has a preference set
  if (userPreferences && userPreferences.chart_timezone) {
    const preference = userPreferences.chart_timezone;
    
    // If preference is 'auto', return the detected local timezone
    if (preference === 'auto') {
      return getLocalTimezone();
    }
    
    // Otherwise return the user's chosen timezone
    return preference;
  }
  
  // Default to auto (local timezone)
  return getLocalTimezone();
};

// Get timezone abbreviation for display in tooltips
export const getTimezoneAbbreviation = (timezone) => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((part) => part.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error);
    return '';
  }
};