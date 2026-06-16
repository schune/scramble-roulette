import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
  RouteSeo,
  SITE_NAME,
  SITE_URL,
} from '../seo/site-seo.constants';

const STRUCTURED_DATA_ID = 'sr-structured-data';
const CANONICAL_ID = 'sr-canonical';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  /** Base WebSite schema — injected once at startup. */
  private readonly siteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: SITE_URL,
      'query-input': 'required name=search_term_string',
    },
  };

  initialize(): void {
    this.apply({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      keywords: DEFAULT_KEYWORDS,
      path: '/',
    });
    this.setStructuredData([this.siteStructuredData]);
  }

  apply(seo: RouteSeo): void {
    this.title.setTitle(seo.title);
    this.setMetaTag('name', 'description', seo.description);
    this.setMetaTag('name', 'keywords', seo.keywords ?? DEFAULT_KEYWORDS);
    this.setMetaTag('name', 'robots', seo.robots ?? 'index, follow');

    this.setMetaTag('property', 'og:title', seo.title);
    this.setMetaTag('property', 'og:description', seo.description);
    this.setMetaTag('property', 'og:url', `${SITE_URL}${seo.path}`);
    this.setMetaTag('property', 'og:site_name', SITE_NAME);
    this.setMetaTag('property', 'og:type', 'website');
    this.setMetaTag('property', 'og:locale', 'en_US');

    this.setMetaTag('name', 'twitter:card', 'summary');
    this.setMetaTag('name', 'twitter:title', seo.title);
    this.setMetaTag('name', 'twitter:description', seo.description);

    this.setCanonical(`${SITE_URL}${seo.path}`);
  }

  setStructuredData(data: Record<string, unknown> | Record<string, unknown>[]): void {
    const head = this.doc.head;
    if (!head) {
      return;
    }

    head.querySelector(`#${STRUCTURED_DATA_ID}`)?.remove();

    const script = this.doc.createElement('script');
    script.id = STRUCTURED_DATA_ID;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(Array.isArray(data) ? data : [data]);
    head.appendChild(script);
  }

  /** Merge route-level schema with the global WebSite schema. */
  applyRouteStructuredData(routeData?: Record<string, unknown> | Record<string, unknown>[]): void {
    if (!routeData) {
      this.setStructuredData([this.siteStructuredData]);
      return;
    }

    const extras = Array.isArray(routeData) ? routeData : [routeData];
    this.setStructuredData([this.siteStructuredData, ...extras]);
  }

  private setCanonical(href: string): void {
    const head = this.doc.head;
    if (!head) {
      return;
    }

    let link = head.querySelector<HTMLLinkElement>(`#${CANONICAL_ID}`);
    if (!link) {
      link = this.doc.createElement('link');
      link.id = CANONICAL_ID;
      link.rel = 'canonical';
      head.appendChild(link);
    }
    link.href = href;
  }

  private setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
    const selector = `${attr}="${key}"`;
    if (this.meta.getTag(selector)) {
      this.meta.updateTag({ [attr]: key, content });
    } else {
      this.meta.addTag({ [attr]: key, content });
    }
  }
}
