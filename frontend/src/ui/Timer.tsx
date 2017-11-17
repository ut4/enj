import Component from 'inferno-component';
import { dateUtils } from 'src/common/utils';

interface time {
    hours: string;
    minutes: string;
    seconds: string;
}

class Timer extends Component<{start: number, end: number}, {time: time, intervalId?: number}> {
    public constructor(props, context) {
        super(props, context);
        this.state = {time: this.makeTime(this.props)};
    }
    public componentDidMount() {
        !this.props.end && this.start();
    }
    public componentWillUnmount() {
        this.state.intervalId && this.stop();
    }
    public componentWillReceiveProps(props) {
        this.setState({time: this.makeTime(props)});
    }
    public start() {
        this.setState({intervalId: setInterval(() => {
            this.setState({time: this.makeTime(this.props)});
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
    private makeTime(props): time {
        const {start, end} = props;
        const diff = (end || Math.floor(Date.now() / 1000)) - start;
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = Math.floor(diff % 60);
        return {
            hours: dateUtils.getTwoDigitNumber(hours),
            minutes: dateUtils.getTwoDigitNumber(minutes),
            seconds: dateUtils.getTwoDigitNumber(seconds)
        };
    }
}

export default Timer;
