import app from "../app"
import { toHTML } from "../horizon/index.js"
import { getStylo, resetStylo } from "../horizon/stylo.js"

export async function render(...args: any[]) {
    try {
        await app.render({})

        const html = toHTML(app.meta) 
        let head = ''
    
        for (const element of getStylo()) {
            if(element.code) {
                head += `<style>${element.code}</style>`
            }
            else if(element.src) {
                head += `<link rel="stylesheet" href="${element.src}">`
            }
        }
    
        resetStylo()
        app.clear()
    
        return { html, head }
    }
    catch(e) {
        return { html: e }
    }
}