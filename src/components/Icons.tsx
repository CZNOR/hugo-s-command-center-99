// Icônes au trait, dans l'esprit Hugeicons de la charte MADE
const P = ({ children }: { children: React.ReactNode }) => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);

export const IcCalendar = () => <P><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></P>;
export const IcSun = () => <P><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></P>;
export const IcCopy = () => <P><rect x="8" y="8" width="12" height="12" rx="3" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></P>;
export const IcLink = () => <P><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1" /><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" /></P>;
export const IcCheck = () => <P><path d="m5 12.5 4.5 4.5L19 7.5" /></P>;
export const IcVideo = () => <P><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10.5 5-3v9l-5-3" /></P>;
export const IcPhone = () => <P><path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4z" /></P>;
export const IcBell = () => <P><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></P>;
