import 'tests/common/DbTests';
import 'tests/common/HttpTests';
import 'tests/common/RESTBackendTests';
import 'tests/common/IocContainerTests';
import 'tests/common/OfflineHttpTests';
import 'tests/offline/OfflineTests';
import 'tests/offline/OfflineStartViewTests';
import 'tests/serviceworker/SWManagerTests';
import 'tests/ui/UserMenuTests';
import 'tests/user/UserStateTests';
import 'tests/workout/WorkoutViewTests';
import { mockHistory } from 'tests/mocks';
import iocFactories from 'src/ioc';

iocFactories.notify = () => () => null;
iocFactories.history = () => mockHistory;
QUnit.config.autostart = false;
QUnit.start();
