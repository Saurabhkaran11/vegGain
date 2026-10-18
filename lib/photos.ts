import credits from "./photo-credits.json";
export { photoSrc, thumbSrc } from "./photo-src";

export type PhotoCredit = { title: string; author: string; license: string; licenseUrl: string; source: string; page: string };
const CREDITS = credits as Record<string, PhotoCredit>;

export const photoCredit = (id: string): PhotoCredit | undefined => CREDITS[id];
export const allCredits = () => Object.entries(CREDITS);
