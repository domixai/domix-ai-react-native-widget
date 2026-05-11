import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeHelper = {
  getCookie: async () => {
    const cookie = await AsyncStorage.getItem('cwCookie');
    return cookie;
  },
  storeCookie: async (value) => {
    await AsyncStorage.setItem('cwCookie', value);
  },
  removeCookie: async () => {
    await AsyncStorage.removeItem('cwCookie');
  },
  clearAll: async () => {
    await AsyncStorage.removeItem('cwCookie');
    // Add any other keys we might store in the future
  },
};

export const isWithinWorkingHours = (config) => {
  if (!config?.working_hours_enabled || !config?.working_hours) {
    return true;
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
  // Domix working_hours index: 0 is Monday, 6 is Sunday
  // JS getDay(): 0 is Sunday, 1 is Monday...
  const domixDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const dayConfig = config.working_hours[domixDayIndex];
  if (!dayConfig || !dayConfig.active) {
    return false;
  }

  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Example format: "09:00"
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const startTime = parseTime(dayConfig.open_at);
  const endTime = parseTime(dayConfig.close_at);

  return currentTimeMinutes >= startTime && currentTimeMinutes <= endTime;
};

export const isArabic = (text) => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
};
