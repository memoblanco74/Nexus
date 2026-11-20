export const cleanPaymentLink = (raw: string): string => {
  const text = (raw || '').trim();
  if (!text) return '';
  const url = text.match(/https?:\/\/[^\s"'<>]+/i);
  if (url) return url[0];
  const domain = text.match(/^[a-z0-9.-]+\.[a-z]{2,}(\/[^\s"'<>]*)?/i);
  return domain ? `https://${domain[0]}` : '';
};
