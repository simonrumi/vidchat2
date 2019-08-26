import nexmoClient from 'nexmo-client';
import axios from 'axios';

export async function getJWT(username) {
    try {
        const response = await axios({
            method: 'post',
            url: '/getJWT',
            headers: { 'Content-Type': 'application/json' },
            data: { name: username },
        });
        console.log('in getJWT, response.data.jwt is:');
        console.log(response.data.jwt);
        return response.data.jwt;
    } catch (err) {
        console.log(
            '/getJWT api called with username ' +
                username +
                'but returned this error:\n'
        );
        console.log(err);
    }
}

export async function login(token) {
    const nexmo = new nexmoClient();
    try {
        return await nexmo.login(token); //nexmo.login returns a nexmo app
    } catch (err) {
        console.log(
            'nexmo.login() called with token:\n' +
                token +
                '\nbut had this error:\n'
        );
        console.log(err);
    }
}
