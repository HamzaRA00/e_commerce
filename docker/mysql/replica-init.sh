#!/bin/bash
# تهيئة النسخة (replica): نسخ بيانات القاعدة الأساسية ثم بدء النسخ المتماثل.
# يُنفَّذ مرة واحدة فقط عند أول تهيئة لحجم بيانات النسخة.
set -euo pipefail

ROOT_PW="${MYSQL_ROOT_PASSWORD}"
PRIMARY_HOST="db"
PRIMARY_DB="${MYSQL_DATABASE}"
REPL_USER="repl"
REPL_PASSWORD="replpass"

MYSQL_ROOT="mysql -uroot -p${ROOT_PW}"

echo "[replica-init] انتظار جهوزية القاعدة الأساسية ${PRIMARY_HOST}"
for _ in $(seq 1 60); do
  if mysql -h "${PRIMARY_HOST}" -uroot -p"${ROOT_PW}" -e "SELECT 1" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

DUMP_FILE="/tmp/primary-dump.sql"
echo "[replica-init] أخذ نسخة من قاعدة ${PRIMARY_DB} على القاعدة الأساسية"
mysqldump -h "${PRIMARY_HOST}" -uroot -p"${ROOT_PW}" \
  --databases "${PRIMARY_DB}" \
  --single-transaction --source-data=2 --set-gtid-purged=OFF \
  --routines --triggers --events > "${DUMP_FILE}"

LOG_FILE="$(grep -m1 'CHANGE REPLICATION SOURCE TO' "${DUMP_FILE}" | sed -E "s/.*SOURCE_LOG_FILE='([^']+)'.*/\1/")"
LOG_POS="$(grep -m1 'CHANGE REPLICATION SOURCE TO' "${DUMP_FILE}" | sed -E "s/.*SOURCE_LOG_POS=([0-9]+).*/\1/")"
echo "[replica-init] موضع binlog على الأساسية: ${LOG_FILE}:${LOG_POS}"

echo "[replica-init] تحميل النسخة في قاعدة النسخة"
${MYSQL_ROOT} < "${DUMP_FILE}"

echo "[replica-init] ضبط قناة النسخ المتماثل وبدؤها"
${MYSQL_ROOT} <<SQL
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST='${PRIMARY_HOST}',
  SOURCE_PORT=3306,
  SOURCE_USER='${REPL_USER}',
  SOURCE_PASSWORD='${REPL_PASSWORD}',
  SOURCE_LOG_FILE='${LOG_FILE}',
  SOURCE_LOG_POS=${LOG_POS},
  GET_SOURCE_PUBLIC_KEY=1;
START REPLICA;
SQL

echo "[replica-init] تفعيل وضع القراءة فقط بشكل دائم (يُطبَّق عند كل تشغيل)"
${MYSQL_ROOT} -e "SET PERSIST read_only=ON; SET PERSIST super_read_only=ON;"

rm -f "${DUMP_FILE}"
echo "[replica-init] تم"
