#!/bin/bash
# Run the browser test with at most 2 concurrent headless browsers across all sessions (2 CPUs).
cd "$(dirname "$0")"
while :; do
  for L in 1 2; do
    exec 9>/home/claude/bxtools/pw$L.lock
    if flock -n 9; then timeout 1500 node run.mjs "$@"; exit $?; fi
  done
  sleep 4
done
