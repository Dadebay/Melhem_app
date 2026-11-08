import {resolveDeepLink} from '../src/lib/deepLink';

describe('deep links', () => {
  it('routes supported app paths to the matching screen', () => {
    expect(resolveDeepLink('/drug/42')).toEqual({
      kind: 'internal',
      target: {screen: 'Drug', params: {id: '42'}},
    });
    expect(resolveDeepLink('melhem://category/7?title=Pain')).toEqual({
      kind: 'internal',
      target: {
        screen: 'Drugs',
        params: {queries: {category_id: '7'}, title: 'Pain'},
      },
    });
  });

  it('does not treat a foreign host as an app route', () => {
    const url = 'https://example.com/drug/42';
    expect(resolveDeepLink(url)).toEqual({kind: 'external', url});
    expect(resolveDeepLink('melhem://unknown/42')).toBeNull();
  });
});
