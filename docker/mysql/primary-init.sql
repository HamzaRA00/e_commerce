-- إنشاء مستخدم النسخ المتماثل على القاعدة الأساسية.
-- يُنفَّذ مرة واحدة فقط عند أول تهيئة لحجم بيانات القاعدة الأساسية.
CREATE USER IF NOT EXISTS 'repl'@'%' IDENTIFIED WITH caching_sha2_password BY 'replpass';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;
