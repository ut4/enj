import IocContainer    from 'src/common/IocContainer';
import Db              from 'src/common/Db';
import Http            from 'src/common/Http';
import OfflineHttp     from 'src/common/OfflineHttp';
import { notify }      from 'src/ui/Notifier';
import { History, createHashHistory } from 'history';
import WorkoutBackend  from 'src/workout/WorkoutBackend';
import ExerciseBackend  from 'src/exercise/ExerciseBackend';
import UserState       from 'src/user/UserState';
import Offline         from 'src/offline/Offline';
const routerHistory = createHashHistory();

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
        return routerHistory;
    }

    // == Stat =================================================================
    public statBackend(): any {
        return null;
    }

    // == Workout ==============================================================
    public workoutBackend(): WorkoutBackend {
        return this.memoize('workoutBackend', () => new WorkoutBackend(this.http(), 'workout'));
    }
    public workoutExerciseHttp(): any {
        return null;
    }

    // == Program ==============================================================
    public programBackend(): any {
        return null;
    }

    // == Exercise =============================================================
    public exerciseBackend(): ExerciseBackend {
        return this.memoize('exerciseBackend', () => new ExerciseBackend(this.http(), 'exercise'));
    }

    // == Nutrition ============================================================
    public nutritionBackend(): any {
        return null;
    }

    // == User =================================================================
    public userState(): UserState {
        return this.memoize('userState', () => new UserState(this.db()));
    }
    public userBackend(): any {
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
