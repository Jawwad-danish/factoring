export const loadNumberCleanup = (input: string): string => {
  let loadNumber = input.replace(/load/gi, '');
  loadNumber = loadNumber.replace(/ref/gi, '');
  loadNumber = loadNumber.replace(/pro/gi, '');
  loadNumber = loadNumber.replace(/trip/gi, '');
  loadNumber = loadNumber.replace(/number/gi, '');
  loadNumber = loadNumber.replace(/#/gi, '');
  loadNumber = loadNumber.replace(/-/gi, '');
  return loadNumber;
};
