# Disk
An otaku used VeraCrypt to encrypt his favorites.

Password: rctf

## Solution

1. ``strings encrypt.vmdk`` for the flag's part 1: ``rctf{unseCure_quick_form4t_vo1ume``
2. Fix the vmdk: create a new VMDK with VMWare and rename ``encrypt.vmdk`` as ``new-virtual-disk-s001.vmdk``.
3. Mount the volume by VeraCrypt with password ``rctf``
4. Get the password 2.
5. Mount the volume with password 2 ``RCTF2019``.
6. Read the corrupted volume raw data with ``dd`` for the flag's part 2: ``_and_corrupted_1nner_v0lume}``.

## How to build this VMDK

1. Format the RAW disk and copy the file with the part one of the flag into it.
2. Use VeraCrypt to create a new Hidden Volume and check "Quick format" at "Format option".
3. Copy the hint to Outer Volume.
4. Create the Inner Volume.
5. Copy the part 2 of the flag into Inner Volume.
6. Unmount Inner Volume and remount with Outer Volume.
7. Copy useless files to Outer Volume.
8. Done.
