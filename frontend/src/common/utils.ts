const arrayUtils = {
    /**
     * @param {Array} array
     * @param {string} direction 'up'|'down'
     * @param {number} at index
     * @returns {boolean}
     */
    swap(array: Array<any>, direction: keyof {up: 1, down: 1}, at: number): boolean {
        if ((direction === 'up' && at < 1) ||
            (direction === 'down' && at >= array.length - 1)) {
            return false;
        }
        const target = direction === 'up' ? at - 1 : at + 1;
        const tmp = array[at];
        array[at] = array[target];
        array[target] = tmp;
        return true;
    },
    /**
     * @param {Array} array
     * @param {string} property
     * @returns {number}
     */
    max(array: Array<any>, property: string) {
        if (!array.length) {
            return -1;
        }
        const max = Math.max(...array.map(item => item[property]));
        return !isNaN(max) ? max : -1;
    }
};

const domUtils = {
    revealLoadingIndicator() {
        document.body.classList.add('loading');
    },
    hideLoadingIndicator() {
        document.body.classList.remove('loading');
    }
};

const dateUtils = {
    getLocaleDateString(date: Date, showTime?: boolean): string {
        return (
            date.getDate() + '.' + (date.getMonth() + 1) + ' ' + date.getFullYear() +
            (!showTime ? '' : ', ' + this.getLocaleTimeString(date))
        );
    },
    getLocaleTimeString(date: Date) {
        return date.getHours() + ':' + date.getMinutes();
    },
    getShortWeekDay(weekDay: number): string {
        const shortWeekDays = {
            0: 'Su',
            1: 'Ma',
            2: 'Ti',
            3: 'Ke',
            4: 'To',
            5: 'Pe',
            6: 'La'
        };
        return shortWeekDays[weekDay];
    },
    getLongWeekDay(weekDay: number): string {
        const shortWeekDays = {
            0: 'Sunnuntai',
            1: 'Maanantai',
            2: 'Tiistai',
            3: 'Keskiviikko',
            4: 'Torstai',
            5: 'Perjantai',
            6: 'Lauatai'
        };
        return shortWeekDays[weekDay];
    },
    getMonday(date: Date): Date {
        const d = new Date(date);
        d.setDate(d.getDate() + 1 - (d.getDay() || 7));
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d;
    }
};

export { arrayUtils, domUtils, dateUtils };
