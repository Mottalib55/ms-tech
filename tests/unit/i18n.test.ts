import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'messages');
const LOCALES = ['fr', 'en', 'ar'];
const namespaces = readdirSync(join(ROOT, 'fr')).filter((f) => f.endsWith('.json'));

type Tree = { [k: string]: string | Tree };
const load = (l: string, ns: string) => JSON.parse(readFileSync(join(ROOT, l, ns), 'utf8')) as Tree;
const flat = (t: Tree, prefix = ''): [string, string][] =>
  Object.entries(t).flatMap(([k, v]) => (typeof v === 'string' ? [[`${prefix}${k}`, v] as [string, string]] : flat(v, `${prefix}${k}.`)));
// A set: Arabic has six plural forms where French has two, so a variable can appear more often.
const variables = (s: string) => [...new Set([...s.matchAll(/\{(\w+)[,}]/g)].map((m) => m[1]))].sort();

describe('messages', () => {
  it('every language has the same files', () => {
    for (const l of LOCALES) expect(readdirSync(join(ROOT, l)).sort()).toEqual([...namespaces].sort());
  });

  for (const ns of namespaces) {
    it(`${ns}: same keys, same variables, no empty text`, () => {
      const fr = new Map(flat(load('fr', ns)));
      for (const l of ['en', 'ar']) {
        const other = new Map(flat(load(l, ns)));
        expect([...other.keys()].sort()).toEqual([...fr.keys()].sort());
        for (const [k, v] of other) {
          expect(v.trim(), `${l}/${ns}: ${k}`).not.toBe('');
          expect(variables(v), `${l}/${ns}: ${k}`).toEqual(variables(fr.get(k)!));
        }
      }
    });
  }

  it('Arabic is really Arabic: a text with words holds Arabic letters', () => {
    const missing = namespaces.flatMap((ns) => flat(load('ar', ns))
      .filter(([, v]) => /[a-zA-Z]{4,}/.test(v.replace(/\{[^}]*\}/g, '')) && !/[؀-ۿ]/.test(v))
      .filter(([, v]) => !/^(Kenz|Binance|Interactive Brokers|ETF|Powens|Lean|Salt Edge|PEA)\b/.test(v))
      // Not language: an example address, a slot in a legal page, an embedded tag.
      .filter(([k, v]) => !/emailPlaceholder$|\.slot$/.test(k) && !/^<\w+><\/\w+>\.?$/.test(v))
      .map(([k, v]) => `${ns}: ${k} = ${v.slice(0, 40)}`));
    expect(missing).toEqual([]);
  });
});
