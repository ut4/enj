const arrayUtils = {
    /**
     * @param {Array} array
     * @param {string} direction 'up'|'down'
     * @param {number} at index
     * @returns {boolean}
     */
    swap: (array: Array<any>, direction: keyof {up: 1, down: 1}, at: number): boolean => {
        if ((direction === 'up' && at < 1) ||
            (direction === 'down' && at >= array.length - 1)) {
            return false;
        }
        const target = direction === 'up' ? at - 1 : at + 1;
        const tmp = array[at];
        array[at] = array[target];
        array[target] = tmp;
        return true;
    }
};

export {arrayUtils};
