import React from 'react';
import User from './User';
import Videos from './Videos';

class App extends React.Component {
    render() {
        return (
            <div className="ui main container">
                <div className="ui two column very relaxed stackable grid">
                    <div className="column">
                        <div className="ui container">
                            <Videos />
                        </div>
                    </div>
                    <div className="column">
                        <User />
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
