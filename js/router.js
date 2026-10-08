// Hash router. GitHub Pages has no fallback for unknown paths, so every route
// lives after the "#": a refresh or a shared link always loads index.html.
//
//   #/                                   dashboard
//   #/c/<category>                       subject
//   #/c/<category>/m/<mode-id>           study mode (Revision, Quick Revision)
//   #/c/<category>/<subcategory>         module
//   #/t/<topic-id>[/<tab>]               topic (tab: examples, practice, interview-questions, revision, flashcards)
//   #/session/<kind>/topic/<topic-id>    focused practice / interview / flashcards
//   #/session/<kind>/module/<cat>/<sub>
//   #/session/<kind>/subject/<cat>
//     (+ ?level=easy,medium keeps only questions of those difficulties)
//   #/plans                              study plans dashboard
//   #/plans/builtin/<plan-id>/<level>    built-in plan at one difficulty
//   #/plans/new[?from=<plan-id>/<level>] custom plan builder
//   #/plans/p/<record-id>[/edit]         one of your plans · edit it
//   #/notes[?q=…&subject=…&module=…&topic=…&date=…&from=…&to=…&sort=…]   My notes
//   #/notes/<note-id>                    one note
//   #/search?q=…   #/bookmarks   #/history   #/lab
//
// Query parameter `s` scrolls to a heading id inside the page (in-page anchors
// can't use a plain "#id" because the hash already holds the route).

export function parse(hash = window.location.hash) {
  const raw = hash.replace(/^#/, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean).map((s) => {
    try { return decodeURIComponent(s); } catch { return s; }
  });
  return { segments, query: new URLSearchParams(queryPart), path: `/${segments.join('/')}` };
}

/** Build an href: href(['t', 'binary-search'], { s: 'dry-run' }) → "#/t/binary-search?s=dry-run". */
export function href(segments, query) {
  const path = segments.map((s) => encodeURIComponent(s)).join('/');
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  }
  const q = params.toString();
  return `#/${path}${q ? `?${q}` : ''}`;
}

export function navigate(hashHref, { replace = false } = {}) {
  if (replace) {
    window.history.replaceState(null, '', hashHref);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hashHref.replace(/^#/, '');
  }
}

export function start(onRoute) {
  let previous = null;
  const handle = () => {
    const route = parse();
    // Only the in-page anchor changed: scroll, don't re-render.
    const sameView = previous && previous.path === route.path
      && sameQueryExcept(previous.query, route.query, 's');
    onRoute(route, { sameView });
    previous = route;
  };
  window.addEventListener('hashchange', handle);
  handle();
}

function sameQueryExcept(a, b, ignored) {
  const strip = (q) => [...q.entries()].filter(([k]) => k !== ignored).sort().join('&');
  return strip(a) === strip(b);
}
