const charTable = '0123456789qwertyuiopasdfghjklzxcvbnm#@$%&*'

export const useId = (len = 10) => {
    let result = ''
    for(let i = 0; i < len; i++)
        result += charTable.charAt(Math.floor(Math.random() * (charTable.length - 1)))
    return result
}

let busCounter = -1
export const useBusId = () => {
    return (busCounter++, busCounter)
}

export const useStylePrettify = (style: Record<string, any> | string) => {
    if(typeof style == 'string') return style

    return Object.entries(style)
        .reduce((acc, [key, value]) =>
            acc + `${key.replace('webkit', '-webkit').split(/(?=[A-Z])/).join('-').toLowerCase()}: ${value};` 
        , '');
}

export const toDelay = (signature: string, from: string|number|Date|undefined = undefined) => {
    let dateFrom: Date = (from ?? new Date()) as Date

    if(from && !(from instanceof Date))
        dateFrom = new Date(from);

    const parsedSignature = Date.parse(signature)

    if(!Number.isNaN(parsedSignature))
        return parsedSignature - dateFrom.getTime()

    const dateSignature = new Date()
    
    if(signature.includes(':')) {
        dateSignature.setFullYear(dateFrom.getFullYear())
        dateSignature.setMonth(dateFrom.getMonth())
        dateSignature.setDate(dateFrom.getDate())

        const [ hour, minute, seconds ] = signature.split(':')
        dateSignature.setHours(+(hour ?? 1) + 1, +(minute ?? 0), +(seconds ?? 0))
        let result = dateSignature.getTime() - dateFrom.getTime()
        
        if(result <= 0) {
            dateSignature.setDate(dateSignature.getDate() + 1)
            result = dateSignature.getTime() - dateFrom.getTime()
        }

        return result
    }

    for (let timeSignature of signature.split('+')) {
        timeSignature = timeSignature.trim()
        const [ value, timeType ] = timeSignature.split(' ')

        if(timeType.includes('sec'))
            dateSignature.setSeconds(dateSignature.getSeconds() + +value)
        if(timeType.includes('min'))
            dateSignature.setMinutes(dateSignature.getMinutes() + +value)
        if(timeType.includes('hour'))
            dateSignature.setHours(dateSignature.getHours() + +value)
    }

    return dateSignature.getTime() - dateFrom.getTime()
}