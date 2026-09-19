import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { prisma } from './prisma';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Verify Database connection
    await prisma.$connect();
    console.log('Successfully connected to MySQL Database via Prisma!');

    app.listen(PORT, () => {
      console.log(`CineLight Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      console.log(`API URL: http://localhost:${PORT}/api/v1`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to bootstrap server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
