#!/usr/bin/env bash

set -euo pipefail

./test/lozza bench q
node test/node-wrapper.js bench q
