// src/utils/scheduler.js

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function scheduleOneTimeCommand(command, time) {
    const delay = time.getTime() - new Date().getTime();
    if (delay < 0) {
        console.log(`Command "${command}" was scheduled for the past (${time}). Executing immediately.`);
        executeCommand(command);
        return;
    }
    
    console.log(`One-time command "${command}" will execute in ${Math.round(delay/1000)} seconds`);
    setTimeout(() => {
        executeCommand(command);
    }, delay);
}

function scheduleRecurringCommand(command, interval) {
    console.log(`Recurring command "${command}" will execute every ${interval/60000} minutes`);
    const intervalId = setInterval(() => {
        executeCommand(command);
    }, interval);
    return intervalId;
}

function executeCommand(command) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Executing: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[${timestamp}] Execution error: ${error.message}`);
            logOutput(`ERROR: ${error.message}`, stderr, timestamp);
        } else {
            logOutput(stdout, stderr, timestamp);
        }
    });
}

function parseCommand(command) {
    const trimmedCommand = command.trim();
    
    // One-time command pattern: Minute Hour Day Month Year <user command>
    const oneTimePattern = /^(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{4})\s+(.+)$/;
    
    // Recurring command pattern: */n <user command>
    const recurringPattern = /^\*\/(\d+)\s+(.+)$/;

    const oneTimeMatch = trimmedCommand.match(oneTimePattern);
    if (oneTimeMatch) {
        const [_, minute, hour, day, month, year, commandText] = oneTimeMatch;
        
        // Validate ranges
        const min = parseInt(minute);
        const hr = parseInt(hour);
        const dy = parseInt(day);
        const mon = parseInt(month);
        const yr = parseInt(year);
        
        if (min < 0 || min > 59) throw new Error(`Invalid minute: ${min}`);
        if (hr < 0 || hr > 23) throw new Error(`Invalid hour: ${hr}`);
        if (dy < 1 || dy > 31) throw new Error(`Invalid day: ${dy}`);
        if (mon < 1 || mon > 12) throw new Error(`Invalid month: ${mon}`);
        if (yr < 1970) throw new Error(`Invalid year: ${yr}`);
        
        // Month is 0-indexed in JavaScript Date
        const time = new Date(yr, mon - 1, dy, hr, min, 0, 0);
        
        return {
            type: 'one-time',
            details: {
                commandText: commandText.trim(),
                time
            }
        };
    }

    const recurringMatch = trimmedCommand.match(recurringPattern);
    if (recurringMatch) {
        const [_, intervalMinutes, commandText] = recurringMatch;
        const validIntervals = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60];
        const interval = parseInt(intervalMinutes);
        
        if (!validIntervals.includes(interval)) {
            throw new Error(`Invalid interval: ${interval}. Valid intervals are: ${validIntervals.join(', ')}`);
        }
        
        return {
            type: 'recurring',
            details: {
                commandText: commandText.trim(),
                interval: interval * 60 * 1000 // Convert minutes to milliseconds
            }
        };
    }

    throw new Error(`Command format is invalid. Expected formats:
    One-time: "Minute Hour Day Month Year <command>"
    Recurring: "*/n <command>" where n is one of: 1,2,3,4,5,6,10,12,15,20,30,60`);
}

function logOutput(stdout, stderr, timestamp) {
    const logEntry = `=== ${timestamp} ===\nSTDOUT:\n${stdout || '(no output)'}\nSTDERR:\n${stderr || '(no errors)'}\n\n`;
    
    const outputPath = path.join(__dirname, '..', '..', 'sample-output.txt');
    try {
        fs.appendFileSync(outputPath, logEntry);
        console.log(`Output logged to: ${outputPath}`);
    } catch (err) {
        console.error(`Failed to write to output file: ${err.message}`);
    }
}

module.exports = {
    scheduleOneTimeCommand,
    scheduleRecurringCommand,
    parseCommand
};