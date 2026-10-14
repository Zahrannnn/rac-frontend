/** Program partner logos on the login brand panel (intrinsic sizes of the files in /public). */
export type PartnerLogo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  /** Optional i18n key rendered as a caption under the logo (e.g. EED's full name). */
  captionKey?: string;
};

export const PARTNER_LOGOS: readonly PartnerLogo[] = [
  { src: "/unido-logo.png", alt: "UNIDO", width: 720, height: 155, className: "h-8 sm:h-10" },
  { src: "/NOU.webp", alt: "NOU", width: 2160, height: 956, className: "h-10 sm:h-11" },
  {
    src: "/eed-logo.png",
    alt: "EED",
    width: 600,
    height: 215,
    className: "h-7 sm:h-8",
    captionKey: "auth.partner.eedName",
  },
];
