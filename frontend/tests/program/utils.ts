import iocFactories from 'src/ioc';

const programTestUtils = {
    getExpectedDateStr(unixTime: number): string {
        return iocFactories.dateUtils().getLocaleDateString(new Date(unixTime * 1000));
    },
    getSomeTestPrograms(): Array<Enj.API.ProgramRecord> {
        return [
            {id:'uuid1', name: 'foo', start: 323384400, end: 323470800, userId: 'u'},
            {id:'uuid2', name: 'bar', start: 318204000, end: 318290400, description: '...', userId: 'u'}
        ];
    }
};

export default programTestUtils;
