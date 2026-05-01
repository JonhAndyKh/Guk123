import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("⚡ Seeding KIZOTOPUP database...");

  // --- Settings singleton ---
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: "KIZOTOPUP",
      exchangeRate: 4100,
      supportTelegram: "@jonhandy",
      supportEmail: "daviranzy@gmail.com",
    },
  });

  // --- Admin user ---
  const adminEmail = process.env.ADMIN_EMAIL || "admin@kizotopup.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "kizotopup!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: "Super Admin",
      role: "SUPERADMIN",
    },
  });
  console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);

  // --- Games ---
  const games = [
    {
      slug: "mobile-legends",
      name: "Mobile Legends: Bang Bang",
      publisher: "Moonton",
      description: "Top up Diamonds instantly for Mobile Legends",
      imageUrl: "https://cdn.rithtopup.com/games/mlbb.jpg",
      bannerUrl: "https://cdn.rithtopup.com/banners/mlbb.jpg",
      currencyName: "Diamonds",
      uidLabel: "User ID (Zone ID)",
      uidExample: "12345678",
      featured: true,
      sortOrder: 1,
      products: [
        { name: "11 Diamonds", amount: 11, priceUsd: 0.25 },
        { name: "22 Diamonds", amount: 22, priceUsd: 0.50 },
        { name: "56 Diamonds", amount: 56, priceUsd: 1.10 },
        { name: "86 Diamonds", amount: 86, bonus: 0, priceUsd: 1.80, badge: "Hot" },
        { name: "172 Diamonds", amount: 172, bonus: 0, priceUsd: 3.50 },
        { name: "257 Diamonds", amount: 257, bonus: 0, priceUsd: 5.20 },
        { name: "344 Diamonds", amount: 344, bonus: 0, priceUsd: 6.90 },
        { name: "429 Diamonds", amount: 429, bonus: 0, priceUsd: 8.60 },
        { name: "514 Diamonds", amount: 514, bonus: 0, priceUsd: 10.30 },
        { name: "706 Diamonds", amount: 706, bonus: 0, priceUsd: 13.80, badge: "Best Value" },
        { name: "878 Diamonds", amount: 878, bonus: 0, priceUsd: 17.20 },
        { name: "1050 Diamonds", amount: 1050, bonus: 0, priceUsd: 20.60 },
        { name: "2195 Diamonds", amount: 2195, bonus: 0, priceUsd: 42.80 },
        { name: "3688 Diamonds", amount: 3688, bonus: 0, priceUsd: 72.00 },
        { name: "5532 Diamonds", amount: 5532, bonus: 0, priceUsd: 108.00 },
        { name: "9288 Diamonds", amount: 9288, bonus: 0, priceUsd: 180.00 },
        { name: "Weekly Diamond Pass", amount: 0, priceUsd: 1.50, badge: "Pass" },
        { name: "Twilight Pass", amount: 0, priceUsd: 7.90, badge: "Pass" },
      ],
    },
    {
      slug: "free-fire",
      name: "Garena Free Fire",
      publisher: "Garena",
      description: "Top up Diamonds for Free Fire MAX and Free Fire",
      imageUrl: "https://cdn.rithtopup.com/games/freefire.jpg",
      bannerUrl: "https://cdn.rithtopup.com/banners/freefire.jpg",
      currencyName: "Diamonds",
      uidLabel: "Player ID",
      uidExample: "1234567890",
      featured: true,
      sortOrder: 2,
      products: [
        { name: "100 Diamonds", amount: 100, priceUsd: 0.99 },
        { name: "210 Diamonds", amount: 210, priceUsd: 1.98 },
        { name: "530 Diamonds", amount: 530, priceUsd: 4.95, badge: "Hot" },
        { name: "1080 Diamonds", amount: 1080, priceUsd: 9.90 },
        { name: "2200 Diamonds", amount: 2200, priceUsd: 19.80, badge: "Best Value" },
        { name: "5600 Diamonds", amount: 5600, priceUsd: 49.50 },
        { name: "Weekly Membership", amount: 0, priceUsd: 1.50, badge: "Pass" },
        { name: "Monthly Membership", amount: 0, priceUsd: 7.90, badge: "Pass" },
      ],
    },
    {
      slug: "pubg-mobile",
      name: "PUBG Mobile",
      publisher: "Tencent",
      description: "Top up UC for PUBG Mobile Global and KR",
      imageUrl: "https://cdn.rithtopup.com/games/pubgm.jpg",
      bannerUrl: "https://cdn.rithtopup.com/banners/pubgm.jpg",
      currencyName: "UC",
      uidLabel: "Player ID",
      uidExample: "5123456789",
      featured: true,
      sortOrder: 3,
      products: [
        { name: "60 UC", amount: 60, priceUsd: 0.99 },
        { name: "325 UC", amount: 325, priceUsd: 4.99 },
        { name: "660 UC", amount: 660, bonus: 60, priceUsd: 9.99, badge: "Hot" },
        { name: "1800 UC", amount: 1800, bonus: 300, priceUsd: 24.99 },
        { name: "3850 UC", amount: 3850, bonus: 850, priceUsd: 49.99, badge: "Best Value" },
        { name: "8100 UC", amount: 8100, bonus: 2100, priceUsd: 99.99 },
      ],
    },
    {
      slug: "genshin-impact",
      name: "Genshin Impact",
      publisher: "HoYoverse",
      description: "Top up Genesis Crystals for Genshin Impact",
      imageUrl: "https://cdn.rithtopup.com/games/genshin.jpg",
      currencyName: "Genesis Crystals",
      uidLabel: "UID",
      uidExample: "812345678",
      requiresServer: true,
      servers: JSON.stringify(["America", "Europe", "Asia", "TW/HK/MO"]),
      featured: true,
      sortOrder: 4,
      products: [
        { name: "60 Genesis Crystals", amount: 60, priceUsd: 0.99 },
        { name: "300 + 30 Genesis Crystals", amount: 300, bonus: 30, priceUsd: 4.99 },
        { name: "980 + 110 Genesis Crystals", amount: 980, bonus: 110, priceUsd: 14.99, badge: "Hot" },
        { name: "1980 + 260 Genesis Crystals", amount: 1980, bonus: 260, priceUsd: 29.99 },
        { name: "3280 + 600 Genesis Crystals", amount: 3280, bonus: 600, priceUsd: 49.99 },
        { name: "6480 + 1600 Genesis Crystals", amount: 6480, bonus: 1600, priceUsd: 99.99, badge: "Best Value" },
        { name: "Blessing of the Welkin Moon", amount: 0, priceUsd: 4.99, badge: "Pass" },
      ],
    },
    {
      slug: "honkai-star-rail",
      name: "Honkai: Star Rail",
      publisher: "HoYoverse",
      description: "Top up Oneiric Shards for Honkai: Star Rail",
      imageUrl: "https://cdn.rithtopup.com/games/hsr.jpg",
      currencyName: "Oneiric Shards",
      uidLabel: "UID",
      uidExample: "812345678",
      requiresServer: true,
      servers: JSON.stringify(["America", "Europe", "Asia", "TW/HK/MO"]),
      sortOrder: 5,
      products: [
        { name: "60 Oneiric Shards", amount: 60, priceUsd: 0.99 },
        { name: "300 + 30 Oneiric Shards", amount: 300, bonus: 30, priceUsd: 4.99 },
        { name: "980 + 110 Oneiric Shards", amount: 980, bonus: 110, priceUsd: 14.99 },
        { name: "1980 + 260 Oneiric Shards", amount: 1980, bonus: 260, priceUsd: 29.99 },
      ],
    },
    {
      slug: "call-of-duty-mobile",
      name: "Call of Duty: Mobile",
      publisher: "Activision",
      description: "Top up CP for Call of Duty Mobile",
      imageUrl: "https://cdn.rithtopup.com/games/codm.jpg",
      currencyName: "CP",
      uidLabel: "Player ID",
      uidExample: "1234567890",
      sortOrder: 6,
      products: [
        { name: "80 CP", amount: 80, priceUsd: 0.99 },
        { name: "400 + 40 CP", amount: 400, bonus: 40, priceUsd: 4.99 },
        { name: "800 + 160 CP", amount: 800, bonus: 160, priceUsd: 9.99 },
        { name: "2000 + 600 CP", amount: 2000, bonus: 600, priceUsd: 24.99 },
      ],
    },
  ];

  for (const g of games) {
    const { products, ...gameData } = g;
    const game = await prisma.game.upsert({
      where: { slug: gameData.slug },
      update: gameData,
      create: gameData,
    });

    // Clear old products for this game and recreate to keep seed idempotent
    await prisma.product.deleteMany({ where: { gameId: game.id } });
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      await prisma.product.create({
        data: {
          ...p,
          gameId: game.id,
          sortOrder: i,
        },
      });
    }
    console.log(`✅ ${game.name} with ${products.length} products`);
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
