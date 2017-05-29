import IocContainer    from 'src/common/IocContainer';
import Db              from 'src/common/Db';
import Http            from 'src/common/Http';
import OfflineHttp     from 'src/common/OfflineHttp';
import { notify }      from 'src/ui/Notifier';
import { History, createBrowserHistory } from 'history';
import WorkoutBackend  from 'src/workout/WorkoutBackend';
import UserState       from 'src/user/UserState';
import Offline         from 'src/offline/Offline';
const popStateHistory = createBrowserHistory();

class IocFactories extends IocContainer {
    // == Common ===============================================================
    public db(): Db {
        return this.memoize('db', () => new Db());
    }
    public http(): Http {
        return this.memoize('http', () => new Http(window, this.offlineHttp(), this.userState(), '/'));
    }
    public offlineHttp(): OfflineHttp {
        return this.memoize('offlineHttp', () => new OfflineHttp(this.db()));
    }
    public notify(): notify {
        return notify;
    }
    public history(): History {
        return popStateHistory;
    }

    // == Stat =================================================================
    public statHttp(): any {
        return null;
    }

    // == Workout ==============================================================
    public workoutBackend(): any {
        return this.memoize('workoutRepo', () => new WorkoutBackend(this.http(), 'workout'));
    }
    public workoutExerciseHttp(): any {
        return null;
    }

    // == Program ==============================================================
    public programHttp(): any {
        return null;
    }

    // == Exercise =============================================================
    public exerciseHttp(): any {
        return null;
    }

    // == Nutrition ============================================================
    public nutritionHttp(): any {
        return null;
    }

    // == User =================================================================
    public userState(): UserState {
        return this.memoize('userState', () => new UserState(this.db()));
    }
    public userHttp(): any {
        return null;
    }

    // == Offline ==============================================================
    public offline(): Offline {
        return this.memoize('offline', () => new Offline(this.userState()));
    }
    public syncer(): any {
        return null;
    }
}

export default new IocFactories();
