import React from 'react';
import OT from '@opentok/client';
import axios from 'axios';
import { tokboxInfo } from './helpers/data.js';

class Videos extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.initOTSession = this.initOTSession.bind(this);
    }

    componentDidMount() {
        OT.setLogLevel(OT.DEBUG);

        // quick experiment
        // const otSessionId = this.getOpentokSessionId();
        // const otSession = OT.initSession(tokboxInfo.apiKey, otSessionId);
        // console.log('got tokbox session', otSession);
        // this.setState({ session: otSession }, () => this.initOTSession());
        // return;
        /// end of experiment

        //this stuff below worked
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

    async getOpentokSessionId() {
        try {
            const response = await axios.get(
                tokboxInfo.devServerBaseUrl + '/opentokSessionId'
            );
            console.log('got sessionId:', response.body);
            const sessionId = response.body;
            return sessionId;
        } catch (err) {
            console.log('error getting opentok sessionId:', err);
        }
    }

    async getOpentokToken() {
        try {
            const response = await axios.get(
                tokboxInfo.devServerBaseUrl + '/opentokToken'
            );
            // response comes back as a string like
            // T1==NWUxZjQ3YzIyZDUwN2IxOGE3O
            const otToken = response.body.split['=='][1];
            return otToken;
        } catch (err) {
            console.log('error getting opentok token:', err);
        }
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
