export const stringify = (value: any): string => {
  return JSON.stringify(value, null, 4);
};

export const safeJsonParse = <T = any>(value: string): T | null => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse JSON:', { value, error: error.message });
    return null;
  }
};
