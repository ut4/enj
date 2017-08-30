import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

interface Props {
    exercise: Enj.API.ExerciseRecord;
    afterInsert?: Function;
    afterUpdate?: Function;
}

/**
 * Liikkeen luonti-, ja muokkauslomake.
 */
class ExerciseForm extends ValidatingComponent<Props, any> {
    private isInsert: boolean;
    public constructor(props, context) {
        super(props, context);
        this.isInsert = this.props.hasOwnProperty('afterInsert');
        this.evaluators = {
            name: [(input: any) => input && input.length >= 2 && input.length <= 64]
        };
        this.state = {
            name: props.exercise.name,
            validity: true
        };
    }
    private confirm() {
        this.props.exercise.name = this.state.name;
        return iocFactories.exerciseBackend()[this.isInsert ? 'insert' : 'TODO'](this.props.exercise)
            .then(
                () => {
                    this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.props.exercise);
                },
                () => {
                    iocFactories.notify()('Liikkeen ' + (this.isInsert ? 'lisä' : 'päivit') + 'ys epäonnistui', 'error');
                }
            );
    }
    public render() {
        return <div>
            <label class="input-set">
                <span>Nimi</span>
                <input name="name" value={ this.state.name } onInput={ e => this.receiveInputValue(e) }/>
                { validationMessage(this.evaluators.name[0], templates => templates.lengthBetween('Nimi', 2, 64)) }
            </label>
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false } closeBehaviour={ CloseBehaviour.WHEN_RESOLVED } isModal={ false }/>
        </div>;
    }
}

export default ExerciseForm;
