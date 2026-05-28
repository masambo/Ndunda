export type LanguageCode = "en" | "af" | "de" | "ng" | "ruk";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export interface Translations {
  nav: {
    home: string;
    favorites: string;
    search: string;
    profile: string;
    agents: string;
    listProperty: string;
  };
  home: {
    greeting: string;
    searchingIn: string;
    postProperty: string;
    buy: string;
    rent: string;
    searchPlaceholder: string;
    recentSearches: string;
    recommended: string;
    viewAll: string;
    featuredListings: string;
    scanNearby: string;
    scanNearbyDesc: string;
  };
  favorites: {
    title: string;
    all: string;
    buy: string;
    rent: string;
    saved: string;
    emptyTitle: string;
    emptyDesc: string;
    browse: string;
  };
  property: {
    rentFor: string;
    buyFor: string;
    perMonth: string;
    perNight: string;
    beds: string;
    baths: string;
    sqft: string;
    agent: string;
    landlord: string;
  };
  onboarding: {
    skip: string;
    next: string;
    getStarted: string;
    slide1Title: string;
    slide1Desc: string;
    slide2Title: string;
    slide2Desc: string;
    slide3Title: string;
    slide3Desc: string;
  };
  language: {
    title: string;
    next: string;
  };
  city: {
    title: string;
    headline: string;
    subheadline: string;
    searchPlaceholder: string;
    currentLocation: string;
    popularCities: string;
    allCities: string;
    next: string;
  };
  settings: {
    title: string;
    language: string;
    back: string;
  };
  common: {
    back: string;
    new: string;
  };
}
