-- AlterTable
ALTER TABLE `users` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `assignedCinemaId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_assignedCinemaId_fkey` FOREIGN KEY (`assignedCinemaId`) REFERENCES `cinemas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
