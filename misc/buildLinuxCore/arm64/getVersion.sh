#!/bin/bash
set -e  # Exit on any error

# Retrieves the version from the arm64 core executable on the remote machine

if [[ ! -d "${PWD}/core" ]] ; then
  echo "${PWD}/core not found - you must be in the project main folder"
  exit 1
fi

# Execute version check on remote server
ssh -i ~/.ssh/oraclecloud.key build@141.147.54.141 /home/build/nzbhydra2/core/target/core -version
