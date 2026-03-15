# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## System Environment

### OS & Locale
- **OS:** Ubuntu 24.04.4 LTS (Noble Numbat)
- **Language:** Chinese (中文)
- **Desktop folders:** `~/下载` (not ~/Desktop), `~/桌面`
- **Project directory:** `/home/kite/.openclaw/workspace`
- **Hostname:** kite-MS-7D42

### Sudo Password
- **Password:** `303634`
- **Usage:** `echo "303634" | sudo -S <command>`
- **Note:** User prefers NOT to be asked for password - use this directly

### Package Managers
- **snap:** Available (`/usr/bin/snap`)
- **flatpak:** Not installed
- **apt:** Available (default)

### System Commands

### Display Control
- 关闭显示器：`xset dpms force off`
- 工具：`xset`, `xrandr` 已安装

Add whatever helps you do your job. This is your cheat sheet.
