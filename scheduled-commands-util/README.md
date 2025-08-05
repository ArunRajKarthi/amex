# Scheduled Commands Utility

A Node.js utility to execute scheduled commands in two patterns:
1. One-time scheduled commands
2. Recurring scheduled commands


# Assumptions Made

- The commands file is located at `/tmp/commands.txt` (or `tmp/commands.txt` in the repo for local testing).
- Each line in the commands file is a single command in one of the two supported formats:
  - One-time: `Minute Hour Day Month Year <user command>`
  - Recurring: `*/n <user command>`, where n is one of: 1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60.
- All time values are in local server time.
- If a one-time command is scheduled for a time in the past, it will be executed immediately.
- Only valid intervals for recurring commands are allowed; invalid intervals will result in an error and the command will not be scheduled.
- Output from all commands is appended to `sample-output.txt` in the project root.
- The utility does not persist scheduled tasks across restarts; it reads and schedules commands on each run.
- The utility is designed for demonstration and local testing; for production, system cron or a process manager is recommended.
- No authentication or authorization is implemented; it is assumed the commands file is managed securely.
- No additional clarifications were provided, so all edge cases are handled with reasonable defaults and error messages.
