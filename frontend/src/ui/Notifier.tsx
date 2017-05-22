import Component from 'inferno-component';

type messageLevel = {
    success: 1,
    info: 1,
    notice: 1,
    error: 1
};

interface Message {
    content: string;
    level: keyof messageLevel;
    tiemoutId?: number
}

class MessageContainer {
    public messages: Array<Message>;
    private subscriber: Notifier;
    public constructor() {
        this.messages = [];
    }
    public setSubscriber(subscriber: Notifier) {
        this.subscriber = subscriber;
    }
    public addMessage(message: Message) {
        this.messages.unshift(message);
        message.tiemoutId = window.setTimeout(this.removeMessage.bind(this), 8000);
        this.subscriber.onNotify(this.messages);
    }
    public removeMessage(message?: Message) {
        if (!message) {
            this.messages.pop();
        } else {
            clearTimeout(message.tiemoutId);
            this.messages.splice(this.messages.indexOf(message), 1);
        }
        this.subscriber.onNotify(this.messages);
    }
}

const messageContainerSingleton = new MessageContainer();

class Notifier extends Component<any, any> {
    messageContainer: MessageContainer;
    public constructor(props) {
        super(props);
        this.state = {messages: []};
        this.messageContainer = messageContainerSingleton;
    }
    public componentDidMount() {
        this.messageContainer.setSubscriber(this);
    }
    public onNotify(newMessages: Array<Message>) {
        this.setState({messages: newMessages});
    }
    public dismiss(message: Message) {
        this.messageContainer.removeMessage(message);
    }
    public render() {
        return (
            this.state.messages.length
            ? <div class="notifier">
                { this.state.messages.map(message =>
                    <div class={ 'notifier-message ' + message.level } onClick={ () => this.dismiss(message) }>
                        <span class="notifier-message-icon"></span>
                        <span class="notifier-message-text">{ message.content }</span>
                    </div>
                ) }
            </div>
            : <span></span>
        );
    }
}

declare type notify = (content: string, level: keyof messageLevel) => void;

/**
 * @param {string} content
 * @param {string} level 'success', 'info', 'notice', 'error'
 */
const notify = (content: string, level: keyof messageLevel) => {
    return messageContainerSingleton.addMessage({content, level});
};

export { Notifier, notify };
