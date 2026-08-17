-- CreateTable
CREATE TABLE `PracticeDailyUsage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `day` DATE NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `PracticeDailyUsage_userId_day_key`(`userId`, `day`),
    INDEX `PracticeDailyUsage_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PracticeDailyUsage` ADD CONSTRAINT `PracticeDailyUsage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill today's and historical usage from existing attempts (UTC date)
INSERT INTO `PracticeDailyUsage` (`id`, `userId`, `day`, `count`)
SELECT
    CONCAT('bf_', REPLACE(UUID(), '-', '')),
    `userId`,
    DATE(`createdAt`),
    COUNT(*)
FROM `PracticeAttempt`
GROUP BY `userId`, DATE(`createdAt`);
