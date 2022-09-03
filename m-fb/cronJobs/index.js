const { CronJob } = require('cron')
const { suggestion, getSuggestionForTheDay } = require('../controller/user')

//Runs at every hour
const job1 = new CronJob('0 * * * *', async () => {
    try {
        console.log("CRON JOB STARTED")
        const { data } = await getSuggestionForTheDay()
        if (data.length < 150) {
            await suggestion()
        }
        console.log("CRON JOB FINISHED")
    }
    catch (error) {
        console.log(error.message)
    }
}, null, true)

module.exports = {job1}