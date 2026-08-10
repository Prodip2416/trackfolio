import prisma from '../src/lib/prisma'
import dseCompanies from './dse_companies.json'

async function main() {
  console.log(`Start seeding ...`)

  // We use upsert to safely insert new or update existing master data
  let count = 0;
  for (const company of dseCompanies) {
    await prisma.dse_companies.upsert({
      where: { symbol: company.symbol },
      update: { 
        sector: company.sector,
        company_name: company.company_name,
        category: company.category 
      },
      create: {
        ...company,
        created_at: new Date(),
      }
    });
    count++;
  }

  const result = { count };

  console.log(`Successfully seeded ${result.count} DSE companies.`)
  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
