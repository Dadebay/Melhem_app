// Banner / link routing.
//
// Banners (and any other in-app links) carry a path that the admin fills in.
// There is no public website yet, so the canonical contract is a bare path:
//
//     /drug/:id        → product page
//     /category/:id    → filtered drugs list
//     /pharmacy/:id    → pharmacy page
//
// For robustness we also accept the same path written as a full web URL on one
// of our hosts (https://melhem.app/drug/123) or via the app scheme
// (melhem://drug/123) — all three resolve through the same PATTERNS.
//
// Anything we can't map to a screen but that is a real openable URL (foreign
// host, http link, tel:, mailto:) falls back to the system browser/handler, so
// a link never dead-ends. To support a new shape, add a PATTERNS entry — that's
// the only place that needs to change.

import {Linking} from 'react-native';

const APP_SCHEME = 'melhem';

// Hosts we own — used only when a full http(s) URL is provided.
const KNOWN_HOSTS = new Set([
  'melhem.app',
  'www.melhem.app',
  'm.melhem.app',
  'dev.melhem.app',
]);

// An in-app destination: a HomeStack screen name + its params.
export type InternalTarget = {
  screen: keyof Nav.Home;
  params?: object;
};

export type ResolvedLink =
  | {kind: 'internal'; target: InternalTarget}
  | {kind: 'external'; url: string};

// Path → screen mapping. `segments` are the path parts (no leading slash),
// already URL-decoded. Return an InternalTarget to handle it, or null to skip.
const PATTERNS: Array<
  (segments: string[], query: URLSearchParams) => InternalTarget | null
> = [
  // /drug/:id  (aliases: /product/:id, /p/:id) → product page
  seg =>
    /^(drug|product|p)$/i.test(seg[0]) && seg[1]
      ? {screen: 'Drug', params: {id: seg[1]}}
      : null,

  // /category/:id  (alias: /c/:id) → filtered drugs list
  (seg, query) =>
    /^(category|c)$/i.test(seg[0]) && seg[1]
      ? {
          screen: 'Drugs',
          params: {
            queries: {category_id: seg[1]},
            title: query.get('title') ?? '',
          },
        }
      : null,

  // /pharmacy/:id → pharmacy page
  seg =>
    /^pharmacy$/i.test(seg[0]) && seg[1]
      ? {screen: 'Pharmacy', params: {id: seg[1]}}
      : null,
];

type Parsed = {
  segments: string[];
  query: URLSearchParams;
  trusted: boolean; // points at our app/host → eligible for in-app routing
  openable: boolean; // a real URL the OS can open if we don't handle it
};

const toSegments = (path: string): string[] =>
  path
    .split('/')
    .filter(Boolean)
    .map(s => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });

const splitQuery = (s: string): [string, URLSearchParams] => {
  const [path, qs = ''] = s.split('?');
  return [path.split('#')[0], new URLSearchParams(qs.split('#')[0])];
};

// Parse without relying on a full URL polyfill (Hermes support is partial).
const parse = (raw: string): Parsed | null => {
  const input = raw.trim();

  const scheme = input.match(/^([a-z][a-z0-9+.-]*):\/\/(.*)$/i);
  if (scheme) {
    const proto = scheme[1].toLowerCase();
    const rest = scheme[2];

    if (proto === 'http' || proto === 'https') {
      const m = rest.match(/^([^/?#]+)([^?#]*)(?:\?([^#]*))?/);
      if (!m)
        return {
          segments: [],
          query: new URLSearchParams(),
          trusted: false,
          openable: true,
        };
      const host = m[1].toLowerCase().replace(/:\d+$/, '');
      return {
        segments: toSegments(m[2] || ''),
        query: new URLSearchParams(m[3] ?? ''),
        trusted: KNOWN_HOSTS.has(host),
        openable: true,
      };
    }

    if (proto === APP_SCHEME) {
      const [path, query] = splitQuery(rest);
      return {
        segments: toSegments(path),
        query,
        trusted: true,
        openable: false,
      };
    }

    // tel:, mailto:, geo:, … — let the OS handle it.
    return {
      segments: [],
      query: new URLSearchParams(),
      trusted: false,
      openable: true,
    };
  }

  // Bare path: /drug/123 or drug/123
  if (/^\/?[a-z0-9]/i.test(input)) {
    const [path, query] = splitQuery(input);
    return {segments: toSegments(path), query, trusted: true, openable: false};
  }

  return null;
};

/**
 * Map a URL/path to an in-app destination, or mark it as external.
 * Returns null for empty/unusable input (caller should no-op).
 */
export const resolveDeepLink = (
  url: string | null | undefined,
): ResolvedLink | null => {
  if (!url || !url.trim()) return null;

  const parsed = parse(url);
  if (!parsed) return null;

  if (parsed.trusted) {
    for (const matcher of PATTERNS) {
      const target = matcher(parsed.segments, parsed.query);
      if (target) return {kind: 'internal', target};
    }
  }

  // Not handled in-app: open externally only if it's a real openable URL.
  // A bare path / app-scheme link we don't recognize has nowhere to go → no-op.
  return parsed.openable ? {kind: 'external', url} : null;
};

/**
 * Resolve a URL and act on it: navigate in-app for known destinations,
 * otherwise open the system browser. `navigate` is the screen's navigation.navigate.
 */
export const openLink = (
  url: string | null | undefined,
  navigate: (screen: keyof Nav.Home, params?: object) => void,
): void => {
  const resolved = resolveDeepLink(url);
  if (!resolved) return;
  if (resolved.kind === 'internal') {
    navigate(resolved.target.screen, resolved.target.params);
  } else {
    Linking.openURL(resolved.url).catch(() => {});
  }
};
