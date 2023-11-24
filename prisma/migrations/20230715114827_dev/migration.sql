-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'OWNER', 'TRAINEE', 'MODERATOR');

-- CreateEnum
CREATE TYPE "SubType" AS ENUM ('PLUS', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "urlType" AS ENUM ('NORMAL', 'RAW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "invites" INTEGER NOT NULL DEFAULT 0,
    "uploads" INTEGER NOT NULL DEFAULT 0,
    "lastLogin" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "registerDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registerIp" TEXT,
    "invitedBy" TEXT NOT NULL DEFAULT 'No one',
    "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "blacklistId" TEXT,
    "subscriptionId" TEXT,
    "discordId" TEXT,
    "settingsId" TEXT,
    "privacySettingsId" TEXT,
    "embedSettingsId" TEXT,
    "linkSettingsId" TEXT,
    "removed" BOOLEAN NOT NULL DEFAULT false,
    "invitedUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "storageUsed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blacklist" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,

    CONSTRAINT "Blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "type" "SubType",
    "subscribeDate" TIMESTAMP(3),
    "expires" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDiscord" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "refreshToken" TEXT,
    "avatar" TEXT,
    "discordId" TEXT,

    CONSTRAINT "UserDiscord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "aboutme" TEXT DEFAULT 'Hi, I''m new here!',

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacySettings" (
    "id" TEXT NOT NULL,
    "privateProfile" BOOLEAN NOT NULL DEFAULT false,
    "showDiscordOnProfile" BOOLEAN NOT NULL DEFAULT false,
    "showMatureDomains" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PrivacySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbedSettings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT NOT NULL DEFAULT '#0090ff',
    "providerName" TEXT NOT NULL DEFAULT 'sharify.in',
    "providerUrl" TEXT NOT NULL DEFAULT 'https://sharify.in',
    "author" TEXT NOT NULL DEFAULT '[username]',
    "authorUrl" TEXT NOT NULL DEFAULT 'https://sharify.in',
    "title" TEXT NOT NULL DEFAULT 'This file is hosted on sharify.in',
    "description" TEXT NOT NULL DEFAULT 'Uploaded by [username]',

    CONSTRAINT "EmbedSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkSettings" (
    "id" TEXT NOT NULL,
    "urlType" "urlType" NOT NULL DEFAULT 'NORMAL',
    "subdomain" TEXT,
    "domain" TEXT NOT NULL DEFAULT 'i.sharify.in',

    CONSTRAINT "LinkSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" TEXT NOT NULL,
    "beta" BOOLEAN NOT NULL DEFAULT false,
    "regEnabled" BOOLEAN NOT NULL DEFAULT false,
    "inviteOnly" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "cdnUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "usedBy" TEXT,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Domain" (
    "name" TEXT NOT NULL,
    "wildcard" BOOLEAN NOT NULL,
    "donated" BOOLEAN NOT NULL,
    "private" BOOLEAN NOT NULL,
    "mature" BOOLEAN NOT NULL,
    "dateadded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "donator" TEXT NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Verification" (
    "code" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Announcements" (
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "author" TEXT NOT NULL,

    CONSTRAINT "Announcements_pkey" PRIMARY KEY ("title")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_token_key" ON "User"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_blacklistId_key" ON "User"("blacklistId");

-- CreateIndex
CREATE UNIQUE INDEX "User_subscriptionId_key" ON "User"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_settingsId_key" ON "User"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "User_privacySettingsId_key" ON "User"("privacySettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "User_linkSettingsId_key" ON "User"("linkSettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "State_id_key" ON "State"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_code_key" ON "Invite"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_name_key" ON "Domain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_donator_key" ON "Domain"("donator");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_code_key" ON "Verification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_owner_key" ON "Verification"("owner");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_blacklistId_fkey" FOREIGN KEY ("blacklistId") REFERENCES "Blacklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "UserDiscord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_privacySettingsId_fkey" FOREIGN KEY ("privacySettingsId") REFERENCES "PrivacySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_embedSettingsId_fkey" FOREIGN KEY ("embedSettingsId") REFERENCES "EmbedSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_linkSettingsId_fkey" FOREIGN KEY ("linkSettingsId") REFERENCES "LinkSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
