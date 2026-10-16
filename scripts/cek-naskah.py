#!/usr/bin/env python3
"""Memeriksa prisma/naskah.txt: menangkap karakter asing CJK dan kata Inggris
yang menyusup ke dalam nilai Bahasa Indonesia."""
import re
import sys

JAUH = set("""pengguna kata sandi unit kerja surat masuk keluar nomorstatus
yang untuk dengan dari pada adalah ini itu tidak sudah akan telah dalam
sebagai oleh karena jika maka dapat bisa perlu harus belum""".split())

CJK = re.compile(r"[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef\ua960-\ua97f]")
LAIN = re.compile(r"[_{}=+<>|\\^~\[\]]|\d\.\d")
KATA = re.compile(r"[A-Za-z]{3,}")

path = sys.argv[1] if len(sys.argv) > 1 else "prisma/naskah.txt"
isi = open(path, encoding="utf-8").read().split("\n")

rusak = 0
bagian = None
for no, baris in enumerate(isi, 1):
    b = baris.strip()
    if not b or b.startswith("#awal:"):
        bagian = b or bagian
        continue
    if b == "#akhir":
        continue
    masalah = []
    if CJK.search(b):
        masalah.append("CJK")
    if LAIN.search(b):
        masalah.append("karakter aneh")
    for kata in KATA.findall(b):
        if kata.lower() not in JAUH:
            masalah.append(f"kata:{kata}")
    if masalah:
        rusak += 1
        print(f"  {no}: [{', '.join(sorted(set(masalah)))}] {b}")

print("BERSIH" if rusak == 0 else f"{rusak} baris perlu diperbaiki")
