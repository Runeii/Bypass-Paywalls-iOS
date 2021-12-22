(() => {
	const rawUrl = new URL(window.location.href);
	const realUrl = new URL(rawUrl.pathname.substring(1));

	document.querySelectorAll('a').forEach(el => {
		const target = el.getAttribute("href");
		if (target[0] === '/') {
			realUrl.pathname = target;
			el.href = realUrl;
		}
	})
})();
