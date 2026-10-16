#!/usr/bin/env bash
# kendali PostgreSQL lokal untuk pengembangan Buku Agenda.
#
# Postgres biner asli (17.6) dari paket embedded-postgres-binaries (zonky),
# dipasang ke .pgdist/ tanpa hak root. Untuk produksi, arahkan DATABASE_URL
# ke instance Postgres yang sebenarnya (Supabase / RDS / VPS) — tidak ada kode
# yang perlu diubah, hanya string koneksinya.
set -euo pipefail

AKAR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGBIN="$AKAR/.pgdist/pghome/bin"
PGDATA="$AKAR/.pgdist/data"
PGLOG="$AKAR/.pgdist/postgres.log"
PORT="${BUKU_AGENDA_PG_PORT:-5433}"
DB="${BUKU_AGENDA_PG_DB:-bukuagenda}"
USERDB="${BUKU_AGENDA_PG_USER:-bukuagenda}"

export LD_LIBRARY_PATH="$AKAR/.pgdist/pghome/lib:${LD_LIBRARY_PATH:-}"

pg_jar_ada() { [ -x "$PGBIN/postgres" ]; }

unduh_biner() {
  echo "Mengunduh biner PostgreSQL 17.6 (embedded-postgres-binaries)..."
  mkdir -p "$AKAR/.pgdist"
  curl -sSL -o "$AKAR/.pgdist/pg.jar" \
    "https://repo1.maven.org/maven2/io/zonky/test/postgres/embedded-postgres-binaries-linux-amd64/17.6.0/embedded-postgres-binaries-linux-amd64-17.6.0.jar"
  mkdir -p "$AKAR/.pgdist/root"
  python3 -c "import zipfile,sys; zipfile.ZipFile('$AKAR/.pgdist/pg.jar').extractall('$AKAR/.pgdist/root')"
  mkdir -p "$AKAR/.pgdist/pghome"
  tar -xJf "$AKAR/.pgdist/root/postgres-linux-x86_64.txz" -C "$AKAR/.pgdist/pghome"
}

init_db() {
  mkdir -p "$PGDATA"
  chmod 700 "$PGDATA"
  "$PGBIN/initdb" -D "$PGDATA" -U "$USERDB" -E UTF8 --locale=C.UTF-8 \
    --auth-local=trust --auth-host=trust >/dev/null
  {
    echo "port = $PORT"
    echo "listen_addresses = '127.0.0.1'"
    echo "unix_socket_directories = '$AKAR/.pgdist'"
    echo "fsync = off"
    echo "synchronous_commit = off"
    echo "full_page_writes = off"
    echo "max_connections = 40"
    echo "timezone = 'Asia/Jakarta'"
  } >> "$PGDATA/postgresql.conf"
  echo "local all all trust" > "$PGDATA/pg_hba.conf"
  echo "host all all 127.0.0.1/32 trust" >> "$PGDATA/pg_hba.conf"
  echo "host all all ::1/128      trust" >> "$PGDATA/pg_hba.conf"
}

# Catatan: paket embedded ini hanya berisi biner server (postgres, initdb,
# pg_ctl) — tidak ada psql/pg_isready. Karena initdb memakai -U bukuagenda,
# database default dengan nama yang sama otomatis dibuat, jadi tidak perlu
# createdb. Cek koneksi lewat soket TCP.
siap() { (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null && exec 3>&- && return 0 || return 1; }

kasal() {
  case "${1:-status}" in
    start)
      pg_jar_ada || unduh_biner
      [ -f "$PGDATA/PG_VERSION" ] || init_db
      if siap; then
        echo "Postgres sudah jalan di 127.0.0.1:$PORT"
      else
        "$PGBIN/pg_ctl" -D "$PGDATA" -l "$PGLOG" -o "-p $PORT" -w start >/dev/null
        echo "Postgres 17.6 start di 127.0.0.1:$PORT (log: $PGLOG)"
      fi
      echo "DATABASE_URL=postgresql://$USERDB@127.0.0.1:$PORT/$DB"
      ;;
    stop)
      "$PGBIN/pg_ctl" -D "$PGDATA" -m fast -w stop >/dev/null
      echo "Postgres stop"
      ;;
    status)
      if siap; then echo "ready di 127.0.0.1:$PORT"; else echo "tidak jalan"; exit 1; fi
      ;;
    *) echo "pakai: $0 {start|stop|status}"; exit 2 ;;
  esac
}

kasal "$@"