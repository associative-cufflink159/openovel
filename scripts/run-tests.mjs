#!/usr/bin/env node

import { spawn } from "node:child_process"

const child = spawn(
  process.execPath,
  ["--test", "--test-force-exit", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      OPENOVEL_RESIDENT_TEAM: process.env.OPENOVEL_RESIDENT_TEAM || "0",
    },
  },
)

child.on("error", (error) => {
  console.error(error)
  process.exit(1)
})

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`test process terminated by ${signal}`)
    process.exit(1)
  }
  process.exit(code ?? 1)
})
