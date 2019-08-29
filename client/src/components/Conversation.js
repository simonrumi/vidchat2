import React from 'react';
import ConversationList from './ConversationList';

class Conversation extends React.Component {
    constructor(props) {
        super(props);
        this.state = { messageText: '', messageFeed: [] };

        //TODO work out which of these actually need the .bind(this) on them
        this.createConversation = this.createConversation.bind(this);
        this.onUpdateText = this.onUpdateText.bind(this);
        this.onSendText = this.onSendText.bind(this);
        this.watchConvo = this.watchConvo.bind(this);
        this.registerConvo = this.registerConvo.bind(this);
        this.addEntryToFeed = this.addEntryToFeed.bind(this);
        this.joinConvo = this.joinConvo.bind(this);
    }

    createConversation() {
        const displayName = this.props.username + "'s conversation";
        this.props.nexmoApp
            .newConversation({ display_name: displayName })
            .then(async convo => {
                await convo
                    .join()
                    .then(member => {
                        this.setState({ conversation: convo });
                    })
                    .catch(err =>
                        console.log(
                            'after creating conversation, error when trying to join that conversation:',
                            err
                        )
                    );
                this.watchConvo();
            });
    }

    async registerConvo(conversation) {
        console.log('in registerConvo, about to registerConvo', conversation);
        await this.setState({ conversation });
        this.props.nexmoApp.on('member:invited', (member, event) => {
            // if block from the tutorial...unclear on what the condition is all about
            // so far haven't seen how we would get into this block
            //identify the sender and type of conversation.
            if (event.body.cname.indexOf('CALL') != 0 && member.invited_by) {
                console.log('*** Invitation received:', event);
                //accept an invitation.
                this.props.nexmoApp
                    .getConversation(event.cid || event.body.cname)
                    .then(async conversation => {
                        // quick test: does this get the same convo as the one we have already?
                        if (conversation !== this.state.conversation) {
                            console.log(
                                'WARNING: conversation !== this.state.conversation'
                            );
                            await this.joinConvo(conversation);
                        }
                    })
                    .catch(err =>
                        console.log(
                            'error after nexmoApp.getConversation():',
                            err
                        )
                    );
            }
        });
        await this.joinConvo();
        this.watchConvo();
    }

    async joinConvo() {
        if (!this.state.conversation) {
            throw new Error('Error in joinConvo - no conversation to join');
        }
        if (
            !this.state.conversation.me ||
            this.state.conversation.me.user.id !== this.props.userId
        ) {
            await this.state.conversation
                .join()
                .catch(err =>
                    console.log('error when trying to join conversation:', err)
                );
        }
    }

    watchConvo() {
        console.log('started watchConvo');
        if (!this.state.conversation) {
            console.log(
                'Warning: watchConvo() was called but there was no conversation to watch'
            );
            return;
        }
        this.state.conversation.on('text', (member, textEvent) => {
            console.log('Message received by Conversation:', member, textEvent);
            const date = new Date(
                Date.parse(textEvent.timestamp)
            ).toUTCString();
            this.addEntryToFeed({
                id: textEvent.id,
                member: member.user.name,
                timestring: date,
                message: textEvent.body.text,
            });
        });
        this.state.conversation.on('member:joined', (member, joinedEvent) => {
            const date = new Date(
                Date.parse(joinedEvent.timestamp)
            ).toUTCString();
            console.log(`*** ${member.user.name} joined the conversation`);
            const text = `${member.user.name} @ ${date}: joined the conversation`;
            this.addEntryToFeed({
                id: joinedEvent.id,
                member: member.user.name,
                timestring: date,
                message: text,
            });
        });
    }

    onUpdateText(event) {
        this.setState({ messageText: event.target.value });
    }

    onSendText() {
        console.log(
            'Conversation.onSendText() about to send: ' + this.state.messageText
        );
        this.state.conversation
            .sendText(this.state.messageText)
            .then(textEvt => {
                console.log(textEvt);
                this.setState({ messageText: '' });
            })
            .catch(err => {
                console.log('error sending text: ', err);
            });
    }

    addEntryToFeed(entry) {
        const newFeed = [entry, ...this.state.messageFeed];
        this.setState({ messageFeed: newFeed });
        console.log('messageFeed = ', JSON.stringify(this.state.messageFeed));
    }

    renderMessageFeed() {
        return this.state.messageFeed.map(feedEntry => {
            return (
                <div className="item" key={feedEntry.id}>
                    <div className="content">
                        <div className="extra">
                            <span className="ui label">{feedEntry.member}</span>
                            <span className="cinema">
                                {feedEntry.timestring}
                            </span>
                        </div>
                        <div className="description">{feedEntry.message}</div>
                    </div>
                </div>
            );
        });
    }

    renderConvoDisplay() {
        return (
            <div className="conversation ">
                <div id="messages">
                    <h1>Messages</h1>
                    <div id="messageFeed" className="ui unstackable items">
                        {this.renderMessageFeed()}
                    </div>
                    <textarea
                        id="messageTextarea"
                        value={this.state.messageText}
                        onChange={this.onUpdateText}
                    ></textarea>
                    <br />
                    <button
                        className="ui blue basic button"
                        id="send"
                        onClick={this.onSendText}
                    >
                        Send
                    </button>
                </div>
            </div>
        );
    }

    renderConvoBtn() {
        return (
            <div className="conversation">
                <button
                    className="ui blue basic button"
                    onClick={this.createConversation}
                    disabled={!this.props.loggedIn}
                >
                    new conversation
                </button>
            </div>
        );
    }

    // TODO - if we had redux then nexmoApp could be in the store
    //and it wouldn't have to be passed from component to component
    render() {
        if (this.state.conversation) {
            console.log('about to renderConvoDisplay()');
            return this.renderConvoDisplay();
        } else {
            console.log('about to create ConversationList');
            return (
                <div>
                    <ConversationList
                        nexmoApp={this.props.nexmoApp}
                        registerConvo={this.registerConvo}
                    />
                    {this.renderConvoBtn()}
                </div>
            );
        }
    }
}

export default Conversation;
