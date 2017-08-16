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

export {arrayUtils, domUtils};
