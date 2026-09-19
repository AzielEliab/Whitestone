import { describe, expect, it } from "vitest";
import {
  classifyUrl,
  describeAllowlist,
  isAllowedUrl,
  isPrivateHost,
  parseHttpsUrl,
  selfHelpHosts,
  shouldFetchUrl,
} from "./allowlist";

describe("allowlist", () => {
  it("allows state judiciary and self-help portals", () => {
    expect(isAllowedUrl("https://selfhelp.courts.ca.gov/divorce")).toBe(true);
    expect(isAllowedUrl("https://www.nycourts.gov/courthelp/")).toBe(true);
    expect(isAllowedUrl("https://www.alacourt.gov/")).toBe(true);
    expect(isAllowedUrl("https://www.oscn.net/")).toBe(true);
    expect(isAllowedUrl("https://www.lasc.org/")).toBe(true);
    expect(isAllowedUrl("https://www.pacourts.us/")).toBe(true);
    expect(classifyUrl("https://www.azcourts.gov/")?.kind).toBe("state-judiciary");
  });

  it("allows legal-aid, LII, labeled Justia, and federal public pages", () => {
    expect(classifyUrl("https://www.lawhelp.org/")?.kind).toBe("legal-aid");
    expect(classifyUrl("https://texaslawhelp.org/family-divorce-children")?.kind).toBe("legal-aid");
    expect(classifyUrl("https://www.law.cornell.edu/wex/divorce")?.kind).toBe("lii");
    expect(classifyUrl("https://law.justia.com/codes/california/")?.kind).toBe("justia");
    expect(classifyUrl("https://www.usa.gov/child-support")?.kind).toBe("federal-public");
    expect(classifyUrl("https://www.justice.gov/ovw")?.kind).toBe("federal-public");
    expect(classifyUrl("https://www.acf.hhs.gov/css")?.kind).toBe("federal-public");
    expect(classifyUrl("https://www.uscourts.gov/about-federal-courts/types-cases/criminal-cases")?.kind).toBe(
      "federal-public",
    );
    expect(classifyUrl("https://www.consumerfinance.gov/")?.kind).toBe("federal-public");
    expect(classifyUrl("https://www.census.gov/library/publications/2020/demo/p60-269.html")?.kind).toBe(
      "federal-public",
    );
    expect(classifyUrl("https://bjs.ojp.gov/content/pub/pdf/fdluc09.pdf")?.kind).toBe("federal-public");
    expect(classifyUrl("https://www.archives.gov/founding-docs/constitution")?.kind).toBe("federal-public");
    expect(classifyUrl("https://constitution.congress.gov/")?.kind).toBe("federal-public");
    expect(classifyUrl("https://www.ada.gov/law-and-regs/ada/")?.kind).toBe("federal-public");
    expect(classifyUrl("https://www.ncsc.org/information-and-resources/self-represented-litigants")?.kind).toBe(
      "statistical",
    );
    expect(classifyUrl("https://spectrallock-download-tracker.vibelock.workers.dev/v1/unredact")?.kind).toBe(
      "software-public",
    );
  });

  it("blocks blogs, SEO mills, lawyer directories, and private hosts", () => {
    expect(isAllowedUrl("https://www.avvo.com/divorce-lawyers")).toBe(false);
    expect(isAllowedUrl("https://www.reddit.com/r/legaladvice")).toBe(false);
    expect(isAllowedUrl("https://medium.com/@someone/divorce-tips")).toBe(false);
    expect(isAllowedUrl("https://best-divorce-seo-mill.com/")).toBe(false);
    expect(isAllowedUrl("https://www.justia.com/lawyers")).toBe(false);
    expect(isAllowedUrl("http://www.usa.gov/child-support")).toBe(false);
    expect(isAllowedUrl("https://127.0.0.1/")).toBe(false);
    expect(isPrivateHost("192.168.1.9")).toBe(true);
    expect(shouldFetchUrl("https://chatgpt.com/")).toBe(false);
  });

  it("includes every jurisdiction self-help host", () => {
    expect(selfHelpHosts().size).toBeGreaterThanOrEqual(50);
    expect(selfHelpHosts().has("selfhelp.courts.ca.gov")).toBe(true);
  });

  it("describes the allowlist with positive hosts only", () => {
    const desc = describeAllowlist();
    expect(desc.kinds).toContain("state-judiciary");
    expect(desc.exampleHosts.join(" ")).toMatch(/law\.cornell\.edu/i);
    expect(desc).not.toHaveProperty("blockedExamples");
    expect(parseHttpsUrl("https://www.law.cornell.edu/wex/family_law")?.protocol).toBe("https:");
  });
});
