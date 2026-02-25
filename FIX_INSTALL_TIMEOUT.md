# Fix: "Request timed out" Error During pnpm install

## Problem
```
Request timed out
```

This error occurs when package manager (npm/pnpm) can't connect to the registry or the download takes too long.

---

## Solutions (Try In Order)

### Solution 1: Increase Timeout (FASTEST)
```bash
# For pnpm:
pnpm install --timeout 120000  # 120 seconds

# For npm:
npm install --legacy-peer-deps --no-audit --timeout 600000

# For yarn:
yarn install --network-timeout 120000
```

### Solution 2: Clear Cache and Retry
```bash
# For pnpm:
pnpm store prune  # Clean cache
pnpm install

# For npm:
npm cache clean --force
npm install

# For yarn:
yarn cache clean
yarn install
```

### Solution 3: Use Different Registry
```bash
# Use Taobao mirror (if in Asia):
pnpm install --registry https://registry.npmmirror.com

# Use npm official:
pnpm install --registry https://registry.npmjs.org

# Permanently set registry:
pnpm config set registry https://registry.npmjs.org
```

### Solution 4: Install with Fewer Connections
```bash
# pnpm - reduce parallel downloads
pnpm install --max-sockets 5

# npm - skip optional dependencies
npm install --no-optional
```

### Solution 5: Use node_modules .npmrc Configuration
Create/Edit `.npmrc` in project root:
```
registry=https://registry.npmjs.org
timeout=120000
fetch-timeout=120000
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
fetch-retries=5
```

Then run:
```bash
pnpm install
```

---

## Recommended Command (Most Likely to Work)

```bash
# Best combined approach:
pnpm install --timeout 120000 --registry https://registry.npmjs.org

# OR for npm:
npm install --timeout 600000 --legacy-peer-deps
```

---

## If Still Failing: Complete Reset

```bash
# Step 1: Remove lock files and node_modules
rm -rf node_modules
rm -rf pnpm-lock.yaml  # or package-lock.json / yarn.lock

# Step 2: Clear all caches
pnpm store prune
pnpm cache clean  # or npm cache clean --force

# Step 3: Reinstall with increased timeout
pnpm install --timeout 180000

# Step 4: Verify installation
pnpm list | head -20
```

---

## Switch Package Manager (Alternative)

If pnpm continues to timeout, try npm or yarn:

### Use npm:
```bash
# Remove pnpm lock
rm pnpm-lock.yaml

# Install with npm
npm install --legacy-peer-deps
```

### Use yarn:
```bash
# Remove pnpm lock
rm pnpm-lock.yaml

# Install with yarn
yarn install --network-timeout 120000
```

---

## Check Network Connectivity

```bash
# Test connection to registry:
ping registry.npmjs.org

# Check DNS resolution:
nslookup registry.npmjs.org

# Test direct download:
curl https://registry.npmjs.org/
```

---

## Docker-Specific Fix

If running in Docker:

```dockerfile
# Add to Dockerfile:
RUN npm config set fetch-timeout 120000
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000

# Then run install:
RUN pnpm install --timeout 120000
```

---

## Recommended .npmrc Settings

Save this as `.npmrc` in your project root:

```ini
# Registry
registry=https://registry.npmjs.org

# Timeout settings (in milliseconds)
timeout=120000
fetch-timeout=120000
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
fetch-retries=5

# Performance
engine-strict=false
legacy-peer-deps=true

# Network
max-sockets=5
strict-ssl=false
```

---

## For CoinKrazy Project Specifically

```bash
# 1. Clear everything
rm -rf node_modules pnpm-lock.yaml

# 2. Install with extended timeouts
pnpm install --timeout 120000 --registry https://registry.npmjs.org

# 3. If that fails, try npm:
npm install --legacy-peer-deps --timeout 600000

# 4. Build
npm run build

# 5. Run dev server
npm run dev
```

---

## Verify Installation Succeeded

After install completes, verify:

```bash
# Check node_modules exists
ls -la node_modules | head -10

# Check main packages
pnpm list react react-router-dom

# Check if dev can start
pnpm dev  # Should start without module errors
```

---

## Performance Tips for Future Installs

1. **Keep node_modules** - Don't delete unless necessary
2. **Use `pnpm ci`** instead of `pnpm install` in CI/CD (faster)
3. **Set registry once** - Add to global `.npmrc`:
   ```bash
   pnpm config set registry https://registry.npmjs.org
   ```
4. **Monitor network** - Check ISP speed/stability
5. **Use monorepo speeds** - pnpm is faster for monorepos than npm/yarn

---

## Still Having Issues?

Try this comprehensive troubleshooting:

```bash
#!/bin/bash
set -e

echo "🔧 Complete pnpm Install Troubleshooting"
echo "========================================="

# 1. Check versions
echo "✓ Checking versions..."
pnpm --version
node --version
npm --version

# 2. Clear everything
echo "✓ Clearing caches..."
pnpm store prune
pnpm cache clean

# 3. Verify network
echo "✓ Testing network..."
ping -c 1 registry.npmjs.org || echo "Network issue detected"

# 4. Set optimal config
echo "✓ Setting npmrc..."
cat > .npmrc << EOF
registry=https://registry.npmjs.org
timeout=120000
fetch-timeout=120000
EOF

# 5. Reinstall
echo "✓ Installing dependencies..."
pnpm install --frozen-lockfile --timeout 120000

# 6. Verify
echo "✓ Verifying installation..."
pnpm list --depth=0 | head -20

echo "✅ Installation complete!"
```

Save as `fix-install.sh` and run:
```bash
chmod +x fix-install.sh
./fix-install.sh
```

---

## Contact Support

If none of these work:

1. Check your internet connection speed
2. Try from a different network
3. Check for proxy/firewall blocking npm registry
4. Update to latest Node.js version
5. Try using a different machine/environment

---

**Status:** Ready to deploy after successful install ✅
