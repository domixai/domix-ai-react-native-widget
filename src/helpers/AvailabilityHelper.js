/* eslint-disable */
/**
 * Helper to check if current time is within working hours
 */

/**
 * Normalizes UTC offset string to minutes
 * @param {string} utcOffset e.g. "+03:00" or "-05:30"
 * @returns {number} offset in minutes
 */
const getOffsetMinutes = (utcOffset = '+00:00') => {
  const offsetParts = utcOffset.match(/([+-])(\d{2}):(\d{2})/);
  if (!offsetParts) return 0;
  
  const sign = offsetParts[1] === '+' ? 1 : -1;
  const hours = parseInt(offsetParts[2], 10);
  const minutes = parseInt(offsetParts[3], 10);
  return sign * (hours * 60 + minutes);
};

/**
 * Returns current date/time adjusted to the inbox timezone
 * @param {string} utcOffset 
 * @returns {Date}
 */
const getInboxTime = (utcOffset) => {
  const now = new Date();
  // Get UTC time in milliseconds
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  // Apply inbox offset
  const offsetMinutes = getOffsetMinutes(utcOffset);
  return new Date(utcTime + (offsetMinutes * 60000));
};

/**
 * Checks if the current time is within the provided working hours
 * @param {Array} workingHours 
 * @param {string} utcOffset 
 * @returns {boolean}
 */
export const isInWorkingHours = (workingHours = [], utcOffset = '+00:00') => {
  if (!workingHours || workingHours.length === 0) return true;
  
  const inboxTime = getInboxTime(utcOffset);
  const dayOfWeek = inboxTime.getDay(); // 0 is Sunday, 1 is Monday...
  const currentHour = inboxTime.getHours();
  const currentMinutes = inboxTime.getMinutes();
  const totalMinutesNow = currentHour * 60 + currentMinutes;

  const todayConfig = workingHours.find(h => h.day_of_week === dayOfWeek);
  
  if (!todayConfig) return true; // If no config for today, assume open or follow global default
  if (todayConfig.closed_all_day) return false;
  if (todayConfig.open_all_day) return true;

  const openMinutes = (todayConfig.open_hour || 0) * 60 + (todayConfig.open_minutes || 0);
  const closeMinutes = (todayConfig.close_hour || 0) * 60 + (todayConfig.close_minutes || 0);

  // Handle midnight crossing (e.g. 22:00 to 06:00)
  if (closeMinutes <= openMinutes) {
    return totalMinutesNow >= openMinutes || totalMinutesNow < closeMinutes;
  }
  
  return totalMinutesNow >= openMinutes && totalMinutesNow < closeMinutes;
};

/**
 * Finds the next available working slot
 * @param {Array} workingHours 
 * @param {string} utcOffset 
 * @returns {Object|null} { dayOfWeek, openHour, openMinutes, daysDiff }
 */
export const findNextAvailableSlot = (workingHours = [], utcOffset = '+00:00') => {
  if (!workingHours || workingHours.length === 0) return null;
  
  const inboxTime = getInboxTime(utcOffset);
  const currentDay = inboxTime.getDay();
  const currentHour = inboxTime.getHours();
  const currentMinutes = inboxTime.getMinutes();
  const totalMinutesNow = currentHour * 60 + currentMinutes;

  // 1. Check if there's an opening LATER TODAY
  const todayConfig = workingHours.find(h => h.day_of_week === currentDay);
  if (todayConfig && !todayConfig.closed_all_day && !todayConfig.open_all_day) {
    const openMinutes = (todayConfig.open_hour || 0) * 60 + (todayConfig.open_minutes || 0);
    if (totalMinutesNow < openMinutes) {
      return { ...todayConfig, daysDiff: 0 };
    }
  }

  // 2. Check subsequent days
  for (let i = 1; i <= 7; i++) {
    const nextDay = (currentDay + i) % 7;
    const nextConfig = workingHours.find(h => h.day_of_week === nextDay);
    if (nextConfig && !nextConfig.closed_all_day) {
      return { ...nextConfig, daysDiff: i };
    }
  }

  return null;
};

/**
 * Determine if the inbox is currently "online" based on working hours
 * @param {Object} config 
 * @returns {boolean}
 */
export const isOnline = (config) => {
  if (!config) return true;
  const { working_hours_enabled, working_hours, utc_off_set } = config;
  
  if (!working_hours_enabled) return true;
  return isInWorkingHours(working_hours, utc_off_set);
};

/**
 * Formats the reply time or availability status text
 */
export const getReplyTimeText = (config, isOnline, nextAvailableSlot, t) => {
  if (!isOnline && nextAvailableSlot) {
    const { daysDiff, day_of_week } = nextAvailableSlot;
    if (daysDiff === 0) {
      // Same day
      const currentHour = new Date().getHours();
      const diffHours = nextAvailableSlot.open_hour - currentHour;
      if (diffHours > 0) return `${t.back_online_in} ${diffHours} ${t.typically_replies_in_a_few_hours.split(' ').pop()}`;
    } else if (daysDiff === 1) {
      return t.back_online_tomorrow;
    } else {
      const dayName = t[`day_${day_of_week}`];
      return `${t.back_online_on} ${dayName}`;
    }
  }

  const replyTime = config?.reply_time;
  switch (replyTime) {
    case 'in_a_few_minutes': return t.typically_replies_in_a_few_minutes;
    case 'in_a_few_hours': return t.typically_replies_in_a_few_hours;
    case 'in_a_day': return t.typically_replies_in_a_day;
    default: return t.typically_replies_in_a_few_minutes;
  }
};
