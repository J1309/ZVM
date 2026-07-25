import { internalMutation } from "./_generated/server";

const zones = [
  { fsa: "M5V", city: "Toronto", province: "ON", tier: "Tier 1" as const, surcharge: 0, status: "active" as const, region: "East" as const },
  { fsa: "V6B", city: "Vancouver", province: "BC", tier: "Tier 1" as const, surcharge: 0, status: "active" as const, region: "West" as const },
  { fsa: "T2P", city: "Calgary", province: "AB", tier: "Tier 2" as const, surcharge: 5, status: "active" as const, region: "North" as const },
  { fsa: "K1A", city: "Ottawa", province: "ON", tier: "Tier 2" as const, surcharge: 5, status: "active" as const, region: "South" as const },
  { fsa: "H2X", city: "Montreal", province: "QC", tier: "Tier 1" as const, surcharge: 0, status: "pending" as const, region: "East" as const },
];

const vans = [
  { name: "Thunder", status: "Active" as const, location: "GTA North", sessionsToday: 12, totalSessions: 847 },
  { name: "Storm", status: "Active" as const, location: "GTA West", sessionsToday: 9, totalSessions: 623 },
  { name: "Lightning", status: "Maintenance" as const, location: "Shop", sessionsToday: 0, totalSessions: 412 },
  { name: "Bolt", status: "Active" as const, location: "Metro Van", sessionsToday: 11, totalSessions: 756 },
];

const vaccines = [
  { dogName: "Max", ownerName: "Sarah C.", vaccineType: "Rabies + DHPP", status: "pending" as const },
  { dogName: "Bella", ownerName: "James O.", vaccineType: "Rabies", status: "pending" as const },
  { dogName: "Luna", ownerName: "David P.", vaccineType: "DHPP", status: "approved" as const },
];

export const demoData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    if ((await ctx.db.query("fsaZones").first()) === null) {
      for (const zone of zones) {
        await ctx.db.insert("fsaZones", { ...zone, createdAt: now, updatedAt: now });
      }
    }

    if ((await ctx.db.query("fleetVans").first()) === null) {
      for (const van of vans) {
        await ctx.db.insert("fleetVans", { ...van, createdAt: now, updatedAt: now });
      }
    }

    if ((await ctx.db.query("vaccineRecords").first()) === null) {
      for (const record of vaccines) {
        await ctx.db.insert("vaccineRecords", {
          ...record,
          submittedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if ((await ctx.db.query("cmsSettings").first()) === null) {
      await ctx.db.insert("cmsSettings", {
        heroTagline: "A Professional Dog Gym That Comes to You",
        baseSessionRate: 35,
        weeklyPackRate: 110,
        eightPackRate: 200,
        emergencyBannerText: "",
        emergencyBannerActive: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { seeded: true };
  },
});
