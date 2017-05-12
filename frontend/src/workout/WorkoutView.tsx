import Component from 'inferno-component';
import { Link } from 'inferno-router';

class WorkoutView extends Component<any, any> {
    render() {
        return (<div>
            <Link to="/treeni/tanaan/liike/lisaa">Lisää treeni</Link>
            /workout/WorkoutView.jsx
            { this.props.children }
        </div>);
    }
}

export default WorkoutView;
