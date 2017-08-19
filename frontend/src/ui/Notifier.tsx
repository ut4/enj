import Component from 'inferno-component';

type messageLevel = {
    success: 1;
    info: 1;
    notice: 1;
    error: 1;
};

interface Message {
    content: string;
    level: keyof messageLevel;
    tiemoutId?: number;
}

/**
 * Viittaa mountattuun notifier-komponenttiin. Yksi per applikaatio. ks.
 * componentDidMount().
 */
let instance: Notifier;

class Notifier extends Component<any, {messages: Array<Message>}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {messages: []};
    }
    public componentDidMount() {
        instance = this;
    }
    /**
     * Lisää viestin listaan, ja starttaa ajastimen, joka poistaa viestin listalta
     * mikäli sitä ei tehdä manuaalisesti ennen ajan päättymistä (oletus 8sek).
     */
    public addMessage(message: Message) {
        const messages = this.state.messages;
        message.tiemoutId = window.setTimeout(this.removeMessage.bind(this), 8000);
        messages.unshift(message);
        this.setState({messages});
    }
    /**
     * Poistaa viestin listalta, ja siivoaa viestille luodun ajastimen.
     */
    public removeMessage(message: Message) {
        const messages = this.state.messages;
        if (!message) { // timeoutista
            messages.pop();
        } else { // onClick-eventistä
            clearTimeout(message.tiemoutId);
            messages.splice(messages.indexOf(message), 1);
        }
        this.setState({messages});
    }
    public render() {
        return this.state.messages.length > 0 && <div class="notifier">
            { this.state.messages.map(message =>
                <div class={ 'notifier-message ' + message.level } onClick={ () => this.removeMessage(message) }>
                    <span class="notifier-message-icon"></span>
                    <span class="notifier-message-text">{ message.content }</span>
                </div>
            ) }
        </div>;
    }
}

type notify = (content: string, level: keyof messageLevel) => any;

/**
 * @param {string} content
 * @param {string} level 'success', 'info', 'notice', 'error'
 */
const notify = (content: string, level: keyof messageLevel) =>
    instance.addMessage({content, level});

export { Notifier, notify };
