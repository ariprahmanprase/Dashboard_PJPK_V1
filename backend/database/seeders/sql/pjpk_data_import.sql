-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: dashboard_pjpk
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
-- Table structure for table `indikator_opd`
--

DROP TABLE IF EXISTS `indikator_opd`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `indikator_opd` (
  `indikator_id` tinyint(3) unsigned NOT NULL,
  `opd_id` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`indikator_id`,`opd_id`),
  KEY `indikator_opd_opd_id_foreign` (`opd_id`),
  CONSTRAINT `indikator_opd_indikator_id_foreign` FOREIGN KEY (`indikator_id`) REFERENCES `indikators` (`id`) ON DELETE CASCADE,
  CONSTRAINT `indikator_opd_opd_id_foreign` FOREIGN KEY (`opd_id`) REFERENCES `opds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `indikator_opd`
--

LOCK TABLES `indikator_opd` WRITE;
/*!40000 ALTER TABLE `indikator_opd` DISABLE KEYS */;
INSERT INTO `indikator_opd` VALUES (86,96),(86,97),(87,96),(87,97),(87,98),(87,99),(87,100),(87,101),(88,96),(88,97),(89,98),(89,99),(89,100),(89,102),(90,98),(90,103),(90,104),(91,96),(91,105),(92,97),(92,98),(92,101),(92,106),(92,107),(92,108),(92,109),(92,110),(92,111),(92,112),(92,113),(93,97),(94,97),(95,96),(95,97),(95,98),(95,101),(95,104),(95,105),(95,110),(95,111),(95,114),(95,115),(96,96),(96,116),(97,115),(97,116),(97,117),(97,118),(98,101),(98,116),(99,96),(99,97),(99,98),(99,101),(99,104),(99,105),(99,110),(99,111),(99,114),(99,115),(100,115),(100,118),(101,116),(101,119),(101,120),(101,121),(102,122),(103,96),(103,97),(103,98),(103,104),(103,105),(103,110),(103,111),(103,112),(103,123),(103,124),(103,125),(104,97),(104,98),(104,104),(104,111),(104,112),(104,114),(104,123),(104,126),(104,127),(105,110),(105,113),(105,123),(106,113),(107,96),(107,97),(107,101),(107,128),(108,97),(108,98),(108,101),(108,127),(108,129),(109,97),(109,101),(110,96),(110,97),(110,98),(110,101),(110,123),(110,130),(111,105),(111,110),(111,114),(111,131),(112,96),(112,112),(112,127),(112,132),(112,133),(113,96),(113,112),(113,127),(113,132),(113,133),(114,96),(114,112),(114,127),(114,132),(114,133),(115,96),(115,112),(115,127),(115,132),(115,133);
/*!40000 ALTER TABLE `indikator_opd` ENABLE KEYS */;
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
  `opd_id` tinyint(3) unsigned DEFAULT NULL,
  `nama_indikator` varchar(255) NOT NULL,
  `satuan` varchar(50) NOT NULL,
  `sumber_data` text DEFAULT NULL,
  `baseline_2024` decimal(10,2) DEFAULT NULL,
  `dokrenda` text DEFAULT NULL,
  `kendala` text DEFAULT NULL,
  `inovasi` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `indikators_kode_unique` (`kode`),
  KEY `indikators_pilar_id_foreign` (`pilar_id`),
  KEY `indikators_opd_id_foreign` (`opd_id`),
  CONSTRAINT `indikators_pilar_id_foreign` FOREIGN KEY (`pilar_id`) REFERENCES `pilars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `indikators`
--

LOCK TABLES `indikators` WRITE;
/*!40000 ALTER TABLE `indikators` DISABLE KEYS */;
INSERT INTO `indikators` VALUES (86,'P1-01',1,31,96,'Total Fertility Rate (TFR)','','PK24 Kemendukbangga/\nBKKBN',1.84,'Indikator Program RPJMD (Program Pengendalian Penduduk)','Ketersediaan alokon untuk akseptor masih perlu dimaksimalkan, Masalah biaya hidup yang tinggi, tingginya partisipasi peremuan di dunia kerja, perubahan gaya hidup generasi muda serta disparitas demografi wilayah',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(87,'P1-02',2,31,96,'Age-Specific Fertility Rate (ASFR) 15-19 tahun','','PK24 Kemendukbangga',39.30,'Indikator Program RPJMD (Program Pengendalian Penduduk)',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(88,'P1-03',3,31,96,'Proporsi Kebutuhan KB yang Terpenuhi (Demand Satisfied)','','PK24 Kemendukbangga/\nBKKBN',7.10,'Indikator Kinerja Kunci (IKK) RPJMD Pengendalian Penduduk dan KB',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(89,'P2-01',4,32,98,'Rata-Rata Lama Sekolah Penduduk Usia 15 Tahun ke Atas (tahun)','','Susenas BPS',10.91,'Indikator Utama Pembangunan (IUP) RPJPD, Indikator Kinerja Daerah (IKD) RPJMD Aspek Kesejahteraan Masyarakat','1. Anak usia 15 tahun yang ATS (Anak Tidak Sekolah) dikarenakan sudah bekerja dan tidak ingin melanjutkan sekolah                     2. Melanjutkan ke sekolah pondok sehingga tidak tercatat di dapodik Kemendikdasmen                              3. Anak - anak berkebutuhan khusus yang tidak melanjutkan sekolah sehingga tidak tercatat di dapodik Kemendikdasmen','Menggalakkan kembali PKBM (Pusat Kegiatan Belajar Masyarakat) dengan kegiatannya kejar Paket A, B dan C','2026-07-30 08:21:04','2026-07-30 08:21:04'),(90,'P2-02',5,32,98,'Angka Partisipasi Kasar (APK) Perguruan Tinggi (%)','','BPS Kota Sidoarjo \n*APK 19-24 th',18.34,'Indikator Kinerja Daerah (IKD) RPJMD Aspek Daya Saing Daerah (Indikator Proporsi Penduduk Berusia 15 Tahun ke Atas yang Berkualifikasi Pendidikan Tinggi)',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(91,'P2-03',6,32,105,'Jumlah Tenaga Kerja Tersertifikasi Kompetensi Kerja/ Persentase Pekerja Lulusan Pendidikan Menengah dan Tinggi yang Bekerja di Bidang Keahlian Menengah Tinggi','','Dinkopum',NULL,'Indikator Kinerja Kunci (IKK) RPJMD Ketenagakerjaan (Indikator % Pelatihan Berbasis Kompetensi)',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(92,'P2-04',7,32,97,'Prevalensi Stunting (Persentase Balita dengan Tinggi Badan di Bawah Standar)','','SKI/SSGI Kemenkes',10.60,'IUP RPJPD, Indikator Kinerja Daerah (IKD) RPJMD Aspek Kesejahteraan Masyarakat','Data stunting yang diakui adalah data penghitungan dari pusat, yaitu SKI (5 tahun sekali) dan SSGI (1 tahun sekali). Untuk tahun 2025 tidak ada pengukuran SSGI, sehingga angka capaian yang dipakai adalah SSGI pengukuran tahun 2024 yaitu 10,6%.\n10,6 ini tidak diukur berdasarkan TB/ U (umumnya penghitungan stunting), namun menggunakan sistem SAE (Small Area Estimation), yaitu metode untuk memperoleh nilai estimasi parameter yang reliabel pada level sub populasi (area atau domain) dimana ukuran sampelnya tidak cukup atau bahkan tidak ada sampelnya sama sekali. Sehingga angka 10,6 tersebut termasuk dalam salah satu yang RSE (Relative Standar Eror) nya tinggi (> 25%).',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(93,'P2-05',8,32,97,'Angka Kematian Bayi (AKB)','','Dinas Kesehatan',NULL,'Indikator Kegiatan Renstra Dinas Kesehatan','Jumlah kematian bayi 2025 adalah 193 orang. Jika disandingkan dengan target nasional (12,62 per 1.000 KH), maka capaian AKB tahun 2025 Kabupaten Sidoarjo masih dibawah target nasional. (Sumber data: MPDN, 2025. Diakses tgl: 14 Januari 2026)\nc) Indikator ini sebenarnya sudah tidak lagi dipasang di renstra baru, tahun 2025-2029. Karena renstra baru menyebutkan Angka Kematian Balita (berdasarkan indikator mandatory RIBK)',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(94,'P2-06',9,32,97,'Angka Kematian Ibu (AKI)','','Dinas Kesehatan',NULL,'IUP RPJPD, Indikator Kinerja Daerah (IKD) RPJMD Aspek Kesejahteraan Masyarakat','Jumlah kematian ibu tahun 2025 sebanyak 24 ibu, dan jumlah lahir hidup proyeksi menurut KMK tahun 2025 adalah 29.176',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(95,'P2-07',10,32,101,'Tingkat Kemiskinan','','Susenas BPS',4.53,'Indikator Sasaran RPJPD, Indikator Kinerja Utama (IKU) RPJMD',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(96,'P2-08',11,32,116,'Tingkat Partisipasi Angkatan Kerja Perempuan','','Sakernas BPS',54.23,'IUP RPJPD, Indikator Kinerja Daerah (IKD) RPJMD Aspek Kesejahteraan Masyarakat',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(97,'P2-09',12,32,116,'Persentase Pekerja Informal','','Sakernas BPS',NULL,'Indikator Kegiatan Renstra Dinkopum',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(98,'P2-10',13,32,116,'Persentase Penyandang Disabilitas Bekerja di Sektor Formal','','Dinas Sosial',NULL,'Indikator Kegiatan Renstra Dinkopum',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(99,'P2-11',14,32,101,'Gini Ratio','','Susenas BPS',0.33,'Indikator Sasaran RPJPD, Indikator Kinerja Utama (IKU) RPJMD',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(100,'P2-12',15,32,118,'Produk Domestik Regional Bruto (PDRB) Perkapita','','BPS',137.00,'Indikator Sasaran RPJPD, Indikator Kinerja Utama (IKU) RPJMD',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(101,'P2-13',16,32,116,'Tingkat Pengangguran Terbuka','','Sakernas BPS',6.49,'IUP RPJPD, Indikator Kinerja Utama (IKU) RPJMD',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(102,'P2-14',17,32,122,'Persentase Penambahan Wajib Pajak Hasil Ekstensifikasi','','BPPKAD',NULL,'ndikator Program RPJMD (Program Pengelolaan Pendapatan Daerah, indikator % Objek, subjek pajak baru yang terdata menjadi OP/WP); IUP RPJPD (Indikator Rasio pajak terhadap PDRB)',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(103,'P3-01',18,33,96,'Indeks Pembangunan Keluarga (i-bangga)','','Kemendukbangga/BKKBN',NULL,'IUP RPJPD, Indikator Kinerja Daerah (IKD) RPJMD Aspek Kesejahteraan Masyarakat',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(104,'P3-02',19,33,126,'Indeks Perlindungan Anak','','SIGA KemenPPPA',NULL,'IUP RPJPD, Indikator Kinerja Daerah (IKD) RPJMD Aspek Kesejahteraan Masyarakat',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(105,'P3-03',20,33,110,'Rumah Tangga dengan Akses Hunian Layak, Terjangkau, dan Berkelanjutan (%)','','DP2CKTR',NULL,'IUP RPJPD, Indikator Kinerja Daerah (IKD) RPJMD Aspek Kesejahteraan Masyarakat',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(106,'P3-04',21,33,113,'Rumah Tangga dengan Akses Sanitasi Aman (%)','','DPUPR',NULL,'IUP RPJPD, Indikator Kinerja Daerah (IKD) RPJMD Aspek Geografi dan Demografi',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(107,'P3-05',22,33,96,'Indeks Lansia Berdaya','','PK23 Kemendukbangga/ BKKBN',NULL,'Indikator Program RPJMD (Program Pemberdayaan dan Peningkatan Keluarga Sejahtera)',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(108,'P3-06',23,33,129,'Indeks Pengasuhan Keluarga yang Memiliki Remaja','','PK23 Kemendukbangga/ BKKBN',NULL,'Indikator Program RPJMD (Program Pemberdayaan dan Peningkatan Keluarga Sejahtera)',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(109,'P3-07',24,33,97,'Cakupan Kepesertaan Jaminan Kesehatan Nasional (%)','','BPJS Kesehatan',NULL,'Indikator Kinerja Daerah (IKD) RPJMD Aspek Kesejahteraan Masyarakat',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(110,'P4-01',25,34,96,'Persentase Kampung Keluarga Berkualitas Mandiri','','Kemendukbangga',NULL,'Indikator Kinerja Kunci (IKK) RPJMD Administrasi Kependudukan dan Pencatatan Sipil (Indikator',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(111,'P4-02',26,34,131,'Kepadatan Penduduk','','BPS',NULL,'Substansi tekanan kependudukan melalui indikator Laju Pertumbuhan Penduduk (IKD RPJMD); Rasio Permukiman Layak Huni; Persentase Pengurangan Luasan Permukiman Kumuh di Kawasan Perkotaan; Persentase Penurunan Rumah Tidak Layak Huni; dan Persentase Perumahan yang Tertata (Indikator Program RPJMD)',NULL,NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(112,'P5-01',27,35,132,'Cakupan (Persentase) Kepemilikan Akta Kelahiran Balita (0-4 tahun)','','Dispendukcapil',0.98,'Indikator Kinerja Kunci (IKK) RPJMD Administrasi Kependudukan dan Pencatatan Sipil (Indikator Persentase Kepemilikan Akta Kelahiran Usia 0-18), Indikator Sasaran Renstra/Indikator Kinerja Utama (IKU) Kepala Dispendukcapil','Kurangnya ketersediaan SDM untuk memproses akta kelahiran balita (0-4 tahun)','PKS kerjasama dengan mitra layanan (RS, Puskesmas, dsb) dan PKS kerjasama dengan Perguruan Tinggi untuk program magang','2026-07-30 08:21:04','2026-07-30 08:21:04'),(113,'P5-02',28,35,132,'Cakupan (Persentase) Kepemilikan Akta Cerai bagi Penduduk yang Bercerai','','Dispendukcapil, Pengadilan Agama, Pengadilan Negeri',1.00,'Indikator Kinerja Kunci (IKK) RPJMD Administrasi Kependudukan dan Pencatatan Sipil (Indikator % Kepemilikan Akta Perceraian), Indikator Sasaran Renstra/IKU Kepala  Dispendukcapil','Kurangnya kesadaran masyarakat untuk melakukan update dokumen kependudukan (Kartu Keluarga) khususnya pada pembaruan akta cerai pada status cerai','Layanan terintegrasi akta perceraian, status cerai pada KK otomatis diperbarui, dan melaksanakan PKS dengan Pengadilan agama terkait penerbitan KK baru bagi penduduk yang diterbitkan surat cerainya oleh Pengadilan Agama','2026-07-30 08:21:04','2026-07-30 08:21:04'),(114,'P5-03',29,35,132,'Cakupan (Persentase) Kepemilikan Akta Nikah','','Dispendukcapil',1.00,'Indikator Kinerja Kunci (IKK) RPJMD Administrasi Kependudukan dan Pencatatan Sipil (Indikator % Kepemilikan Akta Perkawinan), Indikator Sasaran Renstra/IKU Kepala Dispendukcapil','Kurangnya kesadaran masyarakat untuk melakukan update dokumen kependudukan (Kartu Keluarga) khususnya pada pembaruan akta perkawinan/surat nikah pada status kawin','Layanan terintegrasi akta perkawinan, status kawin pada KK otomatis diperbarui, dan melaksanakan PKS dengan Kemenag/KUA  terkait penerbitan KK baru bagi penduduk yang diterbitkan surat kawinnya oleh KUA','2026-07-30 08:21:04','2026-07-30 08:21:04'),(115,'P5-04',30,35,132,'Cakupan (Persentase) Kepemilikan Akta Kematian bagi Penduduk yang Meninggal','','Dispendukcapil',1.00,'Indikator Sasaran Renstra/IKU Kepala Dispendukcapil (Indikator % Kepemilikan Akta Kematian)','Kurangnya kesadaran masyarakat untuk mengurus akta kematian bagi keluarganya yang mengalami peristiwa kematian, sehingga data kependudukannya belum mutakhir','Layanan e tamat yang bekerjasama dengan mitra rumah sakit dalam kepengurusan akta kematian','2026-07-30 08:21:04','2026-07-30 08:21:04');
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_07_02_143842_create_opds_table',1),(5,'2026_07_02_143842_create_pilars_table',1),(6,'2026_07_02_143843_create_indikators_table',1),(7,'2026_07_02_143844_create_renaksis_table',1),(8,'2026_07_02_143844_create_target_capaians_table',1),(9,'2026_07_30_000001_update_indikators_and_add_pivot',2),(10,'2026_07_30_000002_widen_opd_columns',3),(11,'2026_07_30_000003_drop_kode_opd_unique',4),(12,'2026_07_30_000004_widen_indikator_text_columns',5);
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
  `kode_opd` varchar(100) NOT NULL,
  `nama_opd` varchar(150) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opds`
--

LOCK TABLES `opds` WRITE;
/*!40000 ALTER TABLE `opds` DISABLE KEYS */;
INSERT INTO `opds` VALUES (96,'DP3A','DP3AKB','2026-07-30 08:21:03','2026-07-30 08:21:03'),(97,'DinaKese','Dinas Kesehatan','2026-07-30 08:21:04','2026-07-30 08:21:04'),(98,'Disp','Dispendikbud','2026-07-30 08:21:04','2026-07-30 08:21:04'),(99,'Keme','Kemenag','2026-07-30 08:21:04','2026-07-30 08:21:04'),(100,'cabdispro','Cabang Dispendikbud Prov. Jatim Wilayah Sidoarjo','2026-07-30 08:21:04','2026-07-30 08:21:04'),(101,'DinaSosi','Dinas Sosial','2026-07-30 08:21:04','2026-07-30 08:21:04'),(102,'Disp','Disperpusip','2026-07-30 08:21:04','2026-07-30 08:21:04'),(103,'Disp','Disporapar','2026-07-30 08:21:04','2026-07-30 08:21:04'),(104,'Bag.Kesr','Bag. Kesra','2026-07-30 08:21:04','2026-07-30 08:21:04'),(105,'Dink','Dinkopum','2026-07-30 08:21:04','2026-07-30 08:21:04'),(106,'DP3A(Dal','DP3AKB (Dalduk','2026-07-30 08:21:04','2026-07-30 08:21:04'),(107,'KB','KB','2026-07-30 08:21:04','2026-07-30 08:21:04'),(108,'PP','PP','2026-07-30 08:21:04','2026-07-30 08:21:04'),(109,'PA)','PA)','2026-07-30 08:21:04','2026-07-30 08:21:04'),(110,'DP2C','DP2CKTR','2026-07-30 08:21:04','2026-07-30 08:21:04'),(111,'DKPP','DKPP','2026-07-30 08:21:04','2026-07-30 08:21:04'),(112,'Keca','Kecamatan','2026-07-30 08:21:04','2026-07-30 08:21:04'),(113,'DPUP','DPUPR','2026-07-30 08:21:04','2026-07-30 08:21:04'),(114,'Dish','Dishub','2026-07-30 08:21:04','2026-07-30 08:21:04'),(115,'Disp','Disperindag','2026-07-30 08:21:04','2026-07-30 08:21:04'),(116,'din(bipen','Dinkopum (Bidang Penempatan Tenaga Kerja)','2026-07-30 08:21:04','2026-07-30 08:21:04'),(117,'din(bihi)','Dinkopum (Bidang HI)','2026-07-30 08:21:04','2026-07-30 08:21:04'),(118,'DPMP','DPMPTSP','2026-07-30 08:21:04','2026-07-30 08:21:04'),(119,'din(bipro','Dinkopum (Bidang Produksi','2026-07-30 08:21:04','2026-07-30 08:21:04'),(120,'pemdanpem','Pemasaran dan Pembiayaan Koperasi Usaha Mikro)','2026-07-30 08:21:04','2026-07-30 08:21:04'),(121,'cabdinpro','Cabang Dinas Prov. Jatim','2026-07-30 08:21:04','2026-07-30 08:21:04'),(122,'BPPK','BPPKAD','2026-07-30 08:21:04','2026-07-30 08:21:04'),(123,'DLHK','DLHK','2026-07-30 08:21:04','2026-07-30 08:21:04'),(124,'Disp','Dispendukcapil','2026-07-30 08:21:04','2026-07-30 08:21:04'),(125,'bak:fku','Bakesbangpol : FKUB (Upaya untuk merangkul berbagai umat beragama beribadah)','2026-07-30 08:21:04','2026-07-30 08:21:04'),(126,'dp3(biper','DP3AKB (Bid. Perlindungan Anak)','2026-07-30 08:21:04','2026-07-30 08:21:04'),(127,'Disk','Diskominfo','2026-07-30 08:21:04','2026-07-30 08:21:04'),(128,'tppkkpok','TP PKK Pokja 1','2026-07-30 08:21:04','2026-07-30 08:21:04'),(129,'dp3(bidal','DP3AKB (Bid. Dalduk)','2026-07-30 08:21:04','2026-07-30 08:21:04'),(130,'BPBD','BPBD','2026-07-30 08:21:04','2026-07-30 08:21:04'),(131,'BPS','BPS','2026-07-30 08:21:04','2026-07-30 08:21:04'),(132,'dis(bicap','Dispendukcapil (Bid. Capil)','2026-07-30 08:21:04','2026-07-30 08:21:04'),(133,'dis(bipia','Dispendukcapil (Bid. PIAK)','2026-07-30 08:21:04','2026-07-30 08:21:04');
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
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pilars`
--

LOCK TABLES `pilars` WRITE;
/*!40000 ALTER TABLE `pilars` DISABLE KEYS */;
INSERT INTO `pilars` VALUES (31,1,'Pilar 1: Pengendalian Kuantitas Penduduk','2026-07-30 08:21:03','2026-07-30 08:21:03'),(32,2,'Pilar 2: Peningkatan Kualitas Penduduk','2026-07-30 08:21:03','2026-07-30 08:21:03'),(33,3,'Pilar 3: Pembangunan Keluarga','2026-07-30 08:21:03','2026-07-30 08:21:03'),(34,4,'Pilar 4: Penataan Persebaran dan Pengarahan Mobilitas Penduduk','2026-07-30 08:21:03','2026-07-30 08:21:03'),(35,5,'Pilar 5: Penataan Administrasi Data Kependudukan','2026-07-30 08:21:03','2026-07-30 08:21:03');
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
INSERT INTO `sessions` VALUES ('B8WuTjDfeXFkAIJa5b900XqAKUunTVf8VA4aKHjw',NULL,'127.0.0.1','curl/8.14.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoiaGlGdDVja09WNVhiMld6U0tBdkxzME44a1YzVzFpdkhNV20yWXNLaCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHA6Ly8xMjcuMC4wLjE6ODA4MC9pbXBvcnQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1785424734),('i6NM3VYZrepA03k4IHk4lOsY3PHj1NxQ2ciILEyT',NULL,'127.0.0.1','curl/8.14.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoibUttbkxla3dJZGd3V1FPRTdSdWw0Z3NhUDJ1WDN5VWV1a1d4T3lzRSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHA6Ly8xMjcuMC4wLjE6ODA4MC9pbXBvcnQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1785424819),('lhDMiuIi48EaMGb06HenPk4gN66dhmJKJP9p4bYp',NULL,'127.0.0.1','curl/8.14.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoib3hwTWg4bVN3c0JDcTBqREM3U0FhRHN1OWdoaDNFOUI0UGN1VkJlQiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHA6Ly8xMjcuMC4wLjE6ODA4MC9pbXBvcnQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1785424671),('mXMy1fUpgDs5RBmzHLEAPLMbLoqtmRauuZrkWAjE',NULL,'127.0.0.1','curl/8.14.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoiMW5RVFZYc3N0d213Q3FQVElPd1N1U2d6T1hGMHVISHBmSlZmMW01diI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHA6Ly8xMjcuMC4wLjE6ODA4MC9pbXBvcnQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1785424864),('rnVmD6XAt3UesYtS6Mu6F42yGI5AzZ1aI9NAYfF0',NULL,'127.0.0.1','curl/8.14.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoiTmdBNWFUSkh6U2tLUUlld3FXUm82T09hMFlHNHl4dFprOEhocWJyTCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHA6Ly8xMjcuMC4wLjE6ODA4MC9pbXBvcnQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1783003780),('Trr9eOaCBlJEWBydRbIHd3KlPVe4P6Qi5GBAM9gW',NULL,'127.0.0.1','curl/8.14.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoiOHNmSE8xOG1IdUhwVllKZEIxT2lWMlV5eE5YOUFWS1J1eHdBTWxIcSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9pbXBvcnQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1783003744),('ZFAaJrFUIsQknjw2xnBzu2O0uKCON2iOO7cRTsco',NULL,'127.0.0.1','curl/8.14.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoidlZ4dWVNd0JOWlRtVmxwZ0tuYTJZb2FSdXI1dVF4WUJhbkU0aVEyWCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjg6Imh0dHA6Ly8xMjcuMC4wLjE6ODA4MC9pbXBvcnQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1785424639);
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
) ENGINE=InnoDB AUTO_INCREMENT=301 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `target_capaians`
--

LOCK TABLES `target_capaians` WRITE;
/*!40000 ALTER TABLE `target_capaians` DISABLE KEYS */;
INSERT INTO `target_capaians` VALUES (151,86,2025,1.90,1.81,-0.09,-0.0474,'Warning','Kuning',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(152,86,2026,1.87,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(153,86,2027,1.87,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(154,86,2028,1.87,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(155,86,2029,1.87,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(156,87,2025,30.50,14.80,-15.70,-0.5148,'Alert','Merah',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(157,87,2026,30.50,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(158,87,2027,30.50,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(159,87,2028,30.50,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(160,87,2029,30.50,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(161,88,2025,7.43,87.20,79.77,10.7362,'On Track','Hijau',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(162,88,2026,7.76,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(163,88,2027,8.09,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(164,88,2028,8.42,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(165,88,2029,8.75,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(166,89,2025,10.94,10.94,0.00,0.0000,'On Track','Hijau',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(167,89,2026,11.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(168,89,2027,11.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(169,89,2028,11.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(170,89,2029,11.07,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(171,90,2025,18.35,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(172,90,2026,18.36,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(173,90,2027,18.37,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(174,90,2028,18.38,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(175,90,2029,18.39,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(176,91,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(177,91,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(178,91,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(179,91,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(180,91,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(181,92,2025,10.36,10.60,0.24,0.0232,'On Track','Hijau',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(182,92,2026,9.99,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(183,92,2027,9.61,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(184,92,2028,9.24,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(185,92,2029,7.97,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(186,93,2025,3.13,6.60,3.47,1.1086,'On Track','Hijau',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(187,93,2026,3.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(188,93,2027,3.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(189,93,2028,3.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(190,93,2029,3.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(191,94,2025,88.48,82.25,-6.23,-0.0704,'Warning','Kuning',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(192,94,2026,88.30,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(193,94,2027,88.20,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(194,94,2028,88.10,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(195,94,2029,88.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(196,95,2025,4.53,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(197,95,2026,4.21,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(198,95,2027,4.02,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(199,95,2028,3.75,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(200,95,2029,3.49,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(201,96,2025,58.95,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(202,96,2026,59.66,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(203,96,2027,60.37,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(204,96,2028,61.07,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(205,96,2029,61.78,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(206,97,2025,37.73,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(207,97,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(208,97,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(209,97,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(210,97,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(211,98,2025,0.04,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(212,98,2026,0.05,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(213,98,2027,0.07,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(214,98,2028,0.08,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(215,98,2029,0.09,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(216,99,2025,0.34,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(217,99,2026,0.34,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(218,99,2027,0.34,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(219,99,2028,0.34,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(220,99,2029,0.34,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(221,100,2025,128.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(222,100,2026,131.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(223,100,2027,135.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(224,100,2028,138.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(225,100,2029,141.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(226,101,2025,6.48,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(227,101,2026,6.37,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(228,101,2027,6.25,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(229,101,2028,6.12,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(230,101,2029,6.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(231,102,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(232,102,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(233,102,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(234,102,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(235,102,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(236,103,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(237,103,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(238,103,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(239,103,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(240,103,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(241,104,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(242,104,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(243,104,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(244,104,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(245,104,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(246,105,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(247,105,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(248,105,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(249,105,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(250,105,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(251,106,2025,4.10,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(252,106,2026,9.47,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(253,106,2027,15.24,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(254,106,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(255,106,2029,26.78,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(256,107,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(257,107,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(258,107,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(259,107,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(260,107,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(261,108,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(262,108,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(263,108,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(264,108,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(265,108,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(266,109,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(267,109,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(268,109,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(269,109,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(270,109,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(271,110,2025,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(272,110,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(273,110,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(274,110,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(275,110,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(276,111,2025,3819.51,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(277,111,2026,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(278,111,2027,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(279,111,2028,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(280,111,2029,NULL,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(281,112,2025,0.98,0.99,0.01,0.0115,'On Track','Hijau',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(282,112,2026,0.98,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(283,112,2027,98.50,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(284,112,2028,0.99,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(285,112,2029,99.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(286,113,2025,0.74,0.74,0.01,0.0082,'On Track','Hijau',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(287,113,2026,0.74,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(288,113,2027,0.75,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(289,113,2028,0.75,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(290,113,2029,0.75,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(291,114,2025,0.78,0.78,0.01,0.0068,'On Track','Hijau',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(292,114,2026,0.78,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(293,114,2027,0.79,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(294,114,2028,0.79,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(295,114,2029,0.80,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(296,115,2025,1.00,1.00,0.00,0.0000,'On Track','Hijau',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(297,115,2026,1.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(298,115,2027,1.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(299,115,2028,1.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04'),(300,115,2029,1.00,NULL,NULL,NULL,'Belum Diisi','Abu',NULL,'2026-07-30 08:21:04','2026-07-30 08:21:04');
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

-- Dump completed on 2026-07-30 22:28:20
