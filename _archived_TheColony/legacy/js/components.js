// Loads HTML partials into placeholder elements
// Usage: <div data-component="header"></div>
//
// The placeholder is replaced in-place by parsing the fetched HTML into
// a DocumentFragment, then swapping the placeholder out via replaceWith().
// This avoids issues with outerHTML re-parsing inline <script> tags and
// keeps the DOM consistent before any other init() runs.

async function loadComponent(el) {
  const name = el.dataset.component;
  if (!name) return;
  const url = `/components/${name}.html`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    const html = await res.text();

    const template = document.createElement('template');
    template.innerHTML = html.trim();
    el.replaceWith(template.content);
  } catch (err) {
    console.error('[components] load failed:', err);
    el.innerHTML = `<!-- Failed to load ${name} -->`;
  }
}

export async function loadComponents() {
  const placeholders = document.querySelectorAll('[data-component]');
  await Promise.all([...placeholders].map(loadComponent));
}
