import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { COMPANY, lastUpdate } from './company';
import Contact from './Contact';

type Block = { h?: string; p?: string; li?: string[]; slot?: string };

/** A legal text is a list of blocks in messages/<locale>/legal.json: heading, paragraph, bullets or a slot. */
export default async function LegalDoc({ locale, doc, slots }: { locale: string; doc: string; slots?: Record<string, ReactNode> }) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  const blocks = t.raw(`${doc}.blocks`) as Block[];
  const rich = (key: string) => t.rich(`${doc}.blocks.${key}`, {
    name: COMPANY.name,
    b: (c) => <strong>{c}</strong>,
    contact: () => <Contact locale={locale} />,
  });
  return (
    <>
      <h1>{t(`${doc}.title`)}</h1>
      <p className="text-sm text-subtle">{t('lastUpdate', { date: lastUpdate(locale) })}</p>
      {blocks.map((block, i) => {
        if (block.h) return <h2 key={i}>{rich(`${i}.h`)}</h2>;
        if (block.p) return <p key={i}>{rich(`${i}.p`)}</p>;
        if (block.li) return <ul key={i}>{block.li.map((_, j) => <li key={j}>{rich(`${i}.li.${j}`)}</li>)}</ul>;
        return <div key={i}>{slots?.[block.slot ?? '']}</div>;
      })}
    </>
  );
}
