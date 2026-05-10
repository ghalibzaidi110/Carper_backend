-- CreateTable
CREATE TABLE "damage_scans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "car_id" TEXT,
    "vehicle_make" TEXT NOT NULL,
    "vehicle_model" TEXT NOT NULL,
    "vehicle_year" INTEGER NOT NULL,
    "vehicle_category" TEXT,
    "total_cost_pkr" INTEGER NOT NULL,
    "total_low_pkr" INTEGER NOT NULL,
    "total_high_pkr" INTEGER NOT NULL,
    "entry_count" INTEGER NOT NULL,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "dent_count" INTEGER NOT NULL DEFAULT 0,
    "scratch_count" INTEGER NOT NULL DEFAULT 0,
    "crack_count" INTEGER NOT NULL DEFAULT 0,
    "glass_shatter_count" INTEGER NOT NULL DEFAULT 0,
    "lamp_broken_count" INTEGER NOT NULL DEFAULT 0,
    "tire_flat_count" INTEGER NOT NULL DEFAULT 0,
    "cost_model_version" TEXT,
    "damage_model_version" TEXT,
    "detections_json" JSONB NOT NULL,
    "cover_image_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "damage_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "damage_scans_user_id_created_at_idx" ON "damage_scans"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "damage_scans_car_id_idx" ON "damage_scans"("car_id");

-- AddForeignKey
ALTER TABLE "damage_scans" ADD CONSTRAINT "damage_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_scans" ADD CONSTRAINT "damage_scans_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "user_cars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
