const { PrismaClient } = require("../src/generated/prisma"); // ✅ pakai path output

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      role: "ADMIN",
      fullName: "Admin Tenant",
      email: "admin@example.com",
      phoneNumber: "081234567890",
      adminProfile: {
        create: {
          displayName: "Admin Kos Exclusive",
          description: "Pemilik beberapa properti kos dan apartemen.",
          bankName: "BCA",
          bankAccountNo: "1234567890",
          bankAccountName: "Admin Tenant",
        },
      },
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      role: "USER",
      fullName: "User Penyewa",
      email: "user@example.com",
      phoneNumber: "089876543210",
    },
  });

  console.log("✅ Users seeded");

  // 2. Property Types
  const apartmentType = await prisma.propertyType.upsert({
    where: { name: "Apartment" },
    update: {},
    create: { name: "Apartment" },
  });

  const houseType = await prisma.propertyType.upsert({
    where: { name: "House" },
    update: {},
    create: { name: "House" },
  });

  const villaType = await prisma.propertyType.upsert({
    where: { name: "Villa" },
    update: {},
    create: { name: "Villa" },
  });

  console.log("✅ Property types seeded");

  // 3. Facilities
  const wifi = await prisma.facility.upsert({
    where: { name: "Free WiFi" },
    update: {},
    create: { name: "Free WiFi", icon: "wifi" },
  });

  const ac = await prisma.facility.upsert({
    where: { name: "Air Conditioning" },
    update: {},
    create: { name: "Air Conditioning", icon: "ac" },
  });

  const parking = await prisma.facility.upsert({
    where: { name: "Parking" },
    update: {},
    create: { name: "Parking", icon: "parking" },
  });

  const pool = await prisma.facility.upsert({
    where: { name: "Swimming Pool" },
    update: {},
    create: { name: "Swimming Pool", icon: "pool" },
  });

  const kitchen = await prisma.facility.upsert({
    where: { name: "Kitchen" },
    update: {},
    create: { name: "Kitchen", icon: "kitchen" },
  });

  console.log("✅ Facilities seeded");

  // 4. Location
  const jakartaLocation = await prisma.location.create({
    data: {
      country: "Indonesia",
      city: "Jakarta",
      address: "Jl. Sudirman No. 1, Jakarta",
    },
  });

  console.log("✅ Location seeded");

  // 5. Property
  const property = await prisma.property.create({
    data: {
      adminUserId: adminUser.id,
      title: "Apartemen Nyaman di Pusat Jakarta",
      description:
        "Apartemen modern dengan akses mudah ke pusat kota dan transportasi publik.",
      typeId: apartmentType.id,
      locationId: jakartaLocation.id,
      maxGuests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 1,
      minNights: 1,
      maxNights: 14,
      basePricePerNightIdr: 750000,
      status: "ACTIVE",

      images: {
        create: [
          { url: "https://example.com/property-1.jpg" },
          { url: "https://example.com/property-1-room.jpg" },
        ],
      },
    },
  });

  console.log("✅ Property seeded");

  // 6. Property ↔ Facilities
  await prisma.propertyFacility.createMany({
    data: [
      { propertyId: property.id, facilityId: wifi.id },
      { propertyId: property.id, facilityId: ac.id },
      { propertyId: property.id, facilityId: parking.id },
      { propertyId: property.id, facilityId: kitchen.id },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Property facilities linked");

  // 7. Rooms
  const standardRoom = await prisma.room.create({
    data: {
      propertyId: property.id,
      name: "Standard Room",
      description: "Kamar standar untuk 2 orang.",
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      basePricePerNightIdr: 750000,
    },
  });

  const familyRoom = await prisma.room.create({
    data: {
      propertyId: property.id,
      name: "Family Room",
      description: "Kamar besar cocok untuk keluarga.",
      maxGuests: 4,
      beds: 2,
      bathrooms: 1,
      basePricePerNightIdr: 950000,
    },
  });

  console.log("✅ Rooms seeded");

  // 8. Room ↔ Facilities
  await prisma.roomFacility.createMany({
    data: [
      { roomId: standardRoom.id, facilityId: wifi.id },
      { roomId: standardRoom.id, facilityId: ac.id },

      { roomId: familyRoom.id, facilityId: wifi.id },
      { roomId: familyRoom.id, facilityId: ac.id },
      { roomId: familyRoom.id, facilityId: kitchen.id },
      { roomId: familyRoom.id, facilityId: pool.id },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Room facilities linked");

  console.log("🌱 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
