import { describe, expect, it } from "vitest";
import { attributionCompleteness, cleanUtmValue, normalizeCampaignSlug } from "../src/attribution";
describe("campaign attribution hygiene",()=>{
  it("normalizes valid campaign slugs and rejects arbitrary URL-like values",()=>{
    expect(normalizeCampaignSlug("Ramadan-UMKM-2027")).toBe("ramadan-umkm-2027");
    expect(normalizeCampaignSlug("https://example.com/?utm_campaign=x")).toBeUndefined();
  });
  it("strips control characters and bounds UTM values",()=>{
    expect(cleanUtmValue("  social\nmedia  ",20)).toBe("socialmedia");
    expect(cleanUtmValue("x".repeat(200),10)).toHaveLength(10);
  });
  it("counts available attribution fields without inventing missing values",()=>{
    expect(attributionCompleteness({source:"instagram",medium:"social",campaign:null})).toBe(2);
  });
});
