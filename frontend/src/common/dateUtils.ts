const dateUtils = {
    getLocaleDateString(date: Date): string {
        return date.getDate() + '.' + (date.getMonth() + 1) + ' ' + date.getFullYear();
    }
};

export default dateUtils;
