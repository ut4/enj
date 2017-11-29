import Component from 'inferno-component';
import Form, { CloseBehaviour } from 'src/ui/Form';
import iocFactories from 'src/ioc';

/**
 * #/ohjelmat-näkymän Luo ohjelma -linkistä avautuva modal, jolla käyttäjä voi
 * valita valmiin templaatin jolla ohjelman luontilomake täytetään automaattisesti.
 */
class ProgramPreCreateModal extends Component<
    any,
    {programTemplates: Array<Enj.API.Program>; selectedTemplate: Enj.API.Program}
> {
    private noTemplate;
    public constructor(props, context) {
        super(props, context);
        this.noTemplate = {id: '', name: '- Ei pohjaa -'};
        this.state = {programTemplates: [], selectedTemplate: this.noTemplate};
    }
    public componentWillMount() {
        iocFactories.programBackend().getAll('/templates').then(
            programTemplates => this.setState({programTemplates}),
            () => {/*pass*/}
        );
    }
    public render() {
        return <div>
            <h3>Valitse ohjelmapohja</h3>
            <Form onConfirm={ () => this.confirm() } closeBehaviour={ CloseBehaviour.IMMEDIATE }>
                { this.state.programTemplates.length > 0 && <div class="input-set">
                    <select onChange={ e => this.receiveTemplateSelection(e) }>
                        { [this.noTemplate].concat(this.state.programTemplates).map((t, i) =>
                            <option value={ i } checked={ this.state.selectedTemplate.id === t.id }>{ t.name }</option>
                        ) }
                    </select>
                </div> }
                { this.state.selectedTemplate.id !== '' && <div class="end"><div class="box light airy">
                    <h4>{ this.state.selectedTemplate.name }</h4>
                    <div>{ this.state.selectedTemplate.description }</div>
                    <h4>Sisältö</h4>
                    { this.state.selectedTemplate.workouts.map(programWorkout =>
                        <div>{ programWorkout.name }: { programWorkout.exercises.map(pwe => pwe.exerciseName).join(', ') }</div>
                    ) }
                </div></div> }
            </Form>
        </div>;
    }
    private receiveTemplateSelection(e) {
        const index = parseInt(e.target.value, 10); // 0 == noTemplate
        this.setState({selectedTemplate: index
            ? this.state.programTemplates[index - 1]
            : this.noTemplate
        });
    }
    private confirm() {
        this.context.router.programTemplate = this.state.selectedTemplate.id !== ''
            ? this.makeNewProgramTemplate(this.state.selectedTemplate)
            : undefined;
        iocFactories.history().push('ohjelmat/luo-uusi');
    }
    private makeNewProgramTemplate(selectedTemplate: Enj.API.Program): Enj.API.Program {
        selectedTemplate.id = null;
        selectedTemplate.workouts.forEach(programWorkout => {
            programWorkout.id = null;
            programWorkout.programId = null;
            programWorkout.exercises.forEach(pwe => {
                pwe.id = null;
                pwe.programWorkoutId = null;
            });
            return programWorkout;
        });
        return selectedTemplate;
    }
}

export default ProgramPreCreateModal;
