// The jobs-board filter contract: what the URL holds, what a shared link looks
// like, and how an applied filter reads. Each case here is a bug that shipped
// when five components wrote these params by hand.
import { describe, it, expect } from 'vitest';
import {
  parseFilters, writeFilters, filterChips, clearedFilters, moreFilterCount,
  DEFAULT_FILTERS, DATE_OPTIONS,
} from '@/components/seeker/dashboard/filter-schema';
import { ROLE_OPTIONS } from '@/components/seeker/dashboard/constants';

const params = (qs: string) => new URLSearchParams(qs);
const write = (qs: string, patch: Parameters<typeof writeFilters>[1]) => {
  const sp = params(qs);
  writeFilters(sp, patch);
  return sp;
};

describe('parseFilters', () => {
  it('reads an empty URL as the defaults', () => {
    expect(parseFilters(params(''))).toEqual(DEFAULT_FILTERS);
  });

  it('reads every filter back out of a full URL', () => {
    const f = parseFilters(params(
      'company=Zepto&role=Backend&exp=Mid%20(3-5y)&wp=remote,hybrid&date=7d' +
      '&loc=Pune,Bengaluru&tech=Go&salMin=12&salMax=40&q=sre&entry=1&hideApplied=1&newOnly=1&sort=match',
    ));
    expect(f).toEqual({
      company: 'Zepto', role: 'Backend', experience: ['Mid (3-5y)'],
      workplace: ['remote', 'hybrid'], date: '7d',
      locations: ['Pune', 'Bengaluru'], techStack: ['Go'],
      salaryMin: '12', salaryMax: '40', search: 'sre',
      entryLevel: true, hideApplied: true, newOnly: true, sortByMatch: true,
    });
  });

  it('drops values the UI does not offer, so a hand-edited link cannot wedge the list', () => {
    const f = parseFilters(params('wp=teleport&date=since-forever&salMin=-5'));
    expect(f.workplace).toEqual([]);
    expect(f.date).toBe('all');
    expect(f.salaryMin).toBe('');
  });
});

describe('writeFilters', () => {
  it('clears the param when a filter goes back to its default', () => {
    // Was the bug: picking "All roles" wrote ?role=all into the shared link.
    expect(write('role=Backend', { role: 'all' }).has('role')).toBe(false);
    expect(write('date=7d', { date: 'all' }).has('date')).toBe(false);
    expect(write('wp=remote', { workplace: [] }).has('wp')).toBe(false);
    expect(write('entry=1', { entryLevel: false }).has('entry')).toBe(false);
    expect(write('q=sre', { search: '' }).has('q')).toBe(false);
  });

  it('resets paging on any filter change', () => {
    // Was each caller's job to remember, and three of them forgot.
    expect(write('page=4', { role: 'Backend' }).has('page')).toBe(false);
    expect(write('page=4', { workplace: ['remote'] }).has('page')).toBe(false);
    expect(write('page=4', { sortByMatch: true }).has('page')).toBe(false);
  });

  it('writes sort as a named mode and the rest as flags', () => {
    expect(write('', { sortByMatch: true }).get('sort')).toBe('match');
    expect(write('', { hideApplied: true }).get('hideApplied')).toBe('1');
  });

  it('leaves params it was not given alone', () => {
    const sp = write('selectedJob=abc123&company=Zepto', { role: 'Backend' });
    expect(sp.get('selectedJob')).toBe('abc123');
    expect(sp.get('company')).toBe('Zepto');
  });

  it('round-trips through parse', () => {
    const sp = write('', { role: 'Data', workplace: ['hybrid'], date: '3d', locations: ['Kochi'] });
    const f = parseFilters(sp);
    expect(f.role).toBe('Data');
    expect(f.workplace).toEqual(['hybrid']);
    expect(f.date).toBe('3d');
    expect(f.locations).toEqual(['Kochi']);
  });
});

describe('clearedFilters', () => {
  it('clears the filters without touching the open job', () => {
    // Was the bug: Clear all replaced the whole query string, so it also closed
    // the job in the detail panel.
    const sp = params('selectedJob=abc123&role=Backend&wp=remote&page=3');
    writeFilters(sp, clearedFilters());
    expect(sp.get('selectedJob')).toBe('abc123');
    expect(sp.has('role')).toBe(false);
    expect(sp.has('wp')).toBe(false);
    expect(sp.has('page')).toBe(false);
  });

  it('leaves the search term for the caller to decide', () => {
    expect('search' in clearedFilters()).toBe(false);
  });
});

describe('filterChips', () => {
  const chipsFor = (qs: string) => filterChips(parseFilters(params(qs)), ROLE_OPTIONS);

  it('labels the posted-date chip in words, not the raw param', () => {
    // Was the bug: the chip read "3d".
    const [chip] = chipsFor('date=3d');
    expect(chip.group).toBe('Posted');
    expect(chip.label).toBe('Last 3 days');
  });

  it('labels a work mode the way the control does', () => {
    // Was the bug: the chip read "on-site" in lower case.
    expect(chipsFor('wp=on-site')[0].label).toBe('On-site');
  });

  it('names the filter type on every chip', () => {
    // Baymard: carry the type when a value alone is ambiguous, and be
    // consistent rather than prefixing only some chips.
    const chips = chipsFor('role=Data&exp=Mid%20(3-5y)&wp=remote&date=7d&loc=Pune&tech=Go&salMin=12&entry=1');
    expect(chips.every(c => c.group.length > 0)).toBe(true);
    expect(chips.map(c => c.group)).toEqual([
      'Role', 'Experience', 'Work mode', 'Posted', 'City', 'Tech', 'Salary', 'Show',
    ]);
  });

  it('gives one chip per value, each removing only itself', () => {
    const chips = chipsFor('wp=remote,hybrid');
    expect(chips).toHaveLength(2);
    expect(chips[0].patch).toEqual({ workplace: ['hybrid'] });
    expect(chips[1].patch).toEqual({ workplace: ['remote'] });
  });

  it('reads a salary range, an open-ended minimum and a cap', () => {
    expect(chipsFor('salMin=12&salMax=40')[0].label).toBe('₹12–40 LPA');
    expect(chipsFor('salMin=12')[0].label).toBe('₹12+ LPA');
    expect(chipsFor('salMax=40')[0].label).toBe('Up to ₹40 LPA');
  });

  it('shows nothing when nothing is applied', () => {
    expect(chipsFor('')).toEqual([]);
    // The open job and the search box are not filters on this row.
    expect(chipsFor('selectedJob=abc&q=sre')).toEqual([]);
  });

  it('keeps a chip for every date option the control offers', () => {
    for (const o of DATE_OPTIONS.filter(d => d.value !== 'all')) {
      expect(chipsFor(`date=${o.value}`)[0].label).toBe(o.label);
    }
  });
});

describe('moreFilterCount', () => {
  it('counts only what lives behind the More chip', () => {
    // Role, experience and work mode are out on the bar, so they must not count.
    expect(moreFilterCount(parseFilters(params('role=Data&exp=Mid%20(3-5y)&wp=remote')))).toBe(0);
    expect(moreFilterCount(parseFilters(params('date=7d&loc=Pune,Kochi&tech=Go&salMin=12&newOnly=1')))).toBe(6);
  });
});
