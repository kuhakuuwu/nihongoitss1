export const getLanguage = () => {
    return localStorage.getItem("lang") || "jp";
};

export const setLanguage = (lang) => {
    localStorage.setItem("lang", lang);
};
