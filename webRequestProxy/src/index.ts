/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return handleRequest(request)
	}
}

const handleRequest = async (request: Request): Promise<Response> => {
	console.log(request.url)
	const url = new URL(request.url)
	console.log(url.searchParams.get('url'))
	const targetUrl = url.searchParams.get('url')

	const headersArray: { name: string, value: string }[] = JSON.parse(url.searchParams.get('headers') || '[]') ?? [];

	const headers = new Headers();
	headersArray.forEach(({ name, value }) => {
		headers.set(name, value);
		console.log('key:', name, 'value:', value);
	});

	// Extract method and init options for the fetch request
	const method = request.method
	const init: RequestInit = {
		method,
		headers
	}

	if (!targetUrl) {
		return new Response('Missing target URL', { status: 400 })
	}

	try {
		const response = await fetch(targetUrl, init)
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers
		})
	} catch (error) {
		return new Response(`Error fetching the requested URL. ${targetUrl} ${headers}`, { status: 500 })
	}
}
