const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const trinity = await prisma.operator.findMany({
    where: {
      companyName: {
        contains: 'Trinity',
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      companyName: true,
      approved: true,
      slug: true,
      portalEnabled: true,
      routes: {
        select: {
          id: true,
          origin: true,
          destination: true,
          active: true,
          price: true,
        },
      },
    },
  });

  const kampalaNairobi = await prisma.route.findMany({
    where: {
      origin: {
        contains: 'Kampala',
        mode: 'insensitive',
      },
      destination: {
        contains: 'Nairobi',
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      origin: true,
      destination: true,
      active: true,
      price: true,
      operator: {
        select: {
          id: true,
          companyName: true,
          approved: true,
          slug: true,
          portalEnabled: true,
        },
      },
    },
  });

  const summary = {
    trinityOperators: trinity.map((operator) => {
      const activeRoutes = operator.routes.filter((route) => route.active);
      return {
        id: operator.id,
        name: operator.companyName,
        approved: operator.approved,
        slug: operator.slug,
        portalEnabled: operator.portalEnabled,
        totalRoutes: operator.routes.length,
        activeRoutes: activeRoutes.length,
        routes: operator.routes,
      };
    }),
    kampalaNairobi: {
      totalRoutes: kampalaNairobi.length,
      activeRoutes: kampalaNairobi.filter((route) => route.active).length,
      activeWithApprovedOperator: kampalaNairobi.filter(
        (route) => route.active && route.operator && route.operator.approved
      ).length,
      routes: kampalaNairobi,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error('Audit error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
