import credits from "./photo-credits.json";

export type PhotoCredit = { title: string; author: string; license: string; licenseUrl: string; source: string; page: string };
const CREDITS = credits as Record<string, PhotoCredit>;

/** Real dish photos live in /public/meals/<id>.webp (800×600, cropped to 4:3). */
export const photoSrc = (id: string) => `/meals/${id}.webp`;
export const photoCredit = (id: string): PhotoCredit | undefined => CREDITS[id];
export const allCredits = () => Object.entries(CREDITS);
