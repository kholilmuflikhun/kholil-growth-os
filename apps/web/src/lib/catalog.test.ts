import { describe, expect, it } from "vitest";
import { portfolioConcepts, serviceCategories, servicePackages, services } from "./catalog";

describe("public service catalog data", () => {
  it("uses unique service slugs and valid categories", () => {
    const slugs = services.map((service) => service.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const categories = new Set(serviceCategories.map((category) => category.id));
    expect(categories.size).toBe(serviceCategories.length);
    for (const service of services) {
      expect(categories.has(service.categoryId)).toBe(true);
      expect(service.name.length).toBeGreaterThan(2);
      expect(service.deliverables.length).toBeGreaterThan(0);
      expect(Boolean(service.priceFrom || service.priceLabel)).toBe(true);
    }
  });

  it("references existing services from packages and concept cards", () => {
    const slugs = new Set(services.map((service) => service.slug));
    for (const item of servicePackages) {
      expect(item.serviceSlugs.length).toBeGreaterThan(0);
      for (const slug of item.serviceSlugs) expect(slugs.has(slug)).toBe(true);
    }
    for (const item of portfolioConcepts) expect(slugs.has(item.slug)).toBe(true);
  });
});
