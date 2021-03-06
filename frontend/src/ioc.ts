import IocContainer    from 'src/common/IocContainer';
import Db              from 'src/common/Db';
import Http            from 'src/common/Http';
import OfflineHttp     from 'src/common/OfflineHttp';
import { notify }      from 'src/ui/Notifier';
import { createHashHistory } from 'history';
import StatBackend     from 'src/stat/StatBackend';
import WorkoutBackend  from 'src/workout/WorkoutBackend';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import ProgramBackend  from 'src/program/ProgramBackend';
import UserState       from 'src/user/UserState';
import AuthBackend     from 'src/auth/AuthBackend';
import AuthService     from 'src/auth/AuthService';
import UserBackend     from 'src/user/UserBackend';
import Offline         from 'src/offline/Offline';
import SyncBackend     from 'src/offline/SyncBackend';
import settings        from 'src/config/settings';

const routerHistory = createHashHistory();

class IocFactories extends IocContainer {
    // == Common ===============================================================
    public db(): Db {
        return this.memoize('db', () => new Db());
    }
    public http(): Http {
        return this.memoize('http', () => new Http(window, this.offlineHttp(), this.userState(), settings.baseUrl + settings.baseApiNamespace));
    }
    public offlineHttp(): OfflineHttp {
        return this.memoize('offlineHttp', () => new OfflineHttp(this.db()));
    }
    public notify(): notify {
        return notify;
    }
    public history(): any {
        return routerHistory;
    }

    // == Stat =================================================================
    public statBackend(): StatBackend {
        return this.memoize('statBackend', () => new StatBackend(this.http()));
    }

    // == Workout ==============================================================
    public workoutBackend(): WorkoutBackend {
        return this.memoize('workoutBackend', () => new WorkoutBackend(this.http(), 'workout', this.userState()));
    }

    // == Program ==============================================================
    public programBackend(): ProgramBackend {
        return this.memoize('programBackend', () => new ProgramBackend(this.http(), 'program'));
    }

    // == Exercise =============================================================
    public exerciseBackend(): ExerciseBackend {
        return this.memoize('exerciseBackend', () => new ExerciseBackend(this.http(), 'exercise'));
    }

    // == User =================================================================
    public userState(): UserState {
        return this.memoize('userState', () => new UserState(this.db()));
    }
    public authBackend(): AuthBackend {
        return this.memoize('authBackend', () => new AuthBackend(this.http(), 'auth'));
    }
    public authService(): AuthService {
        return this.memoize('authService', () => new AuthService(this.authBackend(), this.userState()));
    }
    public userBackend(): UserBackend {
        return this.memoize('userBackend', () => new UserBackend(this.http(), 'user'));
    }

    // == Offline ==============================================================
    public offline(): Offline {
        return this.memoize('offline', () => new Offline(this.userState()));
    }
    public syncBackend(): SyncBackend {
        return this.memoize('syncBackend', () => new SyncBackend(this.http(), 'sync', this.offlineHttp()));
    }
}

export default new IocFactories();
