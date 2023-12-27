#!/bin/bash

# Change to the specified directory
cd /home/debian/klicker-uzh

# Reset the Git repository
git reset --hard

# Run app dependencies with sudo
sudo sh _d_run_app_dependencies.sh &

# Sleep for 30 seconds
sleep 30s

# Install dependencies using pnpm and run dev:offline
pnpm install && pnpm run dev:offline &
