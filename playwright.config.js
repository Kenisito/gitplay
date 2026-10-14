const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({testDir:'./tests',timeout:30000,expect:{timeout:8000},use:{browserName:'chromium',headless:true,viewport:{width:1440,height:900}},reporter:[['list']],retries:process.env.CI?1:0});
