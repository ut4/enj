import IocContainer    from 'src/common/IocContainer';
import Db              from 'src/common/Db';
import Http            from 'src/common/Http';
import OfflineHttp     from 'src/common/OfflineHttp';
import { notify }      from 'src/ui/Notifier';
import { createHashHistory } from 'history';
import WorkoutBackend  from 'src/workout/WorkoutBackend';
import ExerciseBackend from 'src/exercise/ExerciseBackend';
import UserState       from 'src/user/UserState';
import AuthBackend     from 'src/auth/AuthBackend';
import AuthService     from 'src/auth/AuthService';
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
    public utils(): Enj.Utils {
        return this.memoize('utils', () => ({
            revealLoadingIndicator: () => document.body.classList.add('loading'),
            hideLoadingIndicator: () => document.body.classList.remove('loading')
        } as Enj.Utils));
    }

    // == Stat =================================================================
    public statBackend(): any {
        return null;
    }

    // == Workout ==============================================================
    public workoutBackend(): WorkoutBackend {
        return this.memoize('workoutBackend', () => new WorkoutBackend(this.http(), 'workout', this.userState()));
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
    public authBackend(): AuthBackend {
        return this.memoize('authBackend', () => new AuthBackend(this.http(), 'auth'));
    }
    public authService(): AuthService {
        return this.memoize('authService', () => new AuthService(this.authBackend(), this.userState()));
    }
    public userBackend(): any {
        return null;
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
