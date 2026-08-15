// Draws the tip jar footer. The wording, the link and the icon all come from
// core/, so this file only decides how they land in the popup.

import { supportLink, SUPPORT_REASON, SUPPORT_LABEL } from '../core/support.js';
import { ICON_BOX, ICONS } from '../core/icons.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Built element by element rather than from a markup string, so nothing here
// trips the extension's content security policy.
function iconElement(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', ICON_BOX);
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', ICONS[name]);
  svg.append(path);
  return svg;
}

/** Fills an empty footer with the reason line and the link. Draws nothing for
 *  a surface core/support.js does not know. */
export function mountSupportFooter(host, surface) {
  const href = supportLink(surface);
  if (!host || !href) return;

  const reason = document.createElement('p');
  reason.textContent = SUPPORT_REASON;

  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.append(iconElement('heart'), SUPPORT_LABEL);

  host.replaceChildren(reason, link);
}
