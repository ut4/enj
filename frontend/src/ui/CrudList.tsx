import Component from 'inferno-component';
import Modal from 'src/ui/Modal';

/**
 * Geneerinen muokattava lista, implementoi perustoiminnot kuten lisäys/muokkaus-
 * modalin avauksen, ja sen palauttaman uuden/muokatun itemin päivittämisen listaan.
 */
abstract class CrudList<T> extends Component<
    {list: Array<T>; onChange?: Function;},
    {list: Array<T>;}
> {
    protected originals: Array<T>;
    protected confirmButtonText = 'Lisää uusi';
    protected abstract ModalClass: new (...args: any[]) => Component<any, any & {afterInsert?: Function; afterUpdate?: Function}>;
    protected abstract modalPropName: string;
    public constructor(props, context) {
        super(props, context);
        this.state = {list: this.props.list};
        this.originals = this.props.list.map(item => this.clone(item));
    }
    /**
     * Palauttaa modifoimattoman staten.
     */
    public getOriginalList(): Array<T> {
        return this.originals;
    }
    public render() {
        let fieldCount = 1;
        return <div>
            <table class="crud-table striped dark-list responsive">
                <tbody>{ this.state.list.length
                    ? this.state.list.map((item, index) => {
                        const cells = this.getListItemContent(item, index);
                        fieldCount = cells.length + 1;
                        return <tr>{ cells.concat([<td>
                            <button class="icon-button edit-dark" onClick={ () => this.openEditModal(item, index) } title="Muokkaa"></button>
                            <button class="icon-button delete-dark" onClick={ () => this.deleteItem(index) } title="Poista"></button>
                        </td>]) }</tr>;
                    })
                    : <tr><td colspan={ fieldCount }>-</td></tr>
                }</tbody>
                <tfoot><tr>
                    <td colspan={ fieldCount }><button class="nice-button" onClick={ () => this.openAddModal() }>{ this.confirmButtonText }</button></td>
                </tr></tfoot>
            </table>
        </div>;
    }
    /**
     * Palauttaa kopion <T>:stä {item}. Tarvitaan originals-listan luomisessa.
     */
    protected abstract clone(item: T): T;
    /**
     * Palauttaa uuden <T>:n. Kutsutaan aina, kun avataan modal luontitarkoituksessa.
     */
    protected abstract new(): T;
    /**
     * Palauttaa listaan renderöivän sisällön.
     */
    protected abstract getListItemContent(item: T, index: number): Array<HTMLTableCellElement>;
    /**
     * Metodi, jolla perijä voi lisätä modal-propseihin {props} omat arvonsa.
     */
    protected getModalProps(props) {
        return props;
    }
    /**
     * Avaa <T>-modalin lisäysmoodissa.
     */
    protected openAddModal() {
        Modal.open(() =>
            <this.ModalClass { ...this.getModalProps({
                [this.modalPropName]: this.new(),
                afterInsert: newItem => {
                    const list = this.state.list;
                    list.push(newItem);
                    this.applyState(list);
                }
            }) }/>
        );
    }
    /**
     * Avaa <T>:n modaliin muokattavaksi.
     */
    protected openEditModal(item: T, index: number) {
        Modal.open(() =>
            <this.ModalClass { ...this.getModalProps({
                [this.modalPropName]: item,
                afterUpdate: () => {
                    const list = this.state.list;
                    list[index] = item;
                    this.applyState(list);
                }
            }) }/>
        );
    }
    /**
     * Poistaa <T>:n listalta kohdasta {index}.
     */
    protected deleteItem(index: number) {
        const list = this.state.list;
        list.splice(index, 1);
        this.applyState(list);
    }
    /**
     * Asettaa {list}:t stateen, ja passaa ne {this.props.onChange}-callbackille
     * jos sellainen on määritelty.
     */
    protected applyState(list: Array<T>) {
        this.props.onChange && this.props.onChange(list);
        this.setState({list});
    }
}

/**
 * Lisää muokattavaan listaan getInserted|Modified|DeletedItems -metodit.
 */
abstract class ChangeDetectingCrudList<T extends {id?: AAGUID}> extends CrudList<T> {
    /**
     * Palauttaa kaikki mountin jälkeen listaan lisätyt <T>:t.
     */
    public getInsertedItems(): Array<T> {
        return this.state.list.filter(item => !item.id);
    }
    /**
     * Palauttaa kaikki <T>:t, joiden tietoja on mountin jälkeen muutettu.
     */
    public getModifiedItems(): Array<T> {
        return this.state.list.filter(current => {
            const original = this.originals.find(o => o.id === current.id);
            return original && this.isChanged(current, original);
        });
    }
    /**
     * Palauttaa kaikki mountin jälkeen listalta poistetut <T>:t.
     */
    public getDeletedItems(): Array<T> {
        return this.originals.filter(a => !this.state.list.some(b => b.id === a.id));
    }
    /**
     * Palauttaa tiedon, onko <T>:n {a} tiedot muuttuneet verrattuna <T>:hen {b}.
     */
    protected abstract isChanged(current: T, original: T): boolean;
}

export default CrudList;
export { ChangeDetectingCrudList };
