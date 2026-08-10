import React from 'react';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { useChangeEvents, type ChangeEvent } from './ChangelogWidget';

// Created / Updated for the article being read, from the same git-derived
// event stream that feeds /changelog. Docusaurus ships `showLastUpdateTime`,
// but it reads git at build time, and the build host clones shallow with no
// remote — so it reports the clone window's start date, not the truth. The
// changelog plugin already solved that (full-clone snapshot committed to the
// repo, merged with whatever live git the build can see), so the dates here
// ride on a source that is correct in production.

// Docusaurus strips a `01-` style number prefix from doc ids and routes; the
// event stream keys off the raw file path. Normalize both sides before
// matching, or a numbered section never finds its own history.
const stripNumberPrefix = (s: string) => s.replace(/^\d+-(?!\d)/, '');

function normalizeKey(docKey: string): string {
  return docKey.split('/').map(stripNumberPrefix).join('/');
}

function formatDay(iso: string): string {
  // The commit date carries its own offset (2026-08-09T19:30-05:00), so the
  // leading YYYY-MM-DD is the day the edit was actually made. Parsing to a
  // Date and formatting in the reader's zone would shift evening edits a day.
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

interface Dates {
  created?: string;
  updated?: string;
}

export function usePageDates(): Dates {
  const events = useChangeEvents();
  const { metadata } = useDoc();
  const key = normalizeKey(metadata.id);

  const mine: ChangeEvent[] = events.filter(
    (e) => e.type !== 'removed' && normalizeKey(e.docKey) === key,
  );
  if (mine.length === 0) return {};

  // The stream is newest-first, so the last "new" event is the original birth
  // even if a page was deleted and re-added.
  const created = [...mine].reverse().find((e) => e.type === 'new')?.date;
  const updated = mine[0].date;
  return { created, updated };
}

export default function PageDates(): JSX.Element | null {
  const { created, updated } = usePageDates();
  if (!created && !updated) return null;

  const createdDay = created ? formatDay(created) : null;
  const updatedDay = updated ? formatDay(updated) : null;
  // A page written once says so once, rather than claiming an update that is
  // really just its own creation commit.
  const showUpdated = updatedDay && updatedDay !== createdDay;

  const style: React.CSSProperties = {
    fontFamily: 'var(--ifm-font-family-monospace)',
    fontSize: '0.8rem',
    color: 'var(--ifm-color-emphasis-600)',
  };

  return (
    <span style={style}>
      {createdDay ? (
        <>
          Created <time dateTime={created!.slice(0, 10)}>{createdDay}</time>
        </>
      ) : null}
      {createdDay && showUpdated ? ' · ' : null}
      {showUpdated ? (
        <>
          Updated <time dateTime={updated!.slice(0, 10)}>{updatedDay}</time>
        </>
      ) : null}
    </span>
  );
}
