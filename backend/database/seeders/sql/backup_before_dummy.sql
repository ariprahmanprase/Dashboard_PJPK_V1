-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: pjpk_dashboard
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `indikators`
--

DROP TABLE IF EXISTS `indikators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `indikators` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `kode` varchar(10) NOT NULL COMMENT 'Kode: P1-01 s.d. P5-30',
  `no_urut` tinyint(3) unsigned NOT NULL COMMENT 'Nomor urut 1-30',
  `pilar_id` tinyint(3) unsigned NOT NULL,
  `opd_id` tinyint(3) unsigned NOT NULL,
  `nama_indikator` varchar(255) NOT NULL,
  `satuan` varchar(50) NOT NULL,
  `lower_better` enum('Ya','Tidak') NOT NULL DEFAULT 'Tidak',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `indikators_kode_unique` (`kode`),
  KEY `indikators_pilar_id_foreign` (`pilar_id`),
  KEY `indikators_opd_id_foreign` (`opd_id`),
  CONSTRAINT `indikators_opd_id_foreign` FOREIGN KEY (`opd_id`) REFERENCES `opds` (`id`) ON DELETE CASCADE,
  CONSTRAINT `indikators_pilar_id_foreign` FOREIGN KEY (`pilar_id`) REFERENCES `pilars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `indikators`
--

LOCK TABLES `indikators` WRITE;
/*!40000 ALTER TABLE `indikators` DISABLE KEYS */;
INSERT INTO `indikators` (`id`, `kode`, `no_urut`, `pilar_id`, `opd_id`, `nama_indikator`, `satuan`, `lower_better`, `created_at`, `updated_at`) VALUES (31,'P2-17',1,7,10,'Penambahan Wajib Pajak','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(32,'P2-10',2,7,11,'Tingkat Kemiskinan','%','Ya','2026-07-02 07:56:58','2026-07-02 07:56:58'),(33,'P2-14',3,7,11,'Gini Ratio','Indeks','Ya','2026-07-02 07:56:58','2026-07-02 07:56:58'),(34,'P2-15',4,7,11,'PDRB Per Kapita','Rp Juta','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(35,'P1-01',5,6,12,'Total Fertility Rate (TFR)','Anak/WUS','Ya','2026-07-02 07:56:58','2026-07-02 07:56:58'),(36,'P1-02',6,6,12,'ASFR 15-19 Tahun','/1000 WUS','Ya','2026-07-02 07:56:58','2026-07-02 07:56:58'),(37,'P1-03',7,6,12,'Proporsi KB Modern','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(38,'P3-18',8,8,12,'Indeks iBangga','Indeks','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(39,'P3-19',9,8,12,'Indeks Perlindungan Anak','Indeks','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(40,'P3-22',10,8,12,'Indeks Lansia Berdaya','Indeks','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(41,'P3-23',11,8,12,'Indeks Pengasuhan Remaja','Indeks','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(42,'P4-25',12,9,12,'Kampung KB Mandiri','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(43,'P3-21',13,8,13,'RT Akses Sanitasi Aman','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(44,'P2-07',14,7,14,'Prevalensi Stunting','%','Ya','2026-07-02 07:56:58','2026-07-02 07:56:58'),(45,'P2-08',15,7,14,'Angka Kematian Bayi (AKB)','/1000 KH','Ya','2026-07-02 07:56:58','2026-07-02 07:56:58'),(46,'P2-09',16,7,14,'Angka Kematian Ibu (AKI)','/100.000 KH','Ya','2026-07-02 07:56:58','2026-07-02 07:56:58'),(47,'P3-24',17,8,14,'Cakupan JKN','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(48,'P2-04',18,7,15,'Rata-Rata Lama Sekolah','Tahun','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(49,'P2-05',19,7,15,'APK Perguruan Tinggi','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(50,'P2-06',20,7,16,'Pekerja Lulusan Sesuai Bidang','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(51,'P2-11',21,7,16,'TPAK Perempuan','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(52,'P2-12',22,7,16,'Pekerja Informal','%','Ya','2026-07-02 07:56:58','2026-07-02 07:56:58'),(53,'P2-13',23,7,16,'Penyandang Disabilitas Formal','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(54,'P2-16',24,7,16,'TPT (Pengangguran Terbuka)','%','Ya','2026-07-02 07:56:58','2026-07-02 07:56:58'),(55,'P3-20',25,8,17,'RT Akses Hunian Layak','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(56,'P4-26',26,9,18,'Kepadatan Penduduk','Jiwa/km2','Ya','2026-07-02 07:56:58','2026-07-02 07:56:58'),(57,'P5-27',27,10,18,'Akta Kelahiran Balita','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(58,'P5-28',28,10,18,'Akta Cerai','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(59,'P5-29',29,10,18,'Akta Nikah','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58'),(60,'P5-30',30,10,18,'Akta Kematian','%','Tidak','2026-07-02 07:56:58','2026-07-02 07:56:58');
/*!40000 ALTER TABLE `indikators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_07_02_143842_create_opds_table',1),(5,'2026_07_02_143842_create_pilars_table',1),(6,'2026_07_02_143843_create_indikators_table',1),(7,'2026_07_02_143844_create_renaksis_table',1),(8,'2026_07_02_143844_create_target_capaians_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opds`
--

DROP TABLE IF EXISTS `opds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `opds` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `kode_opd` varchar(20) NOT NULL COMMENT 'Singkatan OPD',
  `nama_opd` varchar(100) NOT NULL COMMENT 'Nama lengkap OPD',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `opds_kode_opd_unique` (`kode_opd`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opds`
--

LOCK TABLES `opds` WRITE;
/*!40000 ALTER TABLE `opds` DISABLE KEYS */;
INSERT INTO `opds` (`id`, `kode_opd`, `nama_opd`, `created_at`, `updated_at`) VALUES (10,'BPPKAD','BPPKAD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(11,'Bappeda','Bappeda','2026-07-02 07:56:58','2026-07-02 07:56:58'),(12,'DP3AKB','DP3AKB','2026-07-02 07:56:58','2026-07-02 07:56:58'),(13,'DPUPR','DPUPR','2026-07-02 07:56:58','2026-07-02 07:56:58'),(14,'Dinkes','Dinkes','2026-07-02 07:56:58','2026-07-02 07:56:58'),(15,'Disdik','Disdik','2026-07-02 07:56:58','2026-07-02 07:56:58'),(16,'Disnaker','Disnaker','2026-07-02 07:56:58','2026-07-02 07:56:58'),(17,'Disperkim','Disperkim','2026-07-02 07:56:58','2026-07-02 07:56:58'),(18,'Dukcapil','Dukcapil','2026-07-02 07:56:58','2026-07-02 07:56:58');
/*!40000 ALTER TABLE `opds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pilars`
--

DROP TABLE IF EXISTS `pilars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pilars` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `no_pilar` tinyint(3) unsigned NOT NULL COMMENT 'Nomor pilar 1-5',
  `nama_pilar` varchar(100) NOT NULL COMMENT 'Nama lengkap pilar',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pilars_no_pilar_unique` (`no_pilar`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pilars`
--

LOCK TABLES `pilars` WRITE;
/*!40000 ALTER TABLE `pilars` DISABLE KEYS */;
INSERT INTO `pilars` (`id`, `no_pilar`, `nama_pilar`, `created_at`, `updated_at`) VALUES (6,1,'Pilar 1: Kuantitas Penduduk','2026-07-02 07:56:58','2026-07-02 07:56:58'),(7,2,'Pilar 2: Kualitas Penduduk','2026-07-02 07:56:58','2026-07-02 07:56:58'),(8,3,'Pilar 3: Pembangunan Keluarga','2026-07-02 07:56:58','2026-07-02 07:56:58'),(9,4,'Pilar 4: Persebaran Penduduk','2026-07-02 07:56:58','2026-07-02 07:56:58'),(10,5,'Pilar 5: Administrasi Kependudukan','2026-07-02 07:56:58','2026-07-02 07:56:58');
/*!40000 ALTER TABLE `pilars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `renaksis`
--

DROP TABLE IF EXISTS `renaksis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `renaksis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `indikator_id` tinyint(3) unsigned NOT NULL,
  `tahun` year(4) NOT NULL,
  `opd_id` tinyint(3) unsigned NOT NULL,
  `nama_kegiatan` varchar(255) NOT NULL,
  `status` enum('Terlaksana','Tidak Terlaksana') NOT NULL DEFAULT 'Terlaksana',
  `keterangan` text DEFAULT NULL,
  `kolaborasi_opd` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `renaksis_indikator_id_foreign` (`indikator_id`),
  KEY `renaksis_opd_id_foreign` (`opd_id`),
  CONSTRAINT `renaksis_indikator_id_foreign` FOREIGN KEY (`indikator_id`) REFERENCES `indikators` (`id`) ON DELETE CASCADE,
  CONSTRAINT `renaksis_opd_id_foreign` FOREIGN KEY (`opd_id`) REFERENCES `opds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `renaksis`
--

LOCK TABLES `renaksis` WRITE;
/*!40000 ALTER TABLE `renaksis` DISABLE KEYS */;
INSERT INTO `renaksis` (`id`, `indikator_id`, `tahun`, `opd_id`, `nama_kegiatan`, `status`, `keterangan`, `kolaborasi_opd`, `created_at`, `updated_at`) VALUES (1,35,2025,12,'Publikasi data TFR kabupaten','Terlaksana','Dipresentasikan di rapat PJPK',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(2,35,2025,12,'Monitoring peserta KB aktif','Terlaksana','Data divalidasi bersama Puskesmas',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(3,35,2025,12,'Sosialisasi KB ke kecamatan','Tidak Terlaksana','Anggaran belum cair',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(4,37,2025,12,'Distribusi alat KB gratis','Terlaksana','18 kecamatan terlayani',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(5,37,2025,12,'Pelatihan bidan KB','Terlaksana','120 bidan terlatih',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(6,44,2025,14,'Survei stunting tingkat desa','Terlaksana','15 desa sudah disurvei',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(7,44,2025,14,'Pelatihan kader posyandu','Terlaksana','200 kader terlatih',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(8,44,2025,14,'Perbaikan gizi balita','Tidak Terlaksana','Menunggu distribusi PMT',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(9,38,2025,12,'Pengumpulan data iBangga','Terlaksana','18 kecamatan selesai',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(10,38,2025,12,'Verifikasi data lapangan','Tidak Terlaksana','Petugas belum lengkap','Dinkes','2026-07-02 07:56:58','2026-07-02 07:56:58'),(11,57,2025,18,'Jemput bola akta kelahiran','Terlaksana','5.000 balita terlayani',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(12,57,2025,18,'Sosialisasi kepemilikan akta','Terlaksana','Di 18 kecamatan',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(13,57,2025,18,'Integrasi data RS-Dukcapil','Terlaksana','Sistem sudah terhubung','Dinkes','2026-07-02 07:56:58','2026-07-02 07:56:58');
/*!40000 ALTER TABLE `renaksis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES ('rnVmD6XAt3UesYtS6Mu6F42yGI5AzZ1aI9NAYfF0',NULL,'127.0.0.1','curl/8.14.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoiTmdBNWFUSkh6U2tLUUlld3FXUm82T09hMFlHNHl4dFprOEhocWJyTCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHA6Ly8xMjcuMC4wLjE6ODA4MC9pbXBvcnQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1783003780),('Trr9eOaCBlJEWBydRbIHd3KlPVe4P6Qi5GBAM9gW',NULL,'127.0.0.1','curl/8.14.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoiOHNmSE8xOG1IdUhwVllKZEIxT2lWMlV5eE5YOUFWS1J1eHdBTWxIcSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9pbXBvcnQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1783003744);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `target_capaians`
--

DROP TABLE IF EXISTS `target_capaians`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `target_capaians` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `indikator_id` tinyint(3) unsigned NOT NULL,
  `tahun` year(4) NOT NULL,
  `target` decimal(10,2) DEFAULT NULL,
  `capaian` decimal(10,2) DEFAULT NULL,
  `gap` decimal(10,2) DEFAULT NULL COMMENT 'Gap = Capaian - Target',
  `pct_gap` decimal(7,4) DEFAULT NULL COMMENT 'Persentase gap',
  `status_tl` enum('On Track','Warning','Alert','Belum Diisi') NOT NULL DEFAULT 'Belum Diisi',
  `warna_tl` enum('Hijau','Kuning','Merah','Abu') NOT NULL DEFAULT 'Abu',
  `keterangan` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `target_capaians_indikator_id_tahun_unique` (`indikator_id`,`tahun`),
  CONSTRAINT `target_capaians_indikator_id_foreign` FOREIGN KEY (`indikator_id`) REFERENCES `indikators` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `target_capaians`
--

LOCK TABLES `target_capaians` WRITE;
/*!40000 ALTER TABLE `target_capaians` DISABLE KEYS */;
INSERT INTO `target_capaians` (`id`, `indikator_id`, `tahun`, `target`, `capaian`, `gap`, `pct_gap`, `status_tl`, `warna_tl`, `keterangan`, `created_at`, `updated_at`) VALUES (1,35,2025,1.82,1.96,0.14,0.0769,'Warning','Kuning','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(2,35,2026,1.83,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(3,35,2027,1.84,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(4,35,2028,1.85,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(5,35,2029,1.85,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(6,36,2025,17.29,14.40,-2.89,-0.1671,'On Track','Hijau','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(7,36,2026,17.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(8,36,2027,17.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(9,36,2028,17.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(10,36,2029,17.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(11,37,2025,77.00,92.40,15.40,0.2000,'On Track','Hijau','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(12,37,2026,77.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(13,37,2027,77.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(14,37,2028,77.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(15,37,2029,77.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(16,48,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(17,48,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(18,48,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(19,48,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(20,48,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(21,49,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(22,49,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(23,49,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(24,49,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(25,49,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(26,50,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(27,50,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(28,50,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(29,50,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(30,50,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(31,44,2025,4.34,7.00,2.66,0.6129,'Alert','Merah','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(32,44,2026,4.27,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(33,44,2027,4.24,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(34,44,2028,4.22,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(35,44,2029,4.15,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(36,45,2025,11.20,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(37,45,2026,11.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(38,45,2027,10.80,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(39,45,2028,10.60,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(40,45,2029,10.40,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(41,46,2025,106.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(42,46,2026,105.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(43,46,2027,104.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(44,46,2028,103.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(45,46,2029,102.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(46,32,2025,8.38,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(47,32,2026,8.12,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(48,32,2027,7.85,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(49,32,2028,7.58,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(50,32,2029,7.31,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(51,51,2025,54.41,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(52,51,2026,55.29,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(53,51,2027,56.18,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(54,51,2028,57.06,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(55,51,2029,57.95,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(56,52,2025,6.30,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(57,52,2026,6.31,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(58,52,2027,6.32,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(59,52,2028,6.33,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(60,52,2029,6.34,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(61,53,2025,0.02,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(62,53,2026,0.03,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(63,53,2027,0.03,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(64,53,2028,0.03,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(65,53,2029,0.03,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(66,33,2025,0.35,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(67,33,2026,0.34,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(68,33,2027,0.33,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(69,33,2028,0.32,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(70,33,2029,0.31,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(71,34,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(72,34,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(73,34,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(74,34,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(75,34,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(76,54,2025,3.38,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(77,54,2026,3.03,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(78,54,2027,2.96,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(79,54,2028,2.89,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(80,54,2029,2.82,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(81,31,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(82,31,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(83,31,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(84,31,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(85,31,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu','Target belum ditetapkan','2026-07-02 07:56:58','2026-07-02 07:56:58'),(86,38,2025,60.50,60.30,-0.20,-0.0033,'Warning','Kuning','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(87,38,2026,61.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(88,38,2027,61.50,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(89,38,2028,62.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(90,38,2029,62.50,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(91,39,2025,63.90,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(92,39,2026,64.10,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(93,39,2027,65.10,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(94,39,2028,66.10,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(95,39,2029,68.10,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(96,55,2025,17.35,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(97,55,2026,18.21,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(98,55,2027,19.03,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(99,55,2028,19.81,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(100,55,2029,20.49,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(101,43,2025,6.82,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(102,43,2026,7.13,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(103,43,2027,8.02,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(104,43,2028,9.31,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(105,43,2029,10.51,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(106,40,2025,57.60,70.20,12.60,0.2188,'On Track','Hijau','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(107,40,2026,57.60,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(108,40,2027,57.60,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(109,40,2028,57.60,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(110,40,2029,57.60,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(111,41,2025,79.90,80.30,0.40,0.0050,'On Track','Hijau','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(112,41,2026,79.90,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(113,41,2027,79.90,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(114,41,2028,79.90,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(115,41,2029,79.90,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(116,47,2025,87.36,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(117,47,2026,89.27,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(118,47,2027,91.18,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(119,47,2028,93.09,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(120,47,2029,95.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(121,42,2025,8.80,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(122,42,2026,10.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(123,42,2027,20.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(124,42,2028,30.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(125,42,2029,40.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(126,56,2025,628.28,645.00,16.72,0.0266,'Warning','Kuning','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(127,56,2026,633.80,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(128,56,2027,638.70,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(129,56,2028,642.50,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(130,56,2029,645.30,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(131,57,2025,99.55,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(132,57,2026,99.64,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(133,57,2027,99.73,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(134,57,2028,99.81,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(135,57,2029,99.90,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(136,58,2025,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(137,58,2026,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(138,58,2027,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(139,58,2028,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(140,58,2029,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(141,59,2025,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(142,59,2026,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(143,59,2027,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(144,59,2028,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(145,59,2029,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(146,60,2025,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(147,60,2026,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(148,60,2027,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(149,60,2028,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(150,60,2029,100.00,NULL,NULL,NULL,'Belum Diisi','Abu','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58');
/*!40000 ALTER TABLE `target_capaians` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-09 23:02:54
