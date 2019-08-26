import React from 'react';

class ConversationList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.listConversations = this.listConversations.bind(this);
        this.onConvoClick = this.onConvoClick.bind(this);
        this.renderConversationList = this.renderConversationList.bind(this);
    }

    componentDidMount() {
        this.listConversations();
    }

    listConversations() {
        if (this.props.nexmoApp) {
            this.props.nexmoApp
                .getConversations()
                .then(conversations => {
                    console.log('*** Retrieved conversations', conversations);
                    this.setState({ conversationList: conversations });
                })
                .catch(err => {
                    console.log('error on listConversations:', err);
                });
        }
    }

    renderConversationList() {
        const convoArr = [];
        if (this.state.conversationList) {
            for (let item of this.state.conversationList.application
                .conversations) {
                const convoId = item[0];
                const convo = item[1];
                convoArr.push(
                    <div className="item" key={convoId}>
                        <div className="content">
                            <div
                                className="ui label"
                                onClick={() => this.onConvoClick(convo)}
                            >
                                <p>{convo.display_name || 'conversation'}</p>
                            </div>
                        </div>
                    </div>
                );
            }
        }
        return convoArr;
    }

    onConvoClick(conversation) {
        console.log('clicked convo, got converstaion', conversation);
        this.props.registerConvo(conversation);
    }

    render() {
        return <div>{this.renderConversationList()}</div>;
    }
}

export default ConversationList;
