#!/bin/sh
npm run artillery -- run $1.yaml -e $2 --scenario-name $3

echo "Press any key to close window..."
read -n 1
