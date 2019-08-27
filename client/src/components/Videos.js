import React from 'react';
import OT from '@opentok/client';
import axios from 'axios';
import { tokboxInfo } from './helpers/data.js'; // login info, not added to github

class Videos extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.initOTSession = this.initOTSession.bind(this);
    }

    componentDidMount() {
        OT.setLogLevel(OT.DEBUG);

        // major TODO: need to setup user accounts tied into the ones in User.js
        axios
            .get(tokboxInfo.serverBaseUrl + '/session')
            .then(async res => {
                console.log('got respsone from tokbox server', res);
                await this.setState({
                    apiKey: res.data.apiKey,
                    sessionId: res.data.sessionId,
                    token: res.data.token,
                });
                const session = await OT.initSession(
                    this.state.apiKey,
                    this.state.sessionId
                );
                await this.setState({ session });
                console.log('got tokbox session', session);
                this.initOTSession();
            })
            .catch(err =>
                console.log(
                    `error when getting ${tokboxInfo.serverBaseUrl}/session`,
                    err
                )
            );
    }

    async initOTSession() {
        if (!this.state.session) {
            console.log(
                'WARNING: started initOTSession but there was no session'
            );
            return;
        }

        // Create a publisher
        const publisher = await OT.initPublisher(
            'publisher',
            {
                insertMode: 'append',
                width: '260px',
                height: '260px',
            },
            err => {
                if (err) {
                    console.log('error on initPublisher:', err);
                } else {
                    console.log(
                        'initPublisher apparently finished successfully'
                    );
                }
            }
        );
        await this.setState({ publisher });

        // Connect to the session
        this.state.session.connect(this.state.token, error => {
            // If the connection is successful, publish to the session
            if (error) {
                console.log(
                    'error on connecting to the tokbox session:',
                    error
                );
            } else {
                this.state.session.publish(this.state.publisher, err =>
                    console.log('error on publishing to the session:', err)
                );
            }
        });

        // Subscribe to a newly created stream
        this.state.session.on('streamCreated', event => {
            console.log('session received streamCreated event');
            this.state.session.subscribe(
                event.stream,
                'subscriber',
                {
                    insertMode: 'append',
                    width: '260px',
                    height: '260px',
                },
                err => console.log('error on subscribing to session:', err)
            );
        });
    }

    render() {
        return (
            <div id="videos" className="ui container">
                <div className="ui card">
                    <div id="subscriber" className="visible content"></div>
                    <div className="content">
                        <div className="header">subscriber</div>
                    </div>
                </div>
                <div className="ui card">
                    <div id="publisher" className="visible content"></div>
                    <div className="content">
                        <div className="header">publisher</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Videos;
