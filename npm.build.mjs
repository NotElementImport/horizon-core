import * as fs from 'fs'

if(fs.existsSync('./bundle'))
    fs.rmdirSync('./bundle', { recursive: true })
if(fs.existsSync('./types'))
    fs.rmdirSync('./types', { recursive: true })