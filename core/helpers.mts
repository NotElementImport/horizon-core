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