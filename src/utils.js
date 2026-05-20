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

export const parseMarkdownLinks = (content) => {
  if (!content) {
    return [];
  }

  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      elements.push({
        type: 'text',
        text: content.substring(lastIndex, matchIndex),
      });
    }

    let linkText = match[1];
    const linkUrl = match[2];

    let isBold = false;
    if (linkText.startsWith('**') && linkText.endsWith('**')) {
      linkText = linkText.slice(2, -2);
      isBold = true;
    }

    elements.push({
      type: 'link',
      text: linkText,
      url: linkUrl,
      isBold,
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    elements.push({
      type: 'text',
      text: content.substring(lastIndex),
    });
  }

  const finalElements = [];
  const plainUrlRegex = /(https?:\/\/[^\s<>*"'()]+)/g;

  elements.forEach((el) => {
    if (el.type === 'text') {
      const parts = el.text.split(plainUrlRegex);
      parts.forEach((part) => {
        if (plainUrlRegex.test(part)) {
          finalElements.push({
            type: 'link',
            text: part,
            url: part,
            isBold: false,
          });
        } else if (part) {
          // Parse bold markdown within plain text parts
          const boldRegex = /(\*\*[^*]+\*\*)/g;
          const textParts = part.split(boldRegex);
          textParts.forEach((tPart) => {
            if (boldRegex.test(tPart)) {
              const cleanText = tPart.slice(2, -2);
              if (cleanText) {
                finalElements.push({
                  type: 'text',
                  text: cleanText,
                  isBold: true,
                });
              }
            } else if (tPart) {
              finalElements.push({
                type: 'text',
                text: tPart,
                isBold: false,
              });
            }
          });
        }
      });
    } else {
      finalElements.push(el);
    }
  });

  // Post-process to handle markdown formatting around plain links (like **url** or <url>)
  const processedElements = [];
  for (let i = 0; i < finalElements.length; i++) {
    const current = finalElements[i];

    if (current.type === 'link') {
      const prev = processedElements[processedElements.length - 1];
      const next = finalElements[i + 1];

      // Check for bold wrapper: **url**
      if (
        prev &&
        prev.type === 'text' &&
        prev.text.endsWith('**') &&
        next &&
        next.type === 'text' &&
        next.text.startsWith('**')
      ) {
        prev.text = prev.text.slice(0, -2);
        next.text = next.text.slice(2);
        current.isBold = true;
      }

      // Check for angled brackets wrapper: <url>
      if (
        prev &&
        prev.type === 'text' &&
        prev.text.endsWith('<') &&
        next &&
        next.type === 'text' &&
        next.text.startsWith('>')
      ) {
        prev.text = prev.text.slice(0, -1);
        next.text = next.text.slice(1);
      }
    }

    processedElements.push(current);
  }

  return processedElements.filter(
    (el) => el.type !== 'text' || el.text.length > 0
  );
};

export const stripMarkdown = (content) => {
  if (!content) {
    return '';
  }

  // 1. Replace markdown links [text](url) with just "text"
  let clean = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1');

  // 2. Replace angled bracket links <url> with just "url"
  clean = clean.replace(/<([^>]+)>/g, '$1');

  // 3. Remove bold indicators **
  clean = clean.replace(/\*\*/g, '');

  return clean;
};
