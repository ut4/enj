import AbstractOfflineHandlerRegister from 'src/offline/AbstractOfflineHandlerRegister';
import OfflineHttp from 'src/common/OfflineHttp';

/**
 * Sisältää handerit, jotka vastaa /api/program/* -REST-pyynnöistä yhteydettömän
 * tilan aikana.
 */
class OfflineProgramHandlerRegister extends AbstractOfflineHandlerRegister<Enj.API.ProgramRecord> {
    /**
     * Rekisteröi kaikki /api/program/* offline-handlerit.
     */
    public registerHandlers(offlineHttp: OfflineHttp) {
        //
        offlineHttp.addHandler('POST', 'program', program => this.insert(program, '/mine'));
        offlineHttp.addHandler('PUT', 'program/*', program => this.update(program, '/mine'));
    }
}

export default OfflineProgramHandlerRegister;
