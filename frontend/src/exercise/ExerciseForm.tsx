import ValidatingComponent, { validationMessage } from 'src/ui/ValidatingComponent';
import FormButtons, { CloseBehaviour } from 'src/ui/FormButtons';
import iocFactories from 'src/ioc';

interface Props {
    exercise: Enj.API.ExerciseRecord;
    afterInsert?: Function;
    afterUpdate?: Function;
}

interface State {
    exercise: Enj.API.ExerciseRecord;
    name: string;
}

/**
 * Liikkeen luonti-, ja muokkauslomake.
 */
class ExerciseForm extends ValidatingComponent<Props, State> {
    private isInsert: boolean;
    public constructor(props, context) {
        super(props, context);
        this.isInsert = this.props.hasOwnProperty('afterInsert');
        this.evaluators = {
            name: [(input: any) => input && input.length >= 2 && input.length <= 64]
        };
        this.state = {
            exercise: props.exercise,
            name: props.exercise.name,
            validity: true
        };
    }
    private confirm() {
        this.state.exercise.name = this.state.name;
        return (this.isInsert
            ? iocFactories.exerciseBackend().insert(this.state.exercise)
            : iocFactories.exerciseBackend().update(this.state.exercise, '/' + this.state.exercise.id)
        ).then(
            () => {
                this.props['after' + (this.isInsert ? 'Insert' : 'Update')](this.state.exercise);
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
                { this.isInsert || this.state.exercise.userId // userId = oma, !userId = globaali
                    ? [
                        <input name="name" value={ this.state.name } onInput={ e => this.receiveInputValue(e) }/>,
                        validationMessage(this.evaluators.name[0], templates => templates.lengthBetween('Nimi', 2, 64))
                    ]
                    : <input name="name" value={ this.state.name } disabled="disabled"/>
                }
            </label>
            <FormButtons onConfirm={ () => this.confirm() } shouldConfirmButtonBeDisabled={ () => this.state.validity === false } confirmButtonText={ this.isInsert ? 'Ok' : 'Tallenna' } closeBehaviour={ CloseBehaviour.WHEN_RESOLVED } isModal={ false }/>
        </div>;
    }
}

export default ExerciseForm;
