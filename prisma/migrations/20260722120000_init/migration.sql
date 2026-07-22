-- CreateTable
CREATE TABLE `WordEntry` (
    `id` VARCHAR(191) NOT NULL,
    `word` VARCHAR(191) NOT NULL,
    `definition` VARCHAR(191) NOT NULL,
    `partOfSpeech` VARCHAR(191) NOT NULL,
    `phonetic` VARCHAR(191) NULL,
    `audioUrl` VARCHAR(191) NULL,
    `exampleSentence` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
