import L from "leaflet";

// Brand-blue teardrop pin (DESIGN.md — #009EDB is the non-text accent blue).
// Rendered as SVG so it stays crisp on retina screens and adapts to dark mode
// via the white stroke, unlike Leaflet's default bitmap icon.
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" aria-hidden="true" focusable="false" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))"><path d="M14 1.5C7.1 1.5 1.5 7.1 1.5 14c0 9.6 12.5 20.2 12.5 20.2S26.5 23.6 26.5 14C26.5 7.1 20.9 1.5 14 1.5z" fill="#009EDB" stroke="#ffffff" stroke-width="1.5"/><circle cx="14" cy="13.5" r="4" fill="#ffffff"/></svg>`;

export function createPinIcon(): L.DivIcon {
  return L.divIcon({
    html: PIN_SVG,
    className: "rac-map-pin",
    iconSize: [28, 36],
    iconAnchor: [14, 33],
    popupAnchor: [0, -30],
  });
}
