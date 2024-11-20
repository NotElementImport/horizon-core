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
    from = (from ?? new Date())

    if(from && !(from instanceof Date))
        from = new Date(from);

    const parsedSignature = Date.parse(signature)

    if(!Number.isNaN(parsedSignature))
        return parsedSignature - (from as Date).getTime()

    const dateSignature = new Date()

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

    return (dateSignature).getTime() - (from as Date).getTime()
}