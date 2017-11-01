import Component from 'inferno-component';
import ProgramForm from 'src/program/ProgramForm';

class ProgramCreateView extends Component<any, {newProgram: Enj.API.Program}> {
    private selectedProgramTemplate: Enj.API.Program;
    public componentWillMount() {
        this.selectedProgramTemplate = this.context.router.programTemplate;
    }
    public render() {
        const start = Math.floor(Date.now() / 1000);
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 2);
        return <div>
            <h2>Luo uusi treeniohjelma</h2>
            <ProgramForm program={ {
                name: '',
                start,
                end: Math.floor(endDate.getTime() / 1000),
                workouts: !this.selectedProgramTemplate ? [] : this.selectedProgramTemplate.workouts
            } } afterInsert={ () => null }/>
        </div>;
    }
}

export default ProgramCreateView;
