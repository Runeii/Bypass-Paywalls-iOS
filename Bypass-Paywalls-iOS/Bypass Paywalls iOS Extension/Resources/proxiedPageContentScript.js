const rewriteLink = (key, link, originalUrl, proxiedUrl) => {
  const rawHref = link.getAttribute(key);

  // Ignore anchors to current page
  if (rawHref.startsWith('#')) {
    return;
  }

  try {
    const hrefWithHostname = rawHref.startsWith('/') ? `${originalUrl.origin}${rawHref}` : rawHref;
    const href = new URL(hrefWithHostname);
    proxiedUrl.searchParams.set('url', href.href);

    link.setAttribute(key, proxiedUrl.href);
  } catch (e) {
    return;
  }
}

const rewritePageLinks = (currentUrl, PROXY_URL) => {
  const proxiedUrl = new URL(currentUrl);
  const originalUrl = new URL(proxiedUrl.searchParams.get('url'));

  document.querySelectorAll('[src]').forEach(link => rewriteLink('src', link, originalUrl, proxiedUrl));
  document.querySelectorAll('[href]').forEach(link => rewriteLink('href', link, originalUrl, proxiedUrl));
}