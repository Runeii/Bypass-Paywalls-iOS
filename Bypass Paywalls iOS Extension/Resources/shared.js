const isDomainMatch = (domains, hostname = window.location.hostname) => {
    const PROXY_URL = new URL('https://googlebot.workerify.workers.dev/');

    if (hostname === PROXY_URL.hostname) {
        const rawUrl = new URL(window.location.href);
        const realUrl = new URL(rawUrl.pathname.substring(1));
        hostname = realUrl.hostname
    }

    if (typeof domains === 'string') {
        domains = [domains];
    }

    const matchedDomain = domains.find(
        domain => (hostname === domain || hostname.endsWith('.' + domain))
    );

    return matchedDomain || false;
}

const isSupportedSite = test => {
    return true;
}
