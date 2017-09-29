import RESTBackend  from 'src/common/RESTBackend';

/**
 * Vastaa /api/program -REST-pyynnöistä.
 */
class ProgramBackend extends RESTBackend<Enj.API.ProgramRecord> {
    get(url?: string): any {
        throw new Error('Not implemented');
    }
    public update(data: any, url?: string): any {
        throw new Error('Not implemented');
    }
    public delete(data: any, url?: string): any {
        throw new Error('Not implemented');
    }
}

export default ProgramBackend;
