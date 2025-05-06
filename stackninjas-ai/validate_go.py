#!/usr/bin/env python3
"""
Validate Go code in api/ directory:
  1. Run gofmt -e to check syntax
  2. Run go tool compile -e per file
  3. Run go vet ./api/...
  4. Run go build -o /dev/null ./api
Reports file, line number, and error messages.
Exits non-zero on any failures.
"""
import os
import subprocess
import sys

# Configure Go build cache to local project directory to avoid permission issues
cache_dir = os.path.join(os.getcwd(), '.cache', 'go-build')
os.makedirs(cache_dir, exist_ok=True)
os.environ['GOCACHE'] = cache_dir
# Override TMPDIR to local cache to avoid permission errors
tmp_dir = os.path.join(os.getcwd(), '.cache', 'tmp')
os.makedirs(tmp_dir, exist_ok=True)
os.environ['TMPDIR'] = tmp_dir

def run_cmd(cmd, cwd=None):
    proc = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    out = proc.stdout + proc.stderr
    return proc.returncode, out

errors = []
base = os.path.join(os.getcwd(), 'api')

# Step 1 & 2: per-file checks
for root, _, files in os.walk(base):
    for fname in files:
        if not fname.endswith('.go'):
            continue
        path = os.path.join(root, fname)
        # gofmt syntax check
        code, out = run_cmd(['gofmt', '-e', path])
        if code != 0 or out.strip():
            errors.append(f"gofmt error in {path}:\n{out.strip()}")
        # compile syntax check
        code, out = run_cmd(['go', 'tool', 'compile', '-e', path])
        if code != 0 or out.strip():
            errors.append(f"compile error in {path}:\n{out.strip()}")

# Step 3: go vet
code, out = run_cmd(['go', 'vet', './...'], cwd=os.getcwd())
if code != 0 or out.strip():
    errors.append(f"go vet errors:\n{out.strip()}")

# Step 4: go build main module
devnull = open(os.devnull, 'w')
code, out = run_cmd(['go', 'build', '-o', os.devnull, '.'], cwd=os.getcwd())
if code != 0:
    errors.append(f"go build errors:\n{out.strip()}")
devnull.close()

if errors:
    print("Go validation FAILED with the following errors:")
    for err in errors:
        print(err)
    sys.exit(1)
else:
    print("Go validation succeeded!")
    sys.exit(0)