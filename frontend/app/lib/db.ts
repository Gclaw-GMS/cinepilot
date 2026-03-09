// Mock Prisma client for demo mode
// In production, this would connect to a real PostgreSQL database

const mockPrismaClient = {
  // Add any model operations needed for demo mode
  travelExpense: {
    findMany: async () => [],
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  },
  audienceSentiment: {
    findMany: async () => [],
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  },
  cateringPlan: {
    findMany: async () => [],
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  },
  characterCostume: {
    findMany: async () => [],
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  },
  // Add other models as needed
  $connect: async () => {},
  $disconnect: async () => {},
}

// Export a mock prisma client
export const prisma = mockPrismaClient as any
