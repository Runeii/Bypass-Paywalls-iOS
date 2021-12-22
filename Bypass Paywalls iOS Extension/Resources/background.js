// On navigate
browser.tabs.onUpdated.addListener(async (tabId) => {
	const currentTab = await browser.tabs.getCurrent();
	const target = currentTab.pendingUrl || currentTab.url;

    if (!isSupportedSite(target) || currentTab.status !== 'loading') {
		return;
	}

	const needsGoogleBot = USE_GOOGLEBOT_SITES.some(item => target.includes(item));

	if (needsGoogleBot && !target.includes(PROXY_URL.hostname)) {
		browser.tabs.update(tabId, {
			loadReplace: true,
			url: `${PROXY_URL.href}${target}`
		});

		return;
	}

	if (needsGoogleBot) {
        console.log('Injecting google bot')
        browser.tabs.executeScript(tabId, {
			file: 'googlebot.js',
			runAt: 'document_start'
		});
	}

    console.log('Injecting contentScript');
    browser.tabs.executeScript(tabId, {
        file: 'shared.js',
        runAt: 'document_start'
    });
    browser.tabs.executeScript(tabId, {
		file: 'content.js',
		runAt: 'document_start'
	});
});

// On complete
browser.tabs.onUpdated.addListener(async (tabId) => {
    const currentTab = await browser.tabs.getCurrent();
    const target = currentTab.pendingUrl || currentTab.url;

    if (!isSupportedSite(target) || currentTab.status !== 'completed') {
        return;
    }

    for (const domain of REMOVE_COOKIES) {
        if (!isDomainMatch(domain)) {
            continue;
        }
        browser.cookies.getAll({ domain }, function (cookies) {
            for (const ck of cookies) {
                console.log(ck, domain);
                const cookie = {
                    url: (ck.secure ? 'https://' : 'http://') + ck.domain + ck.path,
                    name: ck.name,
                    storeId: ck.storeId
                };
                // .firstPartyDomain = undefined on Chrome (doesn't support it)
                if (ck.firstPartyDomain !== undefined) {
                    cookie.firstPartyDomain = ck.firstPartyDomain;
                }
                const cookieDomain = ck.domain;
                const rcDomain = cookieDomain.replace(/^(\.?www\.|\.)/, '');

                // hold specific cookie(s) from removeCookies domains
                if ((rcDomain in REMOVE_COOKIES_EXCEPTIONS) && REMOVE_COOKIES_EXCEPTIONS[rcDomain].includes(ck.name)) {
                    continue; // don't remove specific cookie
                }
                // drop only specific cookie(s) from removeCookies domains
                if ((rcDomain in REMOVE_COOKIES_WHITELIST) && !(REMOVE_COOKIES_WHITELIST[rcDomain].includes(ck.name))) {
                    continue; // only remove specific cookie
                }
                browser.cookies.remove(cookie);
            }
        });
    };

    const needsGoogleBot = USE_GOOGLEBOT_SITES.some(item => target.includes(item));

    if (needsGoogleBot && !target.includes(PROXY_URL.hostname)) {
        browser.tabs.update(tabId, {
            loadReplace: true,
            url: `${PROXY_URL.href}${target}`
        });

        return;
    }

    if (needsGoogleBot) {
        console.log('Injecting google bot')
        browser.tabs.executeScript(tabId, {
            file: 'googlebot.js',
            runAt: 'document_start'
        });
    }
    console.log('Injecting contentScript');
    browser.tabs.executeScript(tabId, {
        file: 'content.js',
        runAt: 'document_start'
    });
});
