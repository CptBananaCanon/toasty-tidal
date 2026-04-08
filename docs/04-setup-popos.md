# Setup on Pop!_OS

## System packages
Use the Linux / Debian-family Tauri prerequisites.

```bash
sudo apt update && sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

## Rust
```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
source "$HOME/.cargo/env"
rustc --version
cargo --version
```

## Node + package manager
Install Node.js LTS, then:
```bash
corepack enable
node -v
npm -v
pnpm -v
```

## Scaffold with Tauri
### Interactive official way
```bash
sh <(curl https://create.tauri.app/sh)
```

### After scaffold
```bash
pnpm install
pnpm tauri dev
```

## No Python venv needed
This stack does not require Python or a venv by default.
Only add Python later if you introduce helper scripts, tests, or asset tooling that specifically need it.
