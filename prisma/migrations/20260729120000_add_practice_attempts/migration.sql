-- CreateTable
CREATE TABLE `PracticeAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `wordEntryId` VARCHAR(191) NOT NULL,
    `answer` TEXT NOT NULL,
    `meaningScore` INTEGER NOT NULL,
    `grammarScore` INTEGER NOT NULL,
    `overallScore` INTEGER NOT NULL,
    `meaningFeedback` TEXT NOT NULL,
    `grammarFeedback` TEXT NOT NULL,
    `grammarMistakes` JSON NOT NULL,
    `summary` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PracticeAttempt_userId_idx`(`userId`),
    INDEX `PracticeAttempt_wordEntryId_idx`(`wordEntryId`),
    INDEX `PracticeAttempt_userId_wordEntryId_createdAt_idx`(`userId`, `wordEntryId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PracticeAttempt` ADD CONSTRAINT `PracticeAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeAttempt` ADD CONSTRAINT `PracticeAttempt_wordEntryId_fkey` FOREIGN KEY (`wordEntryId`) REFERENCES `WordEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
