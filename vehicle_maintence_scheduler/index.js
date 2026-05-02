const axios = require('axios');
const { Log } = require('affordmed-logging-middleware');

const DEPOTS_API = 'http://20.207.122.201/evaluation-service/depots';
const VEHICLES_API = 'http://20.207.122.201/evaluation-service/vehicles';

/**
 * Solves the 0/1 Knapsack problem
 * @param {number} W Maximum capacity (budget)
 * @param {Array} tasks Array of tasks {TaskID, Duration, Impact}
 * @returns {Object} { maxImpact, selectedTasks }
 */
function solveKnapsack(W, tasks) {
    const n = tasks.length;
    // dp[i][w] represents max impact using first i tasks with weight limit w
    const dp = Array(n + 1).fill(0).map(() => Array(W + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const duration = tasks[i - 1].Duration;
        const impact = tasks[i - 1].Impact;

        for (let w = 1; w <= W; w++) {
            if (duration <= w) {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    dp[i - 1][w - duration] + impact
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    // Backtrack to find the selected tasks
    const selectedTasks = [];
    let res = dp[n][W];
    let w = W;

    for (let i = n; i > 0 && res > 0; i--) {
        if (res !== dp[i - 1][w]) {
            selectedTasks.push(tasks[i - 1]);
            res -= tasks[i - 1].Impact;
            w -= tasks[i - 1].Duration;
        }
    }

    return {
        maxImpact: dp[n][W],
        selectedTasks: selectedTasks
    };
}

async function scheduleMaintenance() {
    const token = process.env.AUTH_TOKEN;
    
    let depots = [];
    let vehicles = [];

    if (process.env.MOCK === 'true') {
        depots = [
            { "ID": 1, "MechanicHours": 60 },
            { "ID": 2, "MechanicHours": 135 }
        ];
        vehicles = [
            { "TaskID": "t1", "Duration": 10, "Impact": 5 },
            { "TaskID": "t2", "Duration": 150, "Impact": 10 },
            { "TaskID": "t3", "Duration": 40, "Impact": 8 },
            { "TaskID": "t4", "Duration": 20, "Impact": 4 },
            { "TaskID": "t5", "Duration": 50, "Impact": 12 }
        ];
        await Log("backend", "info", "service", "Using mock data for scheduler");
    } else {
        if (!token) {
            console.error("Please set AUTH_TOKEN environment variable.");
            return;
        }
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [depotRes, vehicleRes] = await Promise.all([
                axios.get(DEPOTS_API, { headers }),
                axios.get(VEHICLES_API, { headers })
            ]);
            
            depots = depotRes.data.depots || [];
            vehicles = vehicleRes.data.vehicles || [];
            await Log("backend", "info", "service", "Successfully fetched depots and vehicles from server");
        } catch (error) {
            await Log("backend", "error", "service", `Failed to fetch data: ${error.message}`);
            console.error("Error fetching data:", error.message);
            return;
        }
    }

    // Calculate total daily mechanic-hour budget
    const totalBudget = depots.reduce((sum, depot) => sum + depot.MechanicHours, 0);
    console.log(`Total Mechanic-Hours Budget: ${totalBudget}`);

    // Solve Knapsack
    const { maxImpact, selectedTasks } = solveKnapsack(totalBudget, vehicles);

    console.log(`Maximum Operational Impact: ${maxImpact}`);
    console.log(`Number of tasks selected: ${selectedTasks.length}`);
    console.log("Selected Tasks:");
    console.table(selectedTasks);
    
    return { maxImpact, selectedTasks };
}

if (require.main === module) {
    scheduleMaintenance();
}

module.exports = { scheduleMaintenance };
