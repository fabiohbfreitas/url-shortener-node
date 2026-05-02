const BASE62_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const SLUG_LENGTH = 6;

export const generateSlug = (): string => {
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * BASE62_CHARS.length);
    slug += BASE62_CHARS[randomIndex];
  }
  return slug;
};

export const generateUniqueSlug = (existsFn: (slug: string) => boolean): string => {
  let slug = generateSlug();
  let attempts = 0;
  const MAX_ATTEMPTS = 100;

  while (existsFn(slug) && attempts < MAX_ATTEMPTS) {
    slug = generateSlug();
    attempts++;
  }

  if (attempts >= MAX_ATTEMPTS) {
    throw new Error("Failed to generate unique slug after maximum attempts");
  }

  return slug;
};
