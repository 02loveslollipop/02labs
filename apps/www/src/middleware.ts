import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const response = await next();

    // Check if the agent is requesting markdown
    const accept = context.request.headers.get("Accept");
    if (accept && accept.includes("text/markdown")) {
        const url = new URL(context.request.url);
        
        // Simple Markdown representation for the homepage
        if (url.pathname === "/") {
            const markdown = `# 02Labs
Systems, Data, Projects, and CTF Writeups.

02Labs is the portfolio and lab of 02loveslollipop, featuring systems engineering projects, data work, security experiments, and technical writeups.

## Featured Projects
- OpenCROW: Offensive-workflow workstation bootstrap
- MiPedido: Integrated shared ordering and ahead-order management platform
- Discord GPT Chat Bot: Python Discord bot powered by OpenAI
- Bad Apple ESP32 Utilities: High-performance developer utilities
- LoRa L298N Tank Controller: End-to-end IoT tank control system

## Links
- API Catalog: /.well-known/api-catalog
- Service Doc: /docs/api
`;
            return new Response(markdown, {
                status: 200,
                headers: {
                    "Content-Type": "text/markdown",
                    "x-markdown-tokens": String(markdown.split(/\s+/).length),
                    "Content-Signal": "ai-train=yes, search=yes, ai-input=yes",
                    "Link": '<' + '/.well-known/api-catalog>; rel="api-catalog", <' + '/docs/api>; rel="service-doc"'
                }
            });
        }
        
        // Generic markdown response for other pages
        const markdown = `# ${url.pathname}\n\nContent available in HTML.`;
        return new Response(markdown, {
            status: 200,
            headers: {
                "Content-Type": "text/markdown",
                "x-markdown-tokens": String(markdown.split(/\s+/).length),
                "Content-Signal": "ai-train=yes, search=yes, ai-input=yes"
            }
        });
    }

    return response;
});
