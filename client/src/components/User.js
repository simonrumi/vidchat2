import React from 'react';
import axios from 'axios';
import { jwts } from './helpers/data';
import { getJWT, login } from './helpers/loginTools';
import Conversation from './Conversation';

class User extends React.Component {
    constructor(props) {
        super(props);
        this.state = { username: '' };
        this.createUser = this.createUser.bind(this);
        this.onUpdateUsername = this.onUpdateUsername.bind(this);
        this.findAndLoginUser = this.findAndLoginUser.bind(this);
    }

    onUpdateUsername(event) {
        this.setState({ username: event.target.value });
    }

    // TODO convert to async-await to tidy up the nested .then()
    createUser() {
        axios({
            method: 'post',
            url: '/createUser',
            headers: { 'Content-Type': 'application/json' },
            data: { name: this.state.username },
        })
            .then(async response => {
                console.log('createUser gave response.config.data:');
                console.log(JSON.parse(response.config.data).name);
                const name = JSON.parse(response.config.data).name;
                await this.setState({
                    userId: response.data.id,
                    username: name,
                });
                this.userUpdated(name);
            })
            .catch(err => {
                console.log(
                    'error creating user with name',
                    this.state.username
                );
                console.log(err);
            });
    }

    findAndLoginUser() {
        if (this.state.username && jwts[this.state.username]) {
            const token = jwts[this.state.username];
            this.loginUser(token);
        } else {
            // really should print this to screen
            console.log('user ' + this.state.username + ' not found');
        }
    }

    async userUpdated(name) {
        console.log('User.userUpdated called with user ', name);
        if (name) {
            const token = await getJWT(name);
            this.loginUser(token);
        }
    }

    async loginUser(token) {
        console.log('will log in the user named', this.state.username);
        const nexmoApp = await login(token);
        await this.setState({ nexmoApp: nexmoApp, token: token });
    }

    renderUserForm() {
        return (
            <div className="userinfo">
                <input
                    type="text"
                    value={this.state.username}
                    onChange={this.onUpdateUsername}
                />
                <button
                    className="ui blue basic button"
                    onClick={this.findAndLoginUser}
                >
                    login
                </button>
                <button
                    className="ui orange basic button"
                    onClick={this.createUser}
                >
                    create new user
                </button>
            </div>
        );
    }

    renderWelcome() {
        return (
            <div className="userinfo userconnected">
                <div>
                    Welcome{' '}
                    <span className="username">{this.state.username}</span>
                </div>
                <Conversation
                    nexmoApp={this.state.nexmoApp}
                    loggedIn={!!this.state.token}
                    username={this.state.username}
                />
            </div>
        );
    }

    render() {
        // used to use this.state.userId
        if (this.state.token) {
            return this.renderWelcome();
        } else {
            return this.renderUserForm();
        }
    }
}

export default User;
