const fs = require('fs');
const path = require('path');
const { scheduleOneTimeCommand, scheduleRecurringCommand, parseCommand } = require('./utils/scheduler');

const commandsFilePath = path.join(__dirname, '..', 'tmp', 'commands.txt');

function loadCommands() {
    try {
        if (!fs.existsSync(commandsFilePath)) {
            console.error(`Commands file not found: ${commandsFilePath}`);
            return [];
        }
        return fs.readFileSync(commandsFilePath, 'utf-8').split('\n').filter(Boolean);
    } catch (err) {
        console.error(`Error loading commands file: ${err.message}`);
        return [];
    }
}

let activeIntervals = [];

function scheduleCommands() {
    const commands = loadCommands();
    if (commands.length === 0) {
        console.log('No commands to schedule.');
        return;
    }
    
    console.log(`Scheduling ${commands.length} commands...`);
    commands.forEach((command, index) => {
        try {
            const { type, details } = parseCommand(command);
            if (type === 'one-time') {
                const { commandText, time } = details;
                scheduleOneTimeCommand(commandText, time);
                console.log(`Scheduled one-time command ${index + 1}: "${commandText}" at ${time}`);
            } else if (type === 'recurring') {
                const { commandText, interval } = details;
                const intervalId = scheduleRecurringCommand(commandText, interval);
                activeIntervals.push(intervalId);
                console.log(`Scheduled recurring command ${index + 1}: "${commandText}" every ${interval/60000} minutes`);
            }
        } catch (err) {
            console.error(`Failed to schedule command "${command}": ${err.message}`);
        }
    });
}

// Graceful shutdown
function gracefulShutdown() {
    console.log('\nReceived shutdown signal. Cleaning up...');
    activeIntervals.forEach(intervalId => {
        if (intervalId) clearInterval(intervalId);
    });
    console.log('All scheduled tasks stopped. Exiting...');
    process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

console.log('Starting scheduled commands utility...');
scheduleCommands();

// Keep the process alive only if there are recurring commands
if (activeIntervals.length > 0) {
    console.log('Utility is running with recurring commands. Press Ctrl+C to exit.');
    process.stdin.resume();
} else {
    console.log('No recurring commands scheduled. Process will exit after one-time commands complete.');
}