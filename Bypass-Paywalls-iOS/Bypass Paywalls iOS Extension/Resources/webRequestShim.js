const listeners = {};
const addListener = (type, listener) => {
  if (!listeners[type]) {
    listeners[type] = [];
  }
  listeners[type].push(listener);
}

const removeListener = (type, listener) => {
  if (!listeners[type]) {
    return;
  }
  const index = listeners[type].indexOf(listener);
  if (index !== -1) {
    listeners[type].splice(index, 1);
  }
}

webRequestShim = {
  onBeforeRequest: {
    addListener: (args) => addListener('onBeforeRequest', args),
    removeListener: (args) => removeListener('onBeforeRequest', args)
  },
  onBeforeSendHeaders: {
    addListener: (args) => addListener('onBeforeSendHeaders', args),
    removeListener: (args) => removeListener('onBeforeSendHeaders', args)
  },
  onHeadersReceived: {
    addListener: (args) => addListener('onHeadersReceived', args),
    removeListener: (args) => removeListener('onHeadersReceived', args)
  },
  OnBeforeSendHeadersOptions: {
    hasOwnProperty: (args) => false
  },
}

const setupWebRequestShim = (ext_api) => {
  ext_api.webRequest = webRequestShim

  ext_api.management = {
    getSelf: () => { }
  }
}

const handleUnproxiedPage = (target, tabId) => {
  const details = {
    requestHeaders: [],
    responseHeaders: [],
    url: target
  }

  const requiredHeaders = listeners['onBeforeSendHeaders']?.flatMap(listenerCallback => {
    const result = listenerCallback(details);
    if (!result) {
      return []
    }
    return result.requestHeaders;
  });

  const requiredRedirect = listeners['onBeforeRequest']?.map(listenerCallback => {
    const result = listenerCallback(details);
    if (!result) {
      return undefined;
    }
    if (!result.redirectUrl || result.redirectUrl === undefined) {
      return undefined;
    }
    return result.redirectUrl;
  }).filter(hasValue => hasValue).reverse();

  console.log(requiredRedirect, requiredHeaders)
  // TODO: restore functionality
  // if (listeners['onHeadersReceived']) {
  //   listeners['onHeadersReceived'].forEach(listener => console.log(listener(details)));
  // }

  if (requiredRedirect.length === 0) {
    return;
  }

  const url = new URL(target);
  url.hostname = PROXY_URL;

  const searchParams = new URLSearchParams(url.search);
  searchParams.set('url', requiredRedirect[0]);
  searchParams.set('headers', JSON.stringify(requiredHeaders));
  url.search = searchParams;
  url.pathname = '';

  browser.tabs.update(tabId, {
    loadReplace: true,
    url: url.href,
  });
}


const PROXY_URL = 'webrequestproxy.workerify.workers.dev';
// Catch requests to pages that require a proxy
browser.tabs.onUpdated.addListener(async (tabId) => {
  const currentTab = await browser.tabs.getCurrent();
  const target = currentTab.pendingUrl || currentTab.url;

  if (!target || currentTab.status !== 'loading') {
    return;
  }

  const currentUrl = new URL(target);
  if (currentUrl.hostname === PROXY_URL) {
    return;
  }

  handleUnproxiedPage(target, tabId);
});

// Rewwrite links on proxied pages
browser.tabs.onUpdated.addListener(async (tabId) => {
  const currentTab = await browser.tabs.getCurrent();
  const target = currentTab.pendingUrl || currentTab.url;

  if (!target || currentTab.status !== 'complete') {
    return;
  }

  const currentUrl = new URL(target);
  if (currentUrl.hostname !== PROXY_URL) {
    return;
  }

  browser.tabs.executeScript(tabId, {
    file: 'proxiedPageContentScript.js',
  });

  browser.tabs.executeScript(tabId, {
    code: `rewritePageLinks("${currentUrl.href}", "${PROXY_URL}")`
  });
});
