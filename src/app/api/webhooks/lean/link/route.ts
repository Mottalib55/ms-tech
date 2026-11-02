import { NextResponse } from 'next/server';
import lean from '@/connectors/lean/client';
import { sealOk } from '@/connectors/signing';
import { requestLocale, translate } from '@/server/i18n';

// Lean's consent only runs in its JS SDK, so this is the page we redirect to.
// Everything on the URL is sealed by initiateConnection; the customer token is
// minted here and never travels in a URL.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const customerId = url.searchParams.get('customer_id') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const back = url.searchParams.get('return') ?? '';
  if (!sealOk(`lean-link|${customerId}|${state}|${back}`, url.searchParams.get('sig') ?? undefined)) {
    return NextResponse.json({ error: await translate('errors.validation.linkInvalid') }, { status: 400 });
  }
  const locale = await requestLocale();
  const { success, failure } = lean.returnUrls(customerId, state, back);
  const config = {
    app_token: process.env.LEAN_APP_TOKEN,
    customer_id: customerId,
    access_token: await lean.token(`customer.${customerId}`),
    permissions: ['identity', 'accounts', 'balance', 'transactions'],
    sandbox: lean.isSandbox,
    language: locale === 'ar' ? 'ar' : 'en',
    // VERIFY: the two URLs must be whitelisted in Lean's dashboard, query string included or not.
    success_redirect_url: success,
    fail_redirect_url: failure,
  };
  // "<" escaped so a value can never close the script tag.
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  const failureJson = JSON.stringify(failure).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${await translate('server.leanLink.title', undefined, locale)}</title>
<style>:root{color-scheme:light dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:Canvas;color:CanvasText;font:15px system-ui}</style>
<script src="https://cdn.leantech.me/link/loader/prod/ae/latest/lean-link-loader.min.js"></script></head>
<body><p>${await translate('server.leanLink.opening', undefined, locale)}</p><div id="lean-link"></div>
<script>
var failure=${failureJson};
window.addEventListener('load',function(){
  if(!window.Lean){location.href=failure;return;}
  var c=${json};
  c.callback=function(r){var s=r&&r.status;if(s==='SUCCESS'){location.href=c.success_redirect_url;}else if(s&&s!=='SUCCESS'){location.href=failure;}};
  Lean.connect(c);
});
</script></body></html>`;
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
