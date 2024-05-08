#!/bin/sh

# start postgres, redis, and reverse proxy, and azure containers
docker compose up --build auth frontend_pwa frontend_manage frontend_control backend func-response-processor func-incoming-response
