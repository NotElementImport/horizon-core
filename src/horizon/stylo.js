let stylo = [];

export const addStyloFile = (path) => {
    stylo.push({ src: path });
};

export const addStyloRaw = (code) => {
    stylo.push({ code });
};

export const getStylo = () => {
    return stylo;
};

export const resetStylo = () => {
    stylo = [];
};