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
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `renaksis`
--

LOCK TABLES `renaksis` WRITE;
/*!40000 ALTER TABLE `renaksis` DISABLE KEYS */;
INSERT INTO `renaksis` (`id`, `indikator_id`, `tahun`, `opd_id`, `nama_kegiatan`, `status`, `keterangan`, `kolaborasi_opd`, `created_at`, `updated_at`) VALUES (1,35,2025,12,'Publikasi data TFR kabupaten','Terlaksana','Dipresentasikan di rapat PJPK',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(2,35,2025,12,'Monitoring peserta KB aktif','Terlaksana','Data divalidasi bersama Puskesmas',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(3,35,2025,12,'Sosialisasi KB ke kecamatan','Tidak Terlaksana','Anggaran belum cair',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(4,37,2025,12,'Distribusi alat KB gratis','Terlaksana','18 kecamatan terlayani',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(5,37,2025,12,'Pelatihan bidan KB','Terlaksana','120 bidan terlatih',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(6,44,2025,14,'Survei stunting tingkat desa','Terlaksana','15 desa sudah disurvei',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(7,44,2025,14,'Pelatihan kader posyandu','Terlaksana','200 kader terlatih',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(8,44,2025,14,'Perbaikan gizi balita','Tidak Terlaksana','Menunggu distribusi PMT',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(9,38,2025,12,'Pengumpulan data iBangga','Terlaksana','18 kecamatan selesai',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(10,38,2025,12,'Verifikasi data lapangan','Tidak Terlaksana','Petugas belum lengkap','Dinkes','2026-07-02 07:56:58','2026-07-02 07:56:58'),(11,57,2025,18,'Jemput bola akta kelahiran','Terlaksana','5.000 balita terlayani',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(12,57,2025,18,'Sosialisasi kepemilikan akta','Terlaksana','Di 18 kecamatan',NULL,'2026-07-02 07:56:58','2026-07-02 07:56:58'),(13,57,2025,18,'Integrasi data RS-Dukcapil','Terlaksana','Sistem sudah terhubung','Dinkes','2026-07-02 07:56:58','2026-07-02 07:56:58'),(14,31,2025,10,'Optimalisasi pajak daerah Penambahan Wajib Pajak','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(15,31,2025,10,'Sosialisasi kepatuhan pajak Penambahan Wajib Pajak','Tidak Terlaksana','Jadwal bentrok dengan kegiatan lain',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(16,31,2025,10,'Pendataan wajib pajak Penambahan Wajib Pajak','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(17,31,2025,10,'Integrasi sistem pajak Penambahan Wajib Pajak','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(18,31,2025,10,'Evaluasi potensi pajak Penambahan Wajib Pajak','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(19,31,2026,10,'Pendataan wajib pajak Penambahan Wajib Pajak','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(20,31,2026,10,'Integrasi sistem pajak Penambahan Wajib Pajak','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(21,31,2026,10,'Evaluasi potensi pajak Penambahan Wajib Pajak','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(22,32,2025,11,'Analisis data Tingkat Kemiskinan','Terlaksana','Selesai 100%, laporan sudah diserahkan','Dinkes','2026-07-09 09:04:33','2026-07-09 09:04:33'),(23,32,2025,11,'Koordinasi perencanaan Tingkat Kemiskinan','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(24,32,2025,11,'Penyusunan dokumen Tingkat Kemiskinan','Tidak Terlaksana','Petugas belum tersedia',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(25,32,2026,11,'Penyusunan dokumen Tingkat Kemiskinan','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(26,32,2026,11,'Evaluasi program Tingkat Kemiskinan','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(27,33,2025,11,'Analisis data Gini Ratio','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(28,33,2025,11,'Koordinasi perencanaan Gini Ratio','Tidak Terlaksana','Perlu persetujuan pimpinan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(29,33,2025,11,'Penyusunan dokumen Gini Ratio','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(30,33,2025,11,'Evaluasi program Gini Ratio','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(31,33,2025,11,'Review dan rekomendasi kebijakan Gini Ratio','Tidak Terlaksana','Menunggu koordinasi lintas OPD',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(32,33,2026,11,'Penyusunan dokumen Gini Ratio','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(33,33,2026,11,'Evaluasi program Gini Ratio','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(34,34,2025,11,'Analisis data PDRB Per Kapita','Tidak Terlaksana','Anggaran belum cair',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(35,34,2025,11,'Koordinasi perencanaan PDRB Per Kapita','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(36,34,2025,11,'Penyusunan dokumen PDRB Per Kapita','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(37,34,2026,11,'Penyusunan dokumen PDRB Per Kapita','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(38,34,2026,11,'Evaluasi program PDRB Per Kapita','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(39,34,2026,11,'Review dan rekomendasi kebijakan PDRB Per Kapita','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(40,35,2025,12,'Sosialisasi Total Fertility Rate ke Kecamatan Porong','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap','Dukcapil','2026-07-09 09:04:33','2026-07-09 09:04:33'),(41,35,2025,12,'Pelatihan kader Total Fertility Rate','Tidak Terlaksana','Perlu persetujuan pimpinan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(42,35,2026,12,'Monitoring dan evaluasi Total Fertility Rate','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(43,35,2026,12,'Pendataan Total Fertility Rate tingkat desa','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(44,35,2026,12,'Koordinasi lintas sektor Total Fertility Rate','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(45,36,2025,12,'Sosialisasi ASFR 15-19 Tahun ke Kecamatan Buduran','Terlaksana','Terealisasi sesuai jadwal, output tercapai','Disdik','2026-07-09 09:04:33','2026-07-09 09:04:33'),(46,36,2025,12,'Pelatihan kader ASFR 15-19 Tahun','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(47,36,2025,12,'Monitoring dan evaluasi ASFR 15-19 Tahun','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(48,36,2025,12,'Pendataan ASFR 15-19 Tahun tingkat desa','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(49,36,2026,12,'Monitoring dan evaluasi ASFR 15-19 Tahun','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(50,37,2025,12,'Sosialisasi Proporsi KB Modern ke kecamatan perbatasan','Tidak Terlaksana','Anggaran belum cair',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(51,37,2025,12,'Pelatihan kader Proporsi KB Modern','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(52,37,2026,12,'Monitoring dan evaluasi Proporsi KB Modern','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(53,37,2026,12,'Pendataan Proporsi KB Modern tingkat desa','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(54,38,2025,12,'Sosialisasi Indeks iBangga ke seluruh desa/kelurahan','Tidak Terlaksana','Anggaran belum cair',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(55,38,2025,12,'Pelatihan kader Indeks iBangga','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(56,38,2025,12,'Monitoring dan evaluasi Indeks iBangga','Tidak Terlaksana','Petugas belum tersedia',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(57,38,2025,12,'Pendataan Indeks iBangga tingkat desa','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(58,38,2025,12,'Koordinasi lintas sektor Indeks iBangga','Tidak Terlaksana','Perlu persetujuan pimpinan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(59,38,2026,12,'Monitoring dan evaluasi Indeks iBangga','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(60,38,2026,12,'Pendataan Indeks iBangga tingkat desa','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(61,39,2025,12,'Sosialisasi Indeks Perlindungan Anak ke kecamatan perbatasan','Tidak Terlaksana','Perlu persetujuan pimpinan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(62,39,2025,12,'Pelatihan kader Indeks Perlindungan Anak','Tidak Terlaksana','Menunggu koordinasi lintas OPD',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(63,39,2025,12,'Monitoring dan evaluasi Indeks Perlindungan Anak','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(64,39,2025,12,'Pendataan Indeks Perlindungan Anak tingkat desa','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(65,39,2026,12,'Monitoring dan evaluasi Indeks Perlindungan Anak','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(66,39,2026,12,'Pendataan Indeks Perlindungan Anak tingkat desa','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(67,39,2026,12,'Koordinasi lintas sektor Indeks Perlindungan Anak','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(68,40,2025,12,'Sosialisasi Indeks Lansia Berdaya ke 18 kecamatan','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap','Dinkes','2026-07-09 09:04:33','2026-07-09 09:04:33'),(69,40,2025,12,'Pelatihan kader Indeks Lansia Berdaya','Tidak Terlaksana','Terkendala akses lokasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(70,40,2025,12,'Monitoring dan evaluasi Indeks Lansia Berdaya','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(71,40,2026,12,'Monitoring dan evaluasi Indeks Lansia Berdaya','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(72,40,2026,12,'Pendataan Indeks Lansia Berdaya tingkat desa','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(73,41,2025,12,'Sosialisasi Indeks Pengasuhan Remaja ke 18 kecamatan','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(74,41,2025,12,'Pelatihan kader Indeks Pengasuhan Remaja','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(75,41,2025,12,'Monitoring dan evaluasi Indeks Pengasuhan Remaja','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(76,41,2025,12,'Pendataan Indeks Pengasuhan Remaja tingkat desa','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(77,41,2025,12,'Koordinasi lintas sektor Indeks Pengasuhan Remaja','Tidak Terlaksana','Terkendala akses lokasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(78,41,2026,12,'Monitoring dan evaluasi Indeks Pengasuhan Remaja','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(79,41,2026,12,'Pendataan Indeks Pengasuhan Remaja tingkat desa','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(80,42,2025,12,'Sosialisasi Kampung KB Mandiri ke Kecamatan Gedangan','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(81,42,2025,12,'Pelatihan kader Kampung KB Mandiri','Tidak Terlaksana','Data pendukung belum lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(82,42,2025,12,'Monitoring dan evaluasi Kampung KB Mandiri','Tidak Terlaksana','Jadwal bentrok dengan kegiatan lain',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(83,42,2025,12,'Pendataan Kampung KB Mandiri tingkat desa','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(84,42,2026,12,'Monitoring dan evaluasi Kampung KB Mandiri','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(85,42,2026,12,'Pendataan Kampung KB Mandiri tingkat desa','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(86,42,2026,12,'Koordinasi lintas sektor Kampung KB Mandiri','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(87,43,2025,13,'Pembangunan infrastruktur RT Akses Sanitasi Aman','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(88,43,2025,13,'Rehabilitasi fasilitas RT Akses Sanitasi Aman','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(89,43,2025,13,'Pengadaan sarana prasarana RT Akses Sanitasi Aman','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(90,43,2025,13,'Peningkatan akses RT Akses Sanitasi Aman','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(91,43,2025,13,'Studi kelayakan RT Akses Sanitasi Aman','Tidak Terlaksana','Jadwal bentrok dengan kegiatan lain',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(92,43,2026,13,'Pengadaan sarana prasarana RT Akses Sanitasi Aman','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(93,43,2026,13,'Peningkatan akses RT Akses Sanitasi Aman','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(94,43,2026,13,'Studi kelayakan RT Akses Sanitasi Aman','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(95,44,2025,14,'Survei Prevalensi Stunting tingkat puskesmas','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(96,44,2025,14,'Pelatihan tenaga kesehatan tentang Prevalensi Stunting','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(97,44,2026,14,'Skrining Prevalensi Stunting di posyandu','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(98,45,2025,14,'Survei Angka Kematian Bayi tingkat puskesmas','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap','Dinkes','2026-07-09 09:04:33','2026-07-09 09:04:33'),(99,45,2025,14,'Pelatihan tenaga kesehatan tentang Angka Kematian Bayi','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(100,45,2025,14,'Skrining Angka Kematian Bayi di posyandu','Tidak Terlaksana','Menunggu koordinasi lintas OPD',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(101,45,2025,14,'Kampanye kesehatan Angka Kematian Bayi','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(102,45,2025,14,'Peningkatan kapasitas faskes untuk Angka Kematian Bayi','Tidak Terlaksana','Menunggu revisi juknis',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(103,45,2026,14,'Skrining Angka Kematian Bayi di posyandu','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(104,45,2026,14,'Kampanye kesehatan Angka Kematian Bayi','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(105,46,2025,14,'Survei Angka Kematian Ibu tingkat puskesmas','Tidak Terlaksana','Perlu persetujuan pimpinan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(106,46,2025,14,'Pelatihan tenaga kesehatan tentang Angka Kematian Ibu','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(107,46,2025,14,'Skrining Angka Kematian Ibu di posyandu','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(108,46,2026,14,'Skrining Angka Kematian Ibu di posyandu','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(109,46,2026,14,'Kampanye kesehatan Angka Kematian Ibu','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(110,47,2025,14,'Survei Cakupan JKN tingkat puskesmas','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(111,47,2025,14,'Pelatihan tenaga kesehatan tentang Cakupan JKN','Tidak Terlaksana','Petugas belum tersedia',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(112,47,2025,14,'Skrining Cakupan JKN di posyandu','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(113,47,2025,14,'Kampanye kesehatan Cakupan JKN','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(114,47,2026,14,'Skrining Cakupan JKN di posyandu','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(115,47,2026,14,'Kampanye kesehatan Cakupan JKN','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(116,47,2026,14,'Peningkatan kapasitas faskes untuk Cakupan JKN','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(117,48,2025,15,'Beasiswa pendidikan untuk siswa kurang mampu','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(118,48,2025,15,'Pelatihan guru tentang Rata-Rata Lama Sekolah','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(119,48,2026,15,'Pembangunan fasilitas pendidikan di daerah Kecamatan Sedati','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(120,49,2025,15,'Beasiswa pendidikan untuk siswa kurang mampu','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(121,49,2025,15,'Pelatihan guru tentang APK Perguruan Tinggi','Tidak Terlaksana','Menunggu revisi juknis',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(122,49,2025,15,'Pembangunan fasilitas pendidikan di daerah Kecamatan Buduran','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(123,49,2025,15,'Program literasi dan numerasi APK Perguruan Tinggi','Tidak Terlaksana','Petugas belum tersedia',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(124,49,2025,15,'Bimbingan belajar gratis APK Perguruan Tinggi','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(125,49,2026,15,'Pembangunan fasilitas pendidikan di daerah 18 kecamatan','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(126,49,2026,15,'Program literasi dan numerasi APK Perguruan Tinggi','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(127,49,2026,15,'Bimbingan belajar gratis APK Perguruan Tinggi','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(128,50,2025,16,'Job fair dan bursa kerja Pekerja Lulusan Sesuai Bidang','Tidak Terlaksana','Jadwal bentrok dengan kegiatan lain',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(129,50,2025,16,'Pelatihan vokasi Pekerja Lulusan Sesuai Bidang','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(130,50,2025,16,'Sertifikasi kompetensi Pekerja Lulusan Sesuai Bidang','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(131,50,2025,16,'Program padat karya Pekerja Lulusan Sesuai Bidang','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(132,50,2025,16,'Pendampingan UMKM Pekerja Lulusan Sesuai Bidang','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(133,50,2026,16,'Sertifikasi kompetensi Pekerja Lulusan Sesuai Bidang','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(134,51,2025,16,'Job fair dan bursa kerja TPAK Perempuan','Terlaksana','Berjalan lancar, semua target terpenuhi','Dinkes','2026-07-09 09:04:33','2026-07-09 09:04:33'),(135,51,2025,16,'Pelatihan vokasi TPAK Perempuan','Tidak Terlaksana','Anggaran belum cair',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(136,51,2025,16,'Sertifikasi kompetensi TPAK Perempuan','Tidak Terlaksana','Perlu persetujuan pimpinan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(137,51,2025,16,'Program padat karya TPAK Perempuan','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(138,51,2025,16,'Pendampingan UMKM TPAK Perempuan','Tidak Terlaksana','Terkendala akses lokasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(139,51,2026,16,'Sertifikasi kompetensi TPAK Perempuan','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(140,51,2026,16,'Program padat karya TPAK Perempuan','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(141,51,2026,16,'Pendampingan UMKM TPAK Perempuan','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(142,52,2025,16,'Job fair dan bursa kerja Pekerja Informal','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(143,52,2025,16,'Pelatihan vokasi Pekerja Informal','Tidak Terlaksana','Terkendala akses lokasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(144,52,2025,16,'Sertifikasi kompetensi Pekerja Informal','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(145,52,2025,16,'Program padat karya Pekerja Informal','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(146,52,2025,16,'Pendampingan UMKM Pekerja Informal','Tidak Terlaksana','Anggaran belum cair',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(147,52,2026,16,'Sertifikasi kompetensi Pekerja Informal','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(148,53,2025,16,'Job fair dan bursa kerja Penyandang Disabilitas Formal','Tidak Terlaksana','Menunggu revisi juknis',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(149,53,2025,16,'Pelatihan vokasi Penyandang Disabilitas Formal','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(150,53,2025,16,'Sertifikasi kompetensi Penyandang Disabilitas Formal','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(151,53,2025,16,'Program padat karya Penyandang Disabilitas Formal','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(152,53,2026,16,'Sertifikasi kompetensi Penyandang Disabilitas Formal','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(153,54,2025,16,'Job fair dan bursa kerja TPT','Tidak Terlaksana','Anggaran belum cair',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(154,54,2025,16,'Pelatihan vokasi TPT','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(155,54,2026,16,'Sertifikasi kompetensi TPT','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(156,55,2025,17,'Bantuan rumah tidak layak huni RT Akses Hunian Layak','Tidak Terlaksana','Menunggu revisi juknis','Dukcapil','2026-07-09 09:04:33','2026-07-09 09:04:33'),(157,55,2025,17,'Penyediaan hunian terjangkau RT Akses Hunian Layak','Tidak Terlaksana','Menunggu koordinasi lintas OPD',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(158,55,2025,17,'Peningkatan kawasan kumuh RT Akses Hunian Layak','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(159,55,2026,17,'Peningkatan kawasan kumuh RT Akses Hunian Layak','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(160,56,2025,18,'Jemput bola Kepadatan Penduduk ke desa','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(161,56,2025,18,'Integrasi data Kepadatan Penduduk dengan fasilitas kesehatan','Tidak Terlaksana','Data pendukung belum lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(162,56,2025,18,'Sosialisasi pentingnya Kepadatan Penduduk','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(163,56,2026,18,'Sosialisasi pentingnya Kepadatan Penduduk','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(164,56,2026,18,'Pelayanan keliling Kepadatan Penduduk','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(165,56,2026,18,'Pencetakan massal Kepadatan Penduduk','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(166,57,2025,18,'Jemput bola Akta Kelahiran Balita ke desa','Terlaksana','Sudah selesai dan divalidasi','Dinkes','2026-07-09 09:04:33','2026-07-09 09:04:33'),(167,57,2025,18,'Integrasi data Akta Kelahiran Balita dengan fasilitas kesehatan','Tidak Terlaksana','Perlu persetujuan pimpinan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(168,57,2025,18,'Sosialisasi pentingnya Akta Kelahiran Balita','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(169,57,2025,18,'Pelayanan keliling Akta Kelahiran Balita','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(170,57,2026,18,'Sosialisasi pentingnya Akta Kelahiran Balita','Terlaksana','Sedang berjalan, progress 60%',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(171,57,2026,18,'Pelayanan keliling Akta Kelahiran Balita','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(172,57,2026,18,'Pencetakan massal Akta Kelahiran Balita','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(173,58,2025,18,'Jemput bola Akta Cerai ke desa','Terlaksana','Pelaksanaan sesuai rencana, dokumentasi lengkap',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(174,58,2025,18,'Integrasi data Akta Cerai dengan fasilitas kesehatan','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(175,58,2025,18,'Sosialisasi pentingnya Akta Cerai','Tidak Terlaksana','Petugas belum tersedia',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(176,58,2025,18,'Pelayanan keliling Akta Cerai','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(177,58,2025,18,'Pencetakan massal Akta Cerai','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(178,58,2026,18,'Sosialisasi pentingnya Akta Cerai','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(179,59,2025,18,'Jemput bola Akta Nikah ke desa','Terlaksana','Sudah selesai dan divalidasi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(180,59,2025,18,'Integrasi data Akta Nikah dengan fasilitas kesehatan','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(181,59,2025,18,'Sosialisasi pentingnya Akta Nikah','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(182,59,2026,18,'Sosialisasi pentingnya Akta Nikah','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(183,60,2025,18,'Jemput bola Akta Kematian ke desa','Terlaksana','Terealisasi sesuai jadwal, output tercapai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(184,60,2025,18,'Integrasi data Akta Kematian dengan fasilitas kesehatan','Terlaksana','Selesai 100%, laporan sudah diserahkan',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(185,60,2025,18,'Sosialisasi pentingnya Akta Kematian','Tidak Terlaksana','Menunggu koordinasi lintas OPD',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(186,60,2025,18,'Pelayanan keliling Akta Kematian','Tidak Terlaksana','Menunggu revisi juknis',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(187,60,2025,18,'Pencetakan massal Akta Kematian','Terlaksana','Berjalan lancar, semua target terpenuhi',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(188,60,2026,18,'Sosialisasi pentingnya Akta Kematian','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33'),(189,60,2026,18,'Pelayanan keliling Akta Kematian','Terlaksana','Tahap persiapan selesai',NULL,'2026-07-09 09:04:33','2026-07-09 09:04:33');
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
INSERT INTO `target_capaians` (`id`, `indikator_id`, `tahun`, `target`, `capaian`, `gap`, `pct_gap`, `status_tl`, `warna_tl`, `keterangan`, `created_at`, `updated_at`) VALUES (1,35,2025,1.82,1.96,0.14,0.0769,'Warning','Kuning','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(2,35,2026,1.83,2.05,0.22,0.1202,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(3,35,2027,1.84,1.71,-0.13,-0.0707,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(4,35,2028,1.85,1.89,0.04,0.0216,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(5,35,2029,1.85,2.04,0.19,0.1027,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(6,36,2025,17.29,14.40,-2.89,-0.1671,'On Track','Hijau','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(7,36,2026,17.00,16.66,-0.34,-0.0200,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(8,36,2027,17.00,17.34,0.34,0.0200,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(9,36,2028,17.00,15.81,-1.19,-0.0700,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(10,36,2029,17.00,16.49,-0.51,-0.0300,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(11,37,2025,77.00,92.40,15.40,0.2000,'On Track','Hijau','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(12,37,2026,77.00,59.29,-17.71,-0.2300,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(13,37,2027,77.00,84.70,7.70,0.1000,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(14,37,2028,77.00,83.16,6.16,0.0800,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(15,37,2029,77.00,85.47,8.47,0.1100,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(16,48,2025,10.20,8.87,-1.33,-0.1304,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(17,48,2026,10.70,9.10,-1.60,-0.1495,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(18,48,2027,14.00,11.34,-2.66,-0.1900,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(19,48,2028,11.80,12.98,1.18,0.1000,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(20,48,2029,13.40,13.53,0.13,0.0097,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(21,49,2025,70.00,77.70,7.70,0.1100,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(22,49,2026,82.50,88.28,5.78,0.0701,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(23,49,2027,82.00,93.48,11.48,0.1400,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(24,49,2028,69.50,73.67,4.17,0.0600,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(25,49,2029,86.00,97.18,11.18,0.1300,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(26,50,2025,70.00,69.30,-0.70,-0.0100,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(27,50,2026,88.50,101.78,13.28,0.1501,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(28,50,2027,88.00,91.52,3.52,0.0400,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(29,50,2028,81.50,70.91,-10.59,-0.1299,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(30,50,2029,85.00,73.95,-11.05,-0.1300,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(31,44,2025,4.34,7.00,2.66,0.6129,'Alert','Merah','Menunggu laporan OPD','2026-07-02 07:56:58','2026-07-02 07:56:58'),(32,44,2026,4.27,5.34,1.07,0.2506,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(33,44,2027,4.24,4.11,-0.13,-0.0307,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(34,44,2028,4.22,4.01,-0.21,-0.0498,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(35,44,2029,4.15,4.27,0.12,0.0289,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(36,45,2025,11.20,10.98,-0.22,-0.0196,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(37,45,2026,11.00,10.78,-0.22,-0.0200,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(38,45,2027,10.80,10.37,-0.43,-0.0398,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(39,45,2028,10.60,9.96,-0.64,-0.0604,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(40,45,2029,10.40,10.19,-0.21,-0.0202,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(41,46,2025,106.00,99.64,-6.36,-0.0600,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(42,46,2026,105.00,103.95,-1.05,-0.0100,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(43,46,2027,104.00,97.76,-6.24,-0.0600,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(44,46,2028,103.00,100.94,-2.06,-0.0200,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(45,46,2029,102.00,96.90,-5.10,-0.0500,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(46,32,2025,8.38,11.15,2.77,0.3305,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(47,32,2026,8.12,7.39,-0.73,-0.0899,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(48,32,2027,7.85,10.52,2.67,0.3401,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(49,32,2028,7.58,7.73,0.15,0.0198,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(50,32,2029,7.31,6.80,-0.51,-0.0698,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(51,51,2025,54.41,50.06,-4.35,-0.0799,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(52,51,2026,55.29,62.48,7.19,0.1300,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(53,51,2027,56.18,39.33,-16.85,-0.2999,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(54,51,2028,57.06,54.78,-2.28,-0.0400,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(55,51,2029,57.95,66.06,8.11,0.1399,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(56,52,2025,6.30,6.11,-0.19,-0.0302,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(57,52,2026,6.31,8.52,2.21,0.3502,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(58,52,2027,6.32,6.00,-0.32,-0.0506,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(59,52,2028,6.33,6.84,0.51,0.0806,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(60,52,2029,6.34,6.28,-0.06,-0.0095,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(61,53,2025,0.02,0.02,0.00,0.0000,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(62,53,2026,0.03,0.02,-0.01,-0.3333,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(63,53,2027,0.03,0.03,0.00,0.0000,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(64,53,2028,0.03,0.03,0.00,0.0000,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(65,53,2029,0.03,0.03,0.00,0.0000,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(66,33,2025,0.35,0.33,-0.02,-0.0571,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(67,33,2026,0.34,0.44,0.10,0.2941,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(68,33,2027,0.33,0.31,-0.02,-0.0606,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(69,33,2028,0.32,0.30,-0.02,-0.0625,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(70,33,2029,0.31,0.35,0.04,0.1290,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(71,34,2025,59.00,67.26,8.26,0.1400,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(72,34,2026,99.50,91.54,-7.96,-0.0800,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(73,34,2027,82.00,87.74,5.74,0.0700,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(74,34,2028,94.50,95.45,0.95,0.0101,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(75,34,2029,67.00,71.02,4.02,0.0600,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(76,54,2025,3.38,3.79,0.41,0.1213,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(77,54,2026,3.03,2.82,-0.21,-0.0693,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(78,54,2027,2.96,2.90,-0.06,-0.0203,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(79,54,2028,2.89,2.60,-0.29,-0.1003,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(80,54,2029,2.82,3.13,0.31,0.1099,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(81,31,2025,89.00,79.21,-9.79,-0.1100,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(82,31,2026,75.50,64.18,-11.32,-0.1499,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(83,31,2027,92.00,95.68,3.68,0.0400,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(84,31,2028,88.50,92.93,4.43,0.0501,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(85,31,2029,71.00,79.52,8.52,0.1200,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(86,38,2025,60.50,60.30,-0.20,-0.0033,'Warning','Kuning','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(87,38,2026,61.00,67.71,6.71,0.1100,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(88,38,2027,61.50,65.81,4.31,0.0701,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(89,38,2028,62.00,57.66,-4.34,-0.0700,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(90,38,2029,62.50,59.38,-3.12,-0.0499,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(91,39,2025,63.90,53.68,-10.22,-0.1599,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(92,39,2026,64.10,51.92,-12.18,-0.1900,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(93,39,2027,65.10,63.15,-1.95,-0.0300,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(94,39,2028,66.10,71.39,5.29,0.0800,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(95,39,2029,68.10,72.19,4.09,0.0601,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(96,55,2025,17.35,14.75,-2.60,-0.1499,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(97,55,2026,18.21,20.76,2.55,0.1400,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(98,55,2027,19.03,20.36,1.33,0.0699,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(99,55,2028,19.81,16.64,-3.17,-0.1600,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(100,55,2029,20.49,15.37,-5.12,-0.2499,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(101,43,2025,6.82,7.23,0.41,0.0601,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(102,43,2026,7.13,7.20,0.07,0.0098,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(103,43,2027,8.02,7.62,-0.40,-0.0499,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(104,43,2028,9.31,9.68,0.37,0.0397,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(105,43,2029,10.51,9.77,-0.74,-0.0704,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(106,40,2025,57.60,70.20,12.60,0.2188,'On Track','Hijau','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(107,40,2026,57.60,58.18,0.58,0.0101,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(108,40,2027,57.60,52.99,-4.61,-0.0800,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(109,40,2028,57.60,43.78,-13.82,-0.2399,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(110,40,2029,57.60,44.93,-12.67,-0.2200,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(111,41,2025,79.90,80.30,0.40,0.0050,'On Track','Hijau','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(112,41,2026,79.90,77.50,-2.40,-0.0300,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(113,41,2027,79.90,83.10,3.20,0.0401,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(114,41,2028,79.90,75.91,-3.99,-0.0499,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(115,41,2029,79.90,52.73,-27.17,-0.3401,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(116,47,2025,87.36,83.87,-3.49,-0.0399,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(117,47,2026,89.27,76.77,-12.50,-0.1400,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(118,47,2027,91.18,93.00,1.82,0.0200,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(119,47,2028,93.09,66.09,-27.00,-0.2900,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(120,47,2029,95.00,84.55,-10.45,-0.1100,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(121,42,2025,8.80,9.06,0.26,0.0295,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(122,42,2026,10.00,9.60,-0.40,-0.0400,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(123,42,2027,20.00,19.20,-0.80,-0.0400,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(124,42,2028,30.00,25.50,-4.50,-0.1500,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(125,42,2029,40.00,32.80,-7.20,-0.1800,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(126,56,2025,628.28,645.00,16.72,0.0266,'Warning','Kuning','Data tersedia','2026-07-02 07:56:58','2026-07-02 07:56:58'),(127,56,2026,633.80,849.29,215.49,0.3400,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(128,56,2027,638.70,657.86,19.16,0.0300,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(129,56,2028,642.50,603.95,-38.55,-0.0600,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(130,56,2029,645.30,716.28,70.98,0.1100,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(131,57,2025,99.55,81.63,-17.92,-0.1800,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(132,57,2026,99.64,97.65,-1.99,-0.0200,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(133,57,2027,99.73,111.70,11.97,0.1200,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(134,57,2028,99.81,102.80,2.99,0.0300,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(135,57,2029,99.90,113.89,13.99,0.1400,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(136,58,2025,100.00,103.00,3.00,0.0300,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(137,58,2026,100.00,114.00,14.00,0.1400,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(138,58,2027,100.00,98.00,-2.00,-0.0200,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(139,58,2028,100.00,99.00,-1.00,-0.0100,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(140,58,2029,100.00,88.00,-12.00,-0.1200,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(141,59,2025,100.00,86.00,-14.00,-0.1400,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(142,59,2026,100.00,72.00,-28.00,-0.2800,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33'),(143,59,2027,100.00,93.00,-7.00,-0.0700,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(144,59,2028,100.00,86.00,-14.00,-0.1400,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(145,59,2029,100.00,105.00,5.00,0.0500,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(146,60,2025,100.00,86.00,-14.00,-0.1400,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(147,60,2026,100.00,109.00,9.00,0.0900,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(148,60,2027,100.00,91.00,-9.00,-0.0900,'Warning','Kuning','Perlu perhatian, mendekati batas toleransi','2026-07-02 07:56:58','2026-07-09 09:04:33'),(149,60,2028,100.00,115.00,15.00,0.1500,'On Track','Hijau','Capaian sesuai target','2026-07-02 07:56:58','2026-07-09 09:04:33'),(150,60,2029,100.00,70.00,-30.00,-0.3000,'Alert','Merah','Butuh intervensi segera','2026-07-02 07:56:58','2026-07-09 09:04:33');
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

-- Dump completed on 2026-07-13 20:14:41
