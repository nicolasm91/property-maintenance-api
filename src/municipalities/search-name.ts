// Must match how the catalog migration computed municipalities.search_name.
export const toSearchName = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
