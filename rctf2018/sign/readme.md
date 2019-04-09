sign
=======================

## Challenge (252 solved)

Run it and get flag (but how?) (segfault is NOT a bug) 

attachment: https://drive.google.com/open?id=1ghFVktqDYM48YiJt-ppx6a-2JHH-wIKm 

## Build

Find the ``notepad`` project under wine, add 
```c
    SetWindowTextW(Globals.hEdit, "R\0C\0T\0F\0{\0W\0e\0l\0C\0O\0m\0e\0_\0T\0o\0_\0R\0C\0T\0F\0}\0\n\0\n\0\0What? You decompiled me??");
```

to ``WinMain``, compile with ``winebuild``.

## Writeup

It looks like Windows Executable and called many Windows API, but it's ELF XD. Run it with ``wine sign.exe``.