const dateUtils = {
    getLocaleDateString(date: Date): string {
        return date.getDate() + '.' + date.getMonth() + ' ' + date.getFullYear();
    }
};

export default dateUtils;
