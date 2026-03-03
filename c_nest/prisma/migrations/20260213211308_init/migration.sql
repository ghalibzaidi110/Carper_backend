-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'CAR_RENTAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "CarCondition" AS ENUM ('NEW', 'USED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'PENDING', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ImageCategory" AS ENUM ('REGISTRATION_FRONT', 'REGISTRATION_BACK', 'REGISTRATION_LEFT', 'REGISTRATION_RIGHT', 'PERIODIC_FRONT', 'PERIODIC_BACK', 'PERIODIC_LEFT', 'PERIODIC_RIGHT', 'DAMAGE_DETECTION', 'LISTING_IMAGE');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "facebook_id" TEXT,
    "account_type" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "business_name" TEXT,
    "business_license" TEXT,
    "cnic_image_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_catalog" (
    "id" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "variant" TEXT,
    "body_type" TEXT,
    "fuel_type" TEXT,
    "transmission" TEXT,
    "engine_capacity" TEXT,
    "seating_capacity" INTEGER,
    "base_price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "description" TEXT,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_catalog_images" (
    "id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "alt_text" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_catalog_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cars" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "catalog_id" TEXT,
    "registration_number" TEXT NOT NULL,
    "vin_number" TEXT,
    "manufacturer" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "variant" TEXT,
    "color" TEXT,
    "mileage" INTEGER,
    "condition" "CarCondition" NOT NULL DEFAULT 'USED',
    "purchase_date" TIMESTAMP(3),
    "purchase_price" DECIMAL(12,2),
    "is_for_resale" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_images" (
    "id" TEXT NOT NULL,
    "car_id" TEXT NOT NULL,
    "image_category" "ImageCategory" NOT NULL,
    "image_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "cloudinary_public_id" TEXT,
    "file_size" INTEGER,
    "file_type" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "is_permanent" BOOLEAN NOT NULL DEFAULT false,
    "has_damage_detected" BOOLEAN NOT NULL DEFAULT false,
    "damage_detection_data" JSONB,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_listings" (
    "id" TEXT NOT NULL,
    "car_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "asking_price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_negotiable" BOOLEAN NOT NULL DEFAULT true,
    "listing_status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "listed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sold_at" TIMESTAMP(3),

    CONSTRAINT "car_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" TEXT NOT NULL,
    "car_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "renter_name" TEXT NOT NULL,
    "renter_phone" TEXT,
    "renter_email" TEXT,
    "renter_cnic" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "actual_return_date" TIMESTAMP(3),
    "mileage_at_start" INTEGER,
    "mileage_at_end" INTEGER,
    "pre_rental_notes" TEXT,
    "post_rental_notes" TEXT,
    "damage_charges" DECIMAL(12,2),
    "damage_description" TEXT,
    "rental_price" DECIMAL(12,2) NOT NULL,
    "total_charges" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "status" "RentalStatus" NOT NULL DEFAULT 'ACTIVE',
    "pre_inspection_version" INTEGER,
    "post_inspection_version" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebook_id_key" ON "users"("facebook_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_account_type_idx" ON "users"("account_type");

-- CreateIndex
CREATE INDEX "users_account_status_idx" ON "users"("account_status");

-- CreateIndex
CREATE INDEX "car_catalog_manufacturer_idx" ON "car_catalog"("manufacturer");

-- CreateIndex
CREATE INDEX "car_catalog_model_name_idx" ON "car_catalog"("model_name");

-- CreateIndex
CREATE INDEX "car_catalog_year_idx" ON "car_catalog"("year");

-- CreateIndex
CREATE INDEX "car_catalog_is_active_idx" ON "car_catalog"("is_active");

-- CreateIndex
CREATE INDEX "car_catalog_images_catalog_id_idx" ON "car_catalog_images"("catalog_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_cars_registration_number_key" ON "user_cars"("registration_number");

-- CreateIndex
CREATE INDEX "user_cars_user_id_idx" ON "user_cars"("user_id");

-- CreateIndex
CREATE INDEX "user_cars_registration_number_idx" ON "user_cars"("registration_number");

-- CreateIndex
CREATE INDEX "user_cars_is_for_resale_idx" ON "user_cars"("is_for_resale");

-- CreateIndex
CREATE INDEX "user_cars_is_active_idx" ON "user_cars"("is_active");

-- CreateIndex
CREATE INDEX "car_images_car_id_idx" ON "car_images"("car_id");

-- CreateIndex
CREATE INDEX "car_images_image_category_idx" ON "car_images"("image_category");

-- CreateIndex
CREATE INDEX "car_images_is_current_idx" ON "car_images"("is_current");

-- CreateIndex
CREATE INDEX "car_images_is_permanent_idx" ON "car_images"("is_permanent");

-- CreateIndex
CREATE INDEX "car_listings_listing_status_idx" ON "car_listings"("listing_status");

-- CreateIndex
CREATE INDEX "car_listings_user_id_idx" ON "car_listings"("user_id");

-- CreateIndex
CREATE INDEX "car_listings_car_id_idx" ON "car_listings"("car_id");

-- CreateIndex
CREATE INDEX "car_listings_asking_price_idx" ON "car_listings"("asking_price");

-- CreateIndex
CREATE INDEX "rentals_car_id_idx" ON "rentals"("car_id");

-- CreateIndex
CREATE INDEX "rentals_user_id_idx" ON "rentals"("user_id");

-- CreateIndex
CREATE INDEX "rentals_status_idx" ON "rentals"("status");

-- CreateIndex
CREATE INDEX "rentals_start_date_idx" ON "rentals"("start_date");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "car_catalog_images" ADD CONSTRAINT "car_catalog_images_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "car_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cars" ADD CONSTRAINT "user_cars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cars" ADD CONSTRAINT "user_cars_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "car_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "user_cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_listings" ADD CONSTRAINT "car_listings_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "user_cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_listings" ADD CONSTRAINT "car_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "user_cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
