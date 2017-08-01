import Component from 'inferno-component';

interface time {
    hours: string;
    minutes: string;
    seconds: string;
}

class Timer extends Component<{start: number, end: number}, {time: time, intervalId?: number}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {time: this.makeTime()};
    }
    public componentDidMount() {
        !this.props.end && this.start();
    }
    public componentWillUnmount() {
        this.state.intervalId && this.stop();
    }
    private makeTime(): time {
        const {start, end} = this.props;
        const diff = (end || Math.floor(Date.now() / 1000)) - start;
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = Math.floor(diff % 60);
        return {
            hours: hours > 9 ? hours.toString() : '0' + hours,
            minutes: minutes > 9 ? minutes.toString() : '0' + minutes,
            seconds: seconds > 9 ? seconds.toString() : '0' + seconds
        };
    }
    public start() {
        this.setState({intervalId: setInterval(() => {
            this.setState({time: this.makeTime()});
        }, 1000)});
    }
    public stop() {
        clearInterval(this.state.intervalId);
    }
    public render() {
        return <span>
            { this.state.time.hours }:{ this.state.time.minutes }:{ this.state.time.seconds }
        </span>;
    }
}

export default Timer;
