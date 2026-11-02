import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { COMPANY } from '../company';
import LegalDoc from '../LegalDoc';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('mentions.title') };
}

export default async function MentionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'legal.mentions.rows' });
  const rows: [string, string][] = [
    ['legalForm', COMPANY.legalForm],
    ['capital', COMPANY.capital],
    ['registration', COMPANY.registration],
    ['vat', COMPANY.vat],
    ['address', COMPANY.address],
    ['director', COMPANY.director],
  ];
  const company = (
    <>
      <p><strong>{COMPANY.name}</strong></p>
      <ul>{rows.filter(([, v]) => v).map(([k, v]) => <li key={k}>{t('row', { label: t(k), value: v })}</li>)}</ul>
    </>
  );
  return <LegalDoc locale={locale} doc="mentions" slots={{ company }} />;
}
