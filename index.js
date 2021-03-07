#!/usr/bin/env node
const puppeteer = require('puppeteer');
const site = require('./site')

// mapping of Configuration item & Assignment group
const assignmentGroup = {
  'SURPLUS': 'INF-EAS-GLOB-PS',
  'SYREMO': 'INF-EAS-L1.5INF',
}

// mapping of Configuration item & Assignee
const assignee = {
  'SURPLUS': 'Summer Fang',
  'SYREMO': 'Summer Fang',
}

const launchOptions = {
  userDataDir: '/Users/ssc/puppeteer-data',
  headless: false
};

(async function () {
  const browser = await puppeteer.launch(launchOptions);
  const pages = await browser.pages()
  const page = pages[0];
  await page.setDefaultNavigationTimeout(2147483647); // never timeout
  await page.setCacheEnabled(true)
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(site, { waitUntil: 'domcontentloaded' });

  page.on('dialog', async dialog => {
    console.log(`dismiss alert`,)
    await dialog.accept('Leave');
  });

  let timer
  let currentStep = 0
  let logData = { step: -1, count: 0 }
  let configurationItem

  function sleep(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    })
  }

  function log(step) {
    logData.step === step ? logData.count++ : logData = { step: step, count: 0 }
    console.log(`logData`, logData)
  }

  const steps = [
    async function () {
      try {
        log(0)
        // click any other link to leave current link
        await page.click('#b55fbec4c0a800090088e83d7ff500de') // open
        currentStep++
      } catch (err) {
        console.error(0, err)
      }
    },
    async function () {
      try {
        log(1)
        // #concourse_module_283b6424c611228501ffeaea1e115220 a - assigned to me
        // #d385943537e28200dbbb84f643990ec6 - myGroupsUnassigned
        // #b55fbec4c0a800090088e83d7ff500de - open
        await page.click('#d385943537e28200dbbb84f643990ec6')
        currentStep++
      } catch (err) {
        console.error(1, err)
      }
    },
    async function () {
      try {
        log(2)
        const frame = page.frames().find(frame => frame.name() === 'gsft_main');
        await frame.click('#incident_table tbody tr .formlink')
        currentStep++
      } catch (err) {
        console.error(2, err)
      }
    },
    async function () {
      try {
        log(3)
        const frame = page.frames().find(frame => frame.name() === 'gsft_main');
        configurationItem = await frame.$eval("input[name='sys_display.original.incident.cmdb_ci']", el => el.value)

        // configurationItem is required to continue
        if (configurationItem) {
          currentStep++
        }
      } catch (err) {
        console.error(3, err)
      }
    },
    async function () {
      try {
        log(4)
        const frame = page.frames().find(frame => frame.name() === 'gsft_main');
        const input = await frame.$("input[name='sys_display.incident.assignment_group']");
        await input.click({ clickCount: 3 })

        if (assignmentGroup[configurationItem]) {
          await input.type(assignmentGroup[configurationItem], { delay: 100 })
          currentStep++
        }
      } catch (err) {
        console.error(4, err)
      }
    },
    async function () {
      try {
        log(5)
        const frame = page.frames().find(frame => frame.name() === 'gsft_main');
        const input = await frame.$("input[name='sys_display.incident.assigned_to']");
        await input.click({ clickCount: 3 })
        if (assignee[configurationItem]) {
          await input.type(assignee[configurationItem], { delay: 100 })
          currentStep++
        }
      } catch (err) {
        console.error(5, err)
      }
    },
    async function () {
      try {
        log(6)
        const frame = page.frames().find(frame => frame.name() === 'gsft_main');
        const workNotes = await frame.$("#activity-stream-textarea");
        await workNotes.click({ clickCount: 3 })
        await workNotes.type('Working in progress', { delay: 100 })
        currentStep++
      } catch (err) {
        console.error(6, err)
      }
    },
    async function () {
      try {
        log(7)
        // Dangerous action !!!!!!!!!
        // const frame = page.frames().find(frame => frame.name() === 'gsft_main');
        // const button = await frame.$("#inprogress3");
        // await button.click()
        currentStep++
      } catch (err) {
        console.error(7, err)
      }
    }
  ]

  // loop1
  timer = setInterval(async () => {
    const r = await page.evaluate(() => {
      if (document.domain !== 'syngenta.service-now.com') return 'wait'
      if (document.readyState !== 'complete') return document.readyState
      if (window['_watchButton']) return 'clear'

      const button = document.createElement('button')
      button.style.width = '200px'
      button.style.height = '100px'
      button.style.background = 'aliceblue'
      button.style.position = 'fixed'
      button.style.top = '0'
      button.style.left = '0'
      button.style.zIndex = '10'
      button.innerText = 'Watch'
      document.body.appendChild(button)
      button.addEventListener('click', function () {
        button.innerText = 'Watching...'
        window['_watch'] = true
      })
      window['_watchButton'] = true

      return 'complete'
    }).catch(err => console.error(err));

    r === 'clear' ? clearInterval(timer) : console.log(r)
  }, 5000)

  // loop2
  setInterval((async () => {
    const isWatching = await page.evaluate(() => window['_watch'])
    if (!isWatching) return

    if (logData.count > 5 || currentStep >= steps.length) {
      currentStep = 0
      logData = { step: -1, count: 0 }
    }

    const fn = steps[currentStep]
    fn && fn()
  }), 10000)
})();




